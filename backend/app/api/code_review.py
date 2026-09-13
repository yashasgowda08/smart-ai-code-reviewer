import os
from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

from ..database.database import get_db
from ..processors.input_processor import InputProcessor
from ..services.review_service import ReviewService

router = APIRouter(prefix="/code-review", tags=["Code Review"])

class AnalyzeRequest(BaseModel):
    code: str
    filename: Optional[str] = "snippet.py"
    language: Optional[str] = "auto"

@router.post("/analyze")
def analyze_pasted_code(
    req: AnalyzeRequest,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
    db: Session = Depends(get_db)
):
    user_id = x_user_id.strip() if x_user_id and x_user_id.strip() else "ANONYMOUS_USER"
    try:
        processed = InputProcessor.process_pasted_code(
            code=req.code,
            filename=req.filename,
            language=req.language
        )
        result = ReviewService.execute_review(db=db, processed_input=processed, user_id=user_id)
        return {
            "status": "success",
            "data": result
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Review analysis failed: {str(e)}")

@router.post("/upload")
async def upload_code_file(
    file: UploadFile = File(...),
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
    db: Session = Depends(get_db)
):
    user_id = x_user_id.strip() if x_user_id and x_user_id.strip() else "ANONYMOUS_USER"
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No filename provided.")

    try:
        content = await file.read()
        processed = InputProcessor.process_uploaded_file(file_bytes=content, filename=file.filename)
        result = ReviewService.execute_review(db=db, processed_input=processed, user_id=user_id)
        return {
            "status": "success",
            "data": result
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"File upload review failed: {str(e)}")

@router.get("/report/{report_name}")
def download_report(report_name: str):
    # Sanitize report name to prevent path traversal
    safe_name = os.path.basename(report_name)
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    reports_dir = os.path.join(base_dir, "reports")
    file_path = os.path.join(reports_dir, safe_name)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PDF report not found.")

    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=safe_name
    )

@router.post("/multi-upload")
async def upload_multiple_code_files(
    files: list[UploadFile] = File(...),
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
    db: Session = Depends(get_db)
):
    user_id = x_user_id.strip() if x_user_id and x_user_id.strip() else "ANONYMOUS_USER"
    if not files:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No files provided.")

    file_items = []
    for f in files:
        if f.filename:
            content = await f.read()
            file_items.append({"filename": f.filename, "content": content})

    try:
        processed = InputProcessor.process_multiple_files(file_items, target_name=f"{len(file_items)} files batch")
        result = ReviewService.execute_review(db=db, processed_input=processed, user_id=user_id)
        return {
            "status": "success",
            "data": result
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Multi-file review failed: {str(e)}")
