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

import re
import stat

def _safe_rmtree(path: str):
    if not path or not os.path.exists(path):
        return
    def on_err(func, p, exc_info):
        try:
            os.chmod(p, stat.S_IWRITE)
            func(p)
        except Exception:
            pass
    shutil.rmtree(path, onerror=on_err)

def _fetch_github_repo(repo_url: str, branch: Optional[str] = None) -> str:
    url = repo_url.strip()
    if not url.startswith("http://") and not url.startswith("https://"):
        raise ValueError("Invalid GitHub repository URL. Must start with https://")

    clean_url = url.rstrip("/")
    if clean_url.endswith(".git"):
        clean_url = clean_url[:-4]

    # Parse owner, repo, and optional branch from tree/blob URLs
    tree_match = re.search(r"github\.com/([^/]+)/([^/]+?)(?:/(?:tree|blob)/([^/]+(?:/[^/]+)*))?/?$", clean_url)
    if tree_match:
        owner = tree_match.group(1)
        repo_name = tree_match.group(2)
        url_branch = tree_match.group(3)
        clean_url = f"https://github.com/{owner}/{repo_name}"
        if not branch and url_branch:
            branch = url_branch.split("/")[0]

    temp_dir = tempfile.mkdtemp(prefix="git_repo_")

    # 1. Try Git CLI first with optimized flags and generous timeout
    try:
        env = os.environ.copy()
        env["GIT_TERMINAL_PROMPT"] = "0"
        env["GIT_ASKPASS"] = "echo"

        cmd = [
            "git", "clone",
            "--depth", "1",
            "--single-branch",
            "--no-tags",
            "--recurse-submodules=no"
        ]
        if branch:
            cmd.extend(["-b", branch])
        cmd.extend([f"{clean_url}.git", temp_dir])

        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=120, env=env)
        if proc.returncode == 0 and os.path.exists(temp_dir) and os.listdir(temp_dir):
            return temp_dir
    except Exception:
        pass

    # 2. Fallback to GitHub Archive ZIP Download (streams to disk)
    try:
        branches_to_try = [branch] if branch else ["main", "master"]
        for try_b in branches_to_try:
            archive_url = f"{clean_url}/archive/refs/heads/{try_b}.zip"
            zip_path = os.path.join(temp_dir, f"repo_{try_b}.zip")

            try:
                with httpx.Client(follow_redirects=True, timeout=120.0) as client:
                    with client.stream("GET", archive_url) as resp:
                        if resp.status_code == 200:
                            with open(zip_path, "wb") as f:
                                for chunk in resp.iter_bytes(chunk_size=65536):
                                    f.write(chunk)

                            # Extract selectively
                            with zipfile.ZipFile(zip_path, "r") as z:
                                extracted_count = 0
                                for member in z.infolist():
                                    if member.is_dir():
                                        continue
                                    norm = member.filename.replace("\\", "/")
                                    parts = [p.lower() for p in norm.split("/")]
                                    from ..processors.input_processor import IGNORED_DIRS, BINARY_EXTENSIONS
                                    if any(p in IGNORED_DIRS for p in parts[:-1]):
                                        continue
                                    ext = os.path.splitext(parts[-1])[1]
                                    if ext in BINARY_EXTENSIONS:
                                        continue
                                    if member.file_size > 1024 * 1024:
                                        continue
                                    z.extract(member, temp_dir)
                                    extracted_count += 1
                                    if extracted_count >= 600:
                                        break

                            os.remove(zip_path)
                            return temp_dir
            except Exception:
                continue
    except Exception as e:
        _safe_rmtree(temp_dir)
        raise ValueError(f"Failed to clone or fetch repository: {str(e)}")

    _safe_rmtree(temp_dir)
    raise ValueError(f"Could not clone repository from '{repo_url}'. Please ensure repository is public and URL or branch is correct.")

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
            _safe_rmtree(temp_dir)

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
            _safe_rmtree(temp_dir)