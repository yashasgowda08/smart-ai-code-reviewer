import csv
import io
import json
import os
from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.responses import StreamingResponse, JSONResponse
from typing import Optional
from sqlalchemy.orm import Session
from ..database.database import get_db
from ..database.models import Review

router = APIRouter(prefix="/exports", tags=["Exports"])

def get_user(x_user_id: Optional[str] = Header(None, alias="X-User-ID")):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-ID header is required.")
    return x_user_id

@router.get("/json/{review_id}")
def export_review_json(
    review_id: str,
    user_id: str = Depends(get_user),
    db: Session = Depends(get_db)
):
    review = db.query(Review).filter(Review.id == review_id, Review.user_id == user_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found.")
    data = json.loads(review.review_data) if review.review_data else {}
    content = json.dumps(data, indent=2)
    return StreamingResponse(
        io.BytesIO(content.encode("utf-8")),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=review_{review_id}.json"}
    )

@router.get("/csv/{review_id}")
def export_review_csv(
    review_id: str,
    user_id: str = Depends(get_user),
    db: Session = Depends(get_db)
):
    review = db.query(Review).filter(Review.id == review_id, Review.user_id == user_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found.")
    data = json.loads(review.review_data) if review.review_data else {}
    findings = data.get("findings", [])
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=["line", "severity", "category", "title", "description", "recommendation", "cwe"])
    writer.writeheader()
    for f in findings:
        writer.writerow({
            "line": f.get("line", ""),
            "severity": f.get("severity", ""),
            "category": f.get("category", ""),
            "title": f.get("title", ""),
            "description": f.get("description", ""),
            "recommendation": f.get("recommendation", ""),
            "cwe": f.get("cwe", "")
        })
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=findings_{review_id}.csv"}
    )