import os
import json
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from ..database.models import Review

class HistoryService:
    @staticmethod
    def get_user_history(db: Session, user_id: str) -> List[Dict[str, Any]]:
        reviews = (
            db.query(Review)
            .filter(Review.user_id == user_id)
            .order_by(Review.created_at.desc())
            .all()
        )
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
    def get_review_by_id(db: Session, review_id: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        query = db.query(Review).filter(Review.id == review_id)
        if user_id:
            query = query.filter(Review.user_id == user_id)
        review = query.first()
        if not review:
            return None

        try:
            full_data = json.loads(review.review_data)
        except Exception:
            full_data = {}

        return {
            "review_id": review.id,
            "user_id": review.user_id,
            "created_at": review.created_at.strftime("%Y-%m-%d %H:%M:%S") if review.created_at else "",
            "source_type": review.source_type,
            "target_name": review.target_name,
            "language": review.language,
            "overall_score": review.overall_score,
            "risk_score": review.risk_score,
            "risk_level": review.risk_level,
            "future_bug_prob": review.future_bug_prob,
            "consensus_agreement": review.consensus_agreement,
            "confidence": review.confidence,
            "pdf_report_path": review.pdf_report_path,
            "pdf_filename": os.path.basename(review.pdf_report_path) if review.pdf_report_path else "",
            "review_data": full_data
        }

    @staticmethod
    def delete_review_by_id(db: Session, review_id: str, user_id: str) -> bool:
        review = db.query(Review).filter(Review.id == review_id, Review.user_id == user_id).first()
        if not review:
            return False

        # Remove PDF file if present
        if review.pdf_report_path and os.path.exists(review.pdf_report_path):
            try:
                os.remove(review.pdf_report_path)
            except Exception:
                pass

        db.delete(review)
        db.commit()
        return True

    @staticmethod
    def clear_user_history(db: Session, user_id: str) -> int:
        reviews = db.query(Review).filter(Review.user_id == user_id).all()
        count = len(reviews)
        for r in reviews:
            if r.pdf_report_path and os.path.exists(r.pdf_report_path):
                try:
                    os.remove(r.pdf_report_path)
                except Exception:
                    pass
            db.delete(r)
        db.commit()
        return count