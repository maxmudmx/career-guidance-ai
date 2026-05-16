"""Foydalanuvchi profili va tarix API."""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.database import get_db
from app.models.user import User
from app.models.test_result import TestResult
from app.routers.auth import require_auth

router = APIRouter(prefix="/api/users", tags=["Foydalanuvchi"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)


@router.get("/history")
def get_history(
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Foydalanuvchining barcha testlari va tavsiyalari (eng yangisi birinchi)."""
    results = (
        db.query(TestResult)
        .filter(TestResult.user_id == current_user.id)
        .order_by(TestResult.created_at.desc())
        .all()
    )
    return {
        "total": len(results),
        "history": [
            {
                "id": r.id,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "riasec_scores": r.riasec_scores,
                "academic_data": r.academic_data,
                "recommendations": r.recommendations or [],
            }
            for r in results
        ],
    }


@router.delete("/history/{test_id}")
def delete_history_item(
    test_id: int,
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Bitta test natijasini o'chirish."""
    result = (
        db.query(TestResult)
        .filter(TestResult.id == test_id, TestResult.user_id == current_user.id)
        .first()
    )
    if not result:
        raise HTTPException(status_code=404, detail="Test natijasi topilmadi")
    db.delete(result)
    db.commit()
    return {"ok": True, "message": "O'chirildi"}


@router.post("/change-password")
def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Parolni o'zgartirish."""
    if not pwd_context.verify(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Joriy parol noto'g'ri")
    if data.current_password == data.new_password:
        raise HTTPException(status_code=400, detail="Yangi parol eskisi bilan bir xil")

    current_user.password_hash = pwd_context.hash(data.new_password)
    db.commit()
    return {"ok": True, "message": "Parol muvaffaqiyatli o'zgartirildi"}


@router.get("/stats")
def get_user_stats(
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Foydalanuvchi profili uchun statistika."""
    total_tests = db.query(TestResult).filter(TestResult.user_id == current_user.id).count()
    last_test = (
        db.query(TestResult)
        .filter(TestResult.user_id == current_user.id)
        .order_by(TestResult.created_at.desc())
        .first()
    )
    return {
        "total_tests": total_tests,
        "last_test_at": last_test.created_at.isoformat() if last_test else None,
        "joined_at": current_user.created_at.isoformat() if current_user.created_at else None,
    }
