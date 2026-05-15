"""Vakansiyalar modeli."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, UniqueConstraint, Index
from app.database import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    occupation_id = Column(Integer, nullable=False, index=True)

    # Vakansiya ma'lumotlari
    hh_id = Column(String(50), nullable=True)          # HH.uz ichki ID
    title = Column(String(300), nullable=False)
    company = Column(String(200), nullable=True)
    salary_from = Column(Integer, nullable=True)
    salary_to = Column(Integer, nullable=True)
    salary_currency = Column(String(10), nullable=True, default="UZS")
    location = Column(String(100), nullable=True)
    employment_type = Column(String(50), nullable=True)  # full, part, remote
    experience = Column(String(100), nullable=True)
    link = Column(String(500), nullable=False)
    description = Column(String(1000), nullable=True)

    # Metama'lumotlar
    source = Column(String(50), nullable=False, default="hh.uz")
    fetched_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Dublikatni oldini olish: bir xil kasb + HH ID
    __table_args__ = (
        UniqueConstraint("occupation_id", "hh_id", name="uq_job_occ_hhid"),
        Index("idx_jobs_occ_fetched", "occupation_id", "fetched_at"),
    )
