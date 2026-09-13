import hashlib
import os
import secrets
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from ..database.models import User

class AuthService:
    @staticmethod
    def hash_password(password: str) -> str:
        salt = secrets.token_hex(16)
        key = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt.encode("utf-8"),
            100000
        )
        return f"{salt}${key.hex()}"

    @staticmethod
    def verify_password(plain_password: str, stored_hash: str) -> bool:
        try:
            salt, hex_key = stored_hash.split("$")
            new_key = hashlib.pbkdf2_hmac(
                "sha256",
                plain_password.encode("utf-8"),
                salt.encode("utf-8"),
                100000
            )
            return secrets.compare_digest(new_key.hex(), hex_key)
        except Exception:
            return False

    @classmethod
    def register_user(cls, db: Session, user_id: str, password: str, confirm_password: str) -> Dict[str, Any]:
        user_id = user_id.strip() if user_id else ""
        if not user_id:
            raise ValueError("User ID is required.")
        if len(user_id) < 3 or len(user_id) > 32:
            raise ValueError("User ID must be between 3 and 32 characters.")
        if not password:
            raise ValueError("Password is required.")
        if len(password) < 6:
            raise ValueError("Password must be at least 6 characters long.")
        if password != confirm_password:
            raise ValueError("Password and Confirm Password do not match.")

        # Check for existing user
        existing = db.query(User).filter(User.id == user_id).first()
        if existing:
            raise ValueError(f"User ID '{user_id}' already exists. Please choose a different User ID.")

        pwd_hash = cls.hash_password(password)
        new_user = User(id=user_id, password_hash=pwd_hash)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return {
            "status": "success",
            "message": "User registered successfully.",
            "user_id": new_user.id
        }

    @classmethod
    def login_user(cls, db: Session, user_id: str, password: str) -> Dict[str, Any]:
        user_id = user_id.strip() if user_id else ""
        if not user_id or not password:
            raise ValueError("User ID and Password are required.")

        user = db.query(User).filter(User.id == user_id).first()
        if not user or not cls.verify_password(password, user.password_hash):
            raise ValueError("Invalid User ID or Password.")

        return {
            "status": "success",
            "message": "Login successful.",
            "user_id": user.id
        }