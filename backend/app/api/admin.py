from fastapi import APIRouter, Depends, HTTPException, Header, status
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from ..database.database import get_db
from ..services.admin_service import AdminService

router = APIRouter(prefix="/admin", tags=["Secret Admin Gateway"])

class AdminVerifyRequest(BaseModel):
    secret_key: str

def verify_admin_header(x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key")):
    if not x_admin_key or not AdminService.verify_secret_key(x_admin_key):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Invalid or missing secret admin authorization key."
        )
    return x_admin_key

@router.post("/auth/verify")
def verify_admin_passkey(req: AdminVerifyRequest):
    if not AdminService.verify_secret_key(req.secret_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid secret admin security passkey."
        )
    return {
        "status": "success",
        "message": "Secret Admin Access Authorized.",
        "admin_key": req.secret_key.strip()
    }

@router.get("/stats")
def get_system_statistics(
    admin_auth: str = Depends(verify_admin_header),
    db: Session = Depends(get_db)
):
    stats = AdminService.get_system_stats(db)
    return {
        "status": "success",
        "data": stats
    }

@router.get("/users")
def list_all_registered_users(
    admin_auth: str = Depends(verify_admin_header),
    db: Session = Depends(get_db)
):
    users = AdminService.get_all_users(db)
    return {
        "status": "success",
        "count": len(users),
        "users": users
    }

@router.get("/reviews")
def get_all_users_reviews(
    user_id: Optional[str] = None,
    risk_level: Optional[str] = None,
    language: Optional[str] = None,
    admin_auth: str = Depends(verify_admin_header),
    db: Session = Depends(get_db)
):
    reviews = AdminService.get_all_reviews(
        db=db,
        user_id=user_id,
        risk_level=risk_level,
        language=language
    )
    return {
        "status": "success",
        "count": len(reviews),
        "reviews": reviews
    }

@router.delete("/reviews/{review_id}")
def admin_delete_review(
    review_id: str,
    admin_auth: str = Depends(verify_admin_header),
    db: Session = Depends(get_db)
):
    success = AdminService.delete_review(db, review_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Review '{review_id}' not found.")
    return {
        "status": "success",
        "message": f"Review '{review_id}' permanently deleted by admin."
    }

@router.delete("/users/{user_id}")
def admin_delete_user(
    user_id: str,
    admin_auth: str = Depends(verify_admin_header),
    db: Session = Depends(get_db)
):
    success = AdminService.delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"User '{user_id}' not found.")
    return {
        "status": "success",
        "message": f"User '{user_id}' and all associated reviews permanently deleted by admin."
    }