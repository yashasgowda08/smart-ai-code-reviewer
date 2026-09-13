import os
import secrets
import json
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database.models import User, Review

ADMIN_SECRET_KEY = os.getenv("ADMIN_SECRET_KEY", "ADMIN_SUPER_KEY_2026_AI_REVIEWER").strip()

class AdminService:
    @staticmethod
    def verify_secret_key(provided_key: str) -> bool:
        if not provided_key:
            return False
        return secrets.compare_digest(provided_key.strip(), ADMIN_SECRET_KEY)

    @staticmethod
    def get_system_stats(db: Session) -> Dict[str, Any]:
        total_users = db.query(func.count(User.id)).scalar() or 0
        total_reviews = db.query(func.count(Review.id)).scalar() or 0
        
        avg_score = db.query(func.avg(Review.overall_score)).scalar() or 0
        avg_risk = db.query(func.avg(Review.risk_score)).scalar() or 0

        # Risk breakdown
        low_count = db.query(func.count(Review.id)).filter(Review.risk_level == "LOW").scalar() or 0
        med_count = db.query(func.count(Review.id)).filter(Review.risk_level == "MEDIUM").scalar() or 0
        high_count = db.query(func.count(Review.id)).filter(Review.risk_level == "HIGH").scalar() or 0
        crit_count = db.query(func.count(Review.id)).filter(Review.risk_level == "CRITICAL").scalar() or 0

        # Language breakdown
        lang_rows = db.query(Review.language, func.count(Review.id)).group_by(Review.language).all()
        lang_distribution = {row[0]: row[1] for row in lang_rows if row[0]}

        return {
            "total_users": total_users,
            "total_reviews": total_reviews,
            "avg_quality_score": round(float(avg_score), 1),
            "avg_risk_score": round(float(avg_risk), 1),
            "risk_breakdown": {
                "LOW": low_count,
                "MEDIUM": med_count,
                "HIGH": high_count,
                "CRITICAL": crit_count
            },
            "language_distribution": lang_distribution,
            "system_status": "ONLINE",
            "security_mode": "ADMIN_AUTHENTICATED"
        }

    @staticmethod
    def get_all_users(db: Session) -> List[Dict[str, Any]]:
        users = db.query(User).all()
        result = []
        for u in users:
            rev_count = db.query(func.count(Review.id)).filter(Review.user_id == u.id).scalar() or 0
            avg_user_score = db.query(func.avg(Review.overall_score)).filter(Review.user_id == u.id).scalar() or 0
            result.append({
                "user_id": u.id,
                "created_at": u.created_at.strftime("%Y-%m-%d %H:%M:%S") if u.created_at else "",
                "total_reviews": rev_count,
                "avg_score": round(float(avg_user_score), 1) if rev_count > 0 else "N/A"
            })
        return result

    @staticmethod
    def get_all_reviews(
        db: Session,
        user_id: Optional[str] = None,
        risk_level: Optional[str] = None,
        language: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        query = db.query(Review).order_by(Review.created_at.desc())
        
        if user_id and user_id.strip() and user_id.strip() != "ALL":
            query = query.filter(Review.user_id == user_id.strip())
        if risk_level and risk_level.strip() and risk_level.strip() != "ALL":
            query = query.filter(Review.risk_level == risk_level.strip())
        if language and language.strip() and language.strip() != "ALL":
            query = query.filter(Review.language == language.strip())

        reviews = query.all()
        results = []
        for r in reviews:
            results.append({
                "review_id": r.id,
                "user_id": r.user_id,
                "created_at": r.created_at.strftime("%Y-%m-%d %H:%M:%S") if r.created_at else "",
                "source_type": r.source_type,
                "target_name": r.target_name,
                "language": r.language,
                "overall_score": r.overall_score,
                "risk_score": r.risk_score,
                "risk_level": r.risk_level,
                "future_bug_prob": r.future_bug_prob,
                "consensus_agreement": r.consensus_agreement,
                "confidence": r.confidence,
                "pdf_report_path": r.pdf_report_path,
                "pdf_filename": os.path.basename(r.pdf_report_path) if r.pdf_report_path else ""
            })
        return results

    @staticmethod
    def delete_review(db: Session, review_id: str) -> bool:
        review = db.query(Review).filter(Review.id == review_id).first()
        if not review:
            return False
        if review.pdf_report_path and os.path.exists(review.pdf_report_path):
            try:
                os.remove(review.pdf_report_path)
            except Exception:
                pass
        db.delete(review)
        db.commit()
        return True

    @staticmethod
    def delete_user(db: Session, user_id: str) -> bool:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False
        
        # Delete user's review files
        reviews = db.query(Review).filter(Review.user_id == user_id).all()
        for r in reviews:
            if r.pdf_report_path and os.path.exists(r.pdf_report_path):
                try:
                    os.remove(r.pdf_report_path)
                except Exception:
                    pass

        db.delete(user)
        db.commit()
        return True