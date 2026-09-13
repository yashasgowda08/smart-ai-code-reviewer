from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..database.database import get_db
from ..services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])

class RegisterRequest(BaseModel):
    user_id: str
    password: str
    confirm_password: str

class LoginRequest(BaseModel):
    user_id: str
    password: str

@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    try:
        res = AuthService.register_user(
            db=db,
            user_id=req.user_id,
            password=req.password,
            confirm_password=req.confirm_password
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Registration failed.")

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    try:
        res = AuthService.login_user(
            db=db,
            user_id=req.user_id,
            password=req.password
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Login failed.")