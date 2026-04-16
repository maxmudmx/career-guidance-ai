"""Kasblar modeli."""

from datetime import datetime

from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.dialects.postgresql import JSONB, ARRAY

from app.database import Base


class Occupation(Base):
    __tablename__ = "occupations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    name_uz = Column(String(200), nullable=False)
    description = Column(Text)
    description_uz = Column(Text)
    required_skills = Column(ARRAY(String), nullable=False)
    avg_salary = Column(String(50))
    riasec_profile = Column(JSONB, nullable=False)
    roadmap = Column(JSONB)
    category = Column(String(100))
    demand_level = Column(String(20), default="medium")
    created_at = Column(DateTime, default=datetime.utcnow)


class ResumeAnalysis(Base):
    __tablename__ = "resume_analyses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    file_name = Column(String(255))
    extracted_keywords = Column(ARRAY(String))
    matched_occupation_id = Column(Integer)
    match_percentage = Column(Integer)
    analysis_result = Column(JSONB)
    created_at = Column(DateTime, default=datetime.utcnow)

    from sqlalchemy import ForeignKey
    from sqlalchemy.orm import relationship

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    matched_occupation_id = Column(Integer, ForeignKey("occupations.id"), nullable=True)
    user = relationship("User", back_populates="resume_analyses")
