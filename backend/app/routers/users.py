"""Foydalanuvchi profili, tarix va avatar API."""

import os
import re
import uuid
from datetime import datetime, date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.database import get_db
from app.models.user import User
from app.models.test_result import TestResult
from app.routers.auth import require_auth, create_token

router = APIRouter(prefix="/api/users", tags=["Foydalanuvchi"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Avatarlar saqlanadigan papka
AVATAR_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "static", "avatars")
os.makedirs(AVATAR_DIR, exist_ok=True)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


# ============================================================
# Sxemalar
# ============================================================

class ProfileEdit(BaseModel):
    """Profilning hamma maydonlarini tahrirlash."""
    email: Optional[str] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    region: Optional[str] = None
    date_of_birth: Optional[str] = None  # ISO format YYYY-MM-DD
    new_password: Optional[str] = None
    current_password: Optional[str] = None

    @field_validator("username")
    @classmethod
    def validate_username(cls, v):
        if v is None:
            return v
        v = v.strip()
        if len(v) < 1 or len(v) > 30:
            raise ValueError("Username 1-30 belgi bo'lishi kerak")
        if not re.match(r"^[a-zA-Z0-9_.]+$", v):
            raise ValueError("Username faqat harf, raqam, '_' va '.' dan iborat")
        return v

    @field_validator("email")
    @classmethod
    def validate_email(cls, v):
        if v is None:
            return v
        v = v.strip().lower()
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", v):
            raise ValueError("Email noto'g'ri")
        return v

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v):
        if v is None or v == "":
            return None
        if len(v) < 6:
            raise ValueError("Yangi parol kamida 6 belgi")
        return v


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)


def _user_to_dict(user: User) -> dict:
    from app.config import settings as _s
    super_email = (_s.SUPER_ADMIN_EMAIL or "").strip().lower()
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "avatar_url": user.avatar_url,
        "region": user.region,
        "date_of_birth": user.date_of_birth.isoformat() if user.date_of_birth else None,
        "is_admin": bool(getattr(user, "is_admin", False)),
        "is_super_admin": bool(super_email and (user.email or "").lower() == super_email),
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


# ============================================================
# /me — profil olish va to'liq tahrirlash
# ============================================================

@router.get("/me")
def get_profile(
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Joriy foydalanuvchi profili + statistika."""
    test_count = db.query(TestResult).filter(TestResult.user_id == current_user.id).count()
    last_test = (
        db.query(TestResult)
        .filter(TestResult.user_id == current_user.id)
        .order_by(TestResult.created_at.desc())
        .first()
    )
    data = _user_to_dict(current_user)
    data["stats"] = {
        "test_count": test_count,
        "last_test_at": last_test.created_at.isoformat() if last_test else None,
    }
    return data


@router.post("/edit-profile")
def edit_profile(
    data: ProfileEdit,
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Profilning bir nechta maydonini bir martada tahrirlash.

    Parol/email/username o'zgartirilsa, joriy parol majburiy.
    """
    # Email/username/parol o'zgarsa — current_password kerak
    sensitive = (
        (data.email and data.email != current_user.email) or
        (data.username and data.username != current_user.username) or
        data.new_password
    )
    if sensitive:
        if not data.current_password:
            raise HTTPException(status_code=400, detail="Joriy parolni kiriting")
        if not pwd_context.verify(data.current_password, current_user.password_hash):
            raise HTTPException(status_code=400, detail="Joriy parol noto'g'ri")

    # Email
    if data.email and data.email != current_user.email:
        existing = db.query(User).filter(User.email == data.email).first()
        if existing and existing.id != current_user.id:
            raise HTTPException(status_code=400, detail="Bu email allaqachon band")
        current_user.email = data.email

    # Username
    if data.username and data.username != current_user.username:
        existing = db.query(User).filter(User.username == data.username).first()
        if existing and existing.id != current_user.id:
            raise HTTPException(status_code=400, detail="Bu username allaqachon band")
        current_user.username = data.username

    # Boshqalar
    if data.full_name is not None:
        current_user.full_name = data.full_name.strip() or current_user.full_name
    if data.region is not None:
        current_user.region = data.region.strip() or None
    if data.date_of_birth is not None:
        if data.date_of_birth == "":
            current_user.date_of_birth = None
        else:
            try:
                current_user.date_of_birth = date.fromisoformat(data.date_of_birth)
            except ValueError:
                raise HTTPException(status_code=400, detail="Tug'ilgan sana noto'g'ri formatda (YYYY-MM-DD)")

    # Parol
    if data.new_password:
        current_user.password_hash = pwd_context.hash(data.new_password)

    import logging
    try:
        db.commit()
        db.refresh(current_user)
        logging.info(
            "Profile saved for user %s: region=%s, dob=%s, avatar=%s",
            current_user.username,
            current_user.region,
            current_user.date_of_birth,
            'yes' if current_user.avatar_url else 'no',
        )
    except Exception as e:
        db.rollback()
        logging.exception("Profile save FAILED: %s", e)
        raise HTTPException(status_code=500, detail=f"Saqlashda xatolik: {str(e)}")

    # Username o'zgargan bo'lsa yangi token
    new_token = create_token({"user_id": current_user.id, "username": current_user.username})
    return {
        "message": "Profil yangilandi",
        "user": _user_to_dict(current_user),
        "access_token": new_token,
    }


# ============================================================
# Avatar yuklash
# ============================================================

@router.post("/upload-avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Avatar rasmini yuklash. Bevosita DB'ga base64 sifatida saqlanadi.

    Render bepul tier'da fayl tizimi vaqtinchalik (har restart'da o'chadi),
    shuning uchun rasm fayl o'rniga DB'ga (data URL) saqlanadi.
    """
    import base64

    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Rasm formati noto'g'ri. JPEG/PNG/WebP/GIF qo'llab-quvvatlanadi",
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Rasm hajmi 5 MB dan oshmasligi kerak")

    # Base64 data URL sifatida saqlash
    b64 = base64.b64encode(content).decode("ascii")
    data_url = f"data:{file.content_type};base64,{b64}"

    import logging
    current_user.avatar_url = data_url
    try:
        db.commit()
        logging.info("Avatar saved for user %s (%d bytes)", current_user.username, len(data_url))
    except Exception as e:
        db.rollback()
        logging.exception("Avatar save FAILED: %s", e)
        raise HTTPException(status_code=500, detail=f"Avatar saqlashda xatolik: {str(e)}")

    return {"avatar_url": data_url, "message": "Avatar yangilandi"}


@router.delete("/delete-avatar")
def delete_avatar(
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Avatarni o'chirish."""
    current_user.avatar_url = None
    db.commit()
    return {"message": "Avatar o'chirildi"}


# ============================================================
# Tarix (test natijalari)
# ============================================================

@router.get("/history")
def get_history(
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Foydalanuvchining barcha testlari va tavsiyalari."""
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


# ============================================================
# Parolni o'zgartirish (alohida endpoint, qulay)
# ============================================================

@router.post("/change-password")
def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Parolni o'zgartirish (alohida endpoint)."""
    if not pwd_context.verify(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Joriy parol noto'g'ri")
    if data.current_password == data.new_password:
        raise HTTPException(status_code=400, detail="Yangi parol eskisi bilan bir xil")
    current_user.password_hash = pwd_context.hash(data.new_password)
    db.commit()
    return {"ok": True, "message": "Parol muvaffaqiyatli o'zgartirildi"}


# ============================================================
# Stats
# ============================================================

@router.get("/stats")
def get_user_stats(
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Foydalanuvchi statistika."""
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
