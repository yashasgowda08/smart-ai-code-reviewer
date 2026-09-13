from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from ..processors.input_processor import InputProcessor

router = APIRouter(prefix="/repository", tags=["Repository"])

class RepoReadRequest(BaseModel):
    path: str

@router.post("/read")
def read_repository_directory(req: RepoReadRequest):
    try:
        processed = InputProcessor.process_directory(dir_path=req.path, source_type="repository", target_name=req.path)
        return {
            "status": "success",
            "data": {
                "target_name": processed["target_name"],
                "primary_language": processed["primary_language"],
                "total_files": processed["total_files"],
                "total_lines": processed["total_lines"],
                "files_summary": [{"filename": f["filename"], "language": f["language"], "lines": f["lines_count"]} for f in processed["files"]]
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to inspect directory: {str(e)}")