"""Test natijalari modeli (recsys uchun)."""

from datetime import datetime

from sqlalchemy import Column, Integer, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, ARRAY
from sqlalchemy.orm import relationship

from app.database import Base


class TestResult(Base):
    """Foydalanuvchining test natijalari.

    Recommender system uchun foydalanuvchi profili shu yerdan olinadi:
    - riasec_scores → 6-dim psixometrik vektor
    - academic_data → o'rta maktab fanlari bo'yicha baholar
    - user_skills → ko'nikmalar ro'yxati
    - recommendations → ML model qaytargan top-N kasblar
    """
    __tablename__ = "test_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    riasec_scores = Column(JSONB, nullable=False)
    academic_data = Column(JSONB)
    user_skills = Column(ARRAY(String))
    recommendations = Column(JSONB)  # top-N kasblar, har biri uchun confidence
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="test_results")
