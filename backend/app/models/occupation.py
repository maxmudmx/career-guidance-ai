"""Kasblar modeli (recsys uchun)."""

from datetime import datetime

from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.dialects.postgresql import JSONB, ARRAY

from app.database import Base


class Occupation(Base):
    """Kasb — recommender system uchun 'item'.

    feature_vector — N o'lchamli xususiyatlar vektori (RIASEC + ko'nikmalar + akademik).
    Bu Content-Based Filtering uchun ishlatiladi.
    """
    __tablename__ = "occupations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    name_uz = Column(String(200), nullable=False)
    description_uz = Column(Text)
    category = Column(String(100))

    # Recommender features
    feature_vector = Column(JSONB, nullable=False)  # N-dim vector (key → value)
    riasec_profile = Column(JSONB, nullable=False)  # {R,I,A,S,E,C → ideal value}
    required_skills = Column(ARRAY(String))

    created_at = Column(DateTime, default=datetime.utcnow)
