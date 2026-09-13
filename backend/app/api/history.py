from fastapi import APIRouter, Depends, HTTPException, Header, status
from typing import Optional
from sqlalchemy.orm import Session

from ..database.database import get_db
from ..services.history_service import HistoryService

router = APIRouter(prefix="/history", tags=["Review History"])

@router.get("")
@router.get("/")
def get_user_history(
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
    db: Session = Depends(get_db)
):
    if not x_user_id or not x_user_id.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="X-User-ID header is required.")
    
    user_id = x_user_id.strip()
    reviews = HistoryService.get_user_history(db=db, user_id=user_id)
    return {
        "status": "success",
        "user_id": user_id,
        "count": len(reviews),
        "reviews": reviews
    }

@router.get("/{review_id}")
def get_single_review(
    review_id: str,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
    db: Session = Depends(get_db)
):
    user_id = x_user_id.strip() if x_user_id else None
    review = HistoryService.get_review_by_id(db=db, review_id=review_id, user_id=user_id)
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Review '{review_id}' not found.")
    return {
        "status": "success",
        "review": review
    }

@router.delete("/{review_id}")
def delete_single_review(
    review_id: str,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
    db: Session = Depends(get_db)
):
    if not x_user_id or not x_user_id.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="X-User-ID header is required.")
    
    user_id = x_user_id.strip()
    deleted = HistoryService.delete_review_by_id(db=db, review_id=review_id, user_id=user_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Review '{review_id}' not found or unauthorized.")
    return {
        "status": "success",
        "message": f"Review '{review_id}' deleted successfully."
    }

@router.delete("")
@router.delete("/")
def clear_all_history(
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
    db: Session = Depends(get_db)
):
    if not x_user_id or not x_user_id.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="X-User-ID header is required.")
    
    user_id = x_user_id.strip()
    count = HistoryService.clear_user_history(db=db, user_id=user_id)
    return {
        "status": "success",
        "message": f"All history cleared for user '{user_id}'.",
        "deleted_count": count
    }