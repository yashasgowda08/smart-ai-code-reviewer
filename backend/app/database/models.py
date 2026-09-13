import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, index=True) # User ID (e.g. YASHAS001)
    password_hash = Column(String(256), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan")

class Review(Base):
    __tablename__ = "reviews"

    id = Column(String(64), primary_key=True, index=True) # Review UUID
    user_id = Column(String(64), ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    source_type = Column(String(32), default="paste") # 'upload', 'paste', 'github'
    target_name = Column(String(256), default="untitled")
    language = Column(String(64), default="Generic")
    
    overall_score = Column(Integer, default=0)
    risk_score = Column(Integer, default=0)
    risk_level = Column(String(32), default="LOW")
    future_bug_prob = Column(Integer, default=0)
    
    consensus_agreement = Column(String(32), default="HIGH")
    confidence = Column(Integer, default=90)
    pdf_report_path = Column(String(512), default="")
    
    # Store complete structured review data as JSON string
    review_data = Column(Text, nullable=False)

    user = relationship("User", back_populates="reviews")
