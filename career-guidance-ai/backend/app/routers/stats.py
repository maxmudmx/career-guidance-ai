"""Statistika endpointlari."""

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.test_result import TestResult
from app.models.user import User

router = APIRouter(prefix="/api/stats", tags=["Stats"])

@router.get("/live-users")
def get_live_users(db: Session = Depends(get_db)):
    """
    Oxirgi 15 daqiqada test topshirgan yoki ro'yxatdan o'tgan
    haqiqiy foydalanuvchilar sonini qaytaradi.
    """
    window = datetime.utcnow() - timedelta(minutes=15)

    # Oxirgi 15 daqiqada test topshirgan unikal foydalanuvchilar
    active_testers = (
        db.query(func.count(func.distinct(TestResult.user_id)))
        .filter(TestResult.created_at >= window)
        .scalar()
    ) or 0

    # Oxirgi 15 daqiqada ro'yxatdan o'tgan yangi foydalanuvchilar
    new_users = (
        db.query(func.count(User.id))
        .filter(User.created_at >= window)
        .scalar()
    ) or 0

    total = active_testers + new_users

    return {
        "active_users": total,
        "updated_at": datetime.utcnow().isoformat(),
    }
