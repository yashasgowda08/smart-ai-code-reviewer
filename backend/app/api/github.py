import os
import shutil
import tempfile
import subprocess
import httpx
import zipfile
from fastapi import APIRouter, Depends, HTTPException, Header, status
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

from ..database.database import get_db
from ..processors.input_processor import InputProcessor
from ..services.review_service import ReviewService

router = APIRouter(prefix="/github", tags=["GitHub"])

class GithubRequest(BaseModel):
    repo_url: str
    branch: Optional[str] = None

def _fetch_github_repo(repo_url: str, branch: Optional[str] = None) -> str:
    url = repo_url.strip()
    if not url.startswith("http://") and not url.startswith("https://"):
        raise ValueError("Invalid GitHub repository URL. Must start with https://")

    # Clean repo url
    clean_url = url.rstrip("/")
    if clean_url.endswith(".git"):
        clean_url = clean_url[:-4]

    temp_dir = tempfile.mkdtemp(prefix="git_repo_")

    # Try Git CLI first
    try:
        cmd = ["git", "clone", "--depth", "1"]
        if branch:
            cmd.extend(["-b", branch])
        cmd.extend([f"{clean_url}.git", temp_dir])
        
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=45)
        if proc.returncode == 0 and os.path.exists(temp_dir) and os.listdir(temp_dir):
            return temp_dir
    except Exception:
        pass

    # Fallback to GitHub Archive ZIP Download (works without git installed or for public repos)
    try:
        target_branch = branch if branch else "main"
        archive_url = f"{clean_url}/archive/refs/heads/{target_branch}.zip"
        
        with httpx.Client(follow_redirects=True, timeout=30.0) as client:
            resp = client.get(archive_url)
            if resp.status_code != 200 and not branch:
                # Try 'master' branch fallback
                archive_url = f"{clean_url}/archive/refs/heads/master.zip"
                resp = client.get(archive_url)

            if resp.status_code == 200:
                zip_path = os.path.join(temp_dir, "repo.zip")
                with open(zip_path, "wb") as f:
                    f.write(resp.content)
                with zipfile.ZipFile(zip_path, "r") as z:
                    z.extractall(temp_dir)
                os.remove(zip_path)
                return temp_dir
    except Exception as e:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise ValueError(f"Failed to clone or fetch repository: {str(e)}")

    shutil.rmtree(temp_dir, ignore_errors=True)
    raise ValueError(f"Could not clone repository from '{repo_url}'. Please ensure repository is public and URL is correct.")

@router.post("/clone")
def clone_github_repo(req: GithubRequest):
    temp_dir = None
    try:
        temp_dir = _fetch_github_repo(req.repo_url, req.branch)
        repo_name = req.repo_url.rstrip("/").split("/")[-1].replace(".git", "")
        processed = InputProcessor.process_directory(dir_path=temp_dir, source_type="github", target_name=repo_name)
        return {
            "status": "success",
            "repo_name": repo_name,
            "total_files": processed["total_files"],
            "total_lines": processed["total_lines"],
            "primary_language": processed["primary_language"],
            "files": [{"filename": f["filename"], "language": f["language"], "lines": f["lines_count"]} for f in processed["files"]]
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"GitHub clone failed: {str(e)}")
    finally:
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)

@router.post("/review")
def review_github_repo(
    req: GithubRequest,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
    db: Session = Depends(get_db)
):
    user_id = x_user_id.strip() if x_user_id and x_user_id.strip() else "ANONYMOUS_USER"
    temp_dir = None
    try:
        temp_dir = _fetch_github_repo(req.repo_url, req.branch)
        repo_name = req.repo_url.rstrip("/").split("/")[-1].replace(".git", "")
        processed = InputProcessor.process_directory(dir_path=temp_dir, source_type="github", target_name=repo_name)
        result = ReviewService.execute_review(db=db, processed_input=processed, user_id=user_id)
        return {
            "status": "success",
            "data": result
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"GitHub review failed: {str(e)}")
    finally:
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)