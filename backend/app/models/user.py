"""Foydalanuvchi modeli."""

from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, Date, Boolean, Text
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(200))
    avatar_url = Column(Text, nullable=True)  # data URL (base64) yoki path
    region = Column(String(100), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    is_verified = Column(Boolean, default=False, nullable=False, server_default="false")
    created_at = Column(DateTime, default=datetime.utcnow)

    test_results = relationship("TestResult", back_populates="user", cascade="all, delete-orphan")
