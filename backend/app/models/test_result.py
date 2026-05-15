"""Test natijalari modeli."""

from datetime import datetime

from sqlalchemy import Column, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB, ARRAY
from sqlalchemy import String
from sqlalchemy.orm import relationship

from app.database import Base


class TestResult(Base):
    __tablename__ = "test_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    riasec_scores = Column(JSONB, nullable=False)
    academic_data = Column(JSONB)
    user_skills = Column(ARRAY(String))
    predictions = Column(JSONB)
    skills_gap = Column(JSONB)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="test_results")
