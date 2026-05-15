"""Parolni tiklash tokenlari modeli."""

from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Index

from app.database import Base


class PasswordReset(Base):
    __tablename__ = "password_resets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token = Column(String(128), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime, nullable=True)  # bir martalik token
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("ix_password_resets_user_used", "user_id", "used_at"),
    )
