"""
Users / Profile router — /api/users
Himoyalangan: barcha endpointlar JWT talab qiladi.
"""

import os
import re
import uuid
import shutil
from datetime import datetime, date

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.user import User
from app.models.test_result import TestResult
from app.routers.auth import require_auth, pwd_context, create_token
from app.services.ml_service import OCCUPATIONS_META

router = APIRouter(prefix="/api/users", tags=["Profile"])

# Avatarlar saqlanadigan papka
AVATAR_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "static", "avatars")
os.makedirs(AVATAR_DIR, exist_ok=True)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


# ── Sxemalar ──────────────────────────────────────────────────

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    target_occupation_id: Optional[int] = None


class UsernameChange(BaseModel):
    new_username: str
    current_password: str

    @field_validator("new_username")
    @classmethod
    def validate_username(cls, v):
        v = v.strip()
        if len(v) < 1:
            raise ValueError("Username bo'sh bo'lmasligi kerak")
        if len(v) > 30:
            raise ValueError("Username 30 ta belgidan oshmasligi kerak")
        if not re.match(r'^[a-zA-Z0-9_.]+$', v):
            raise ValueError("Username faqat harf, raqam, '_' va '.' dan iborat bo'lishi kerak")
        return v


class PasswordChange(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v):
        if len(v) < 6:
            raise ValueError("Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak")
        return v


class ProfileEditAll(BaseModel):
    """Profilning hamma maydonlarini bir marta tahrirlash uchun."""
    email: Optional[str] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    region: Optional[str] = None
    date_of_birth: Optional[str] = None  # ISO format: YYYY-MM-DD
    new_password: Optional[str] = None
    current_password: Optional[str] = None


class EmailChange(BaseModel):
    new_email: str
    current_password: str

    @field_validator("new_email")
    @classmethod
    def validate_email(cls, v):
        v = v.strip().lower()
        if not re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', v):
            raise ValueError("Email manzili noto'g'ri")
        if len(v) > 255:
            raise ValueError("Email 255 ta belgidan oshmasligi kerak")
        return v


# ── Yordamchi: progress hisoblash ────────────────────────────

def _calc_progress(user_skills: list[str], occupation_id: int) -> dict:
    """Foydalanuvchi skillari bilan kasb talab qiladigan skilllarni solishtiradi."""
    occ = OCCUPATIONS_META.get(occupation_id)
    if not occ:
        return {"percent": 0, "matched": [], "missing": [], "total_required": 0}
    required = occ.get("required_skills", [])
    matched = [s for s in required if s in user_skills]
    missing = [s for s in required if s not in user_skills]
    percent = round(len(matched) / len(required) * 100) if required else 0
    return {
        "percent": percent,
        "matched": matched,
        "missing": missing,
        "total_required": len(required),
        "occupation_name": occ["name_uz"],
    }


def _latest_skills(user_id: int, db: Session) -> list[str]:
    """Foydalanuvchining oxirgi test natijasidan skilllarini oladi."""
    latest = (
        db.query(TestResult)
        .filter(TestResult.user_id == user_id)
        .order_by(TestResult.created_at.desc())
        .first()
    )
    if latest and latest.user_skills:
        return list(latest.user_skills)
    return []


def _latest_prediction_occ_id(user_id: int, db: Session) -> Optional[int]:
    """Oxirgi test natijasinig #1 bashorat kasb IDsini qaytaradi."""
    latest = (
        db.query(TestResult)
        .filter(TestResult.user_id == user_id)
        .order_by(TestResult.created_at.desc())
        .first()
    )
    if not latest or not latest.predictions:
        return None
    # Yangi format ("top") yoki eski format ("top3")
    items = latest.predictions.get("top") or latest.predictions.get("top3") or []
    if items:
        return items[0].get("id")
    return None


# ── Endpointlar ───────────────────────────────────────────────

@router.get("/me")
def get_profile(
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """
    Joriy foydalanuvchi profili + progress foizi.
    Progress: (user_skills / target_occupation_skills) * 100
    """
    user_skills = _latest_skills(current_user.id, db)

    # Maqsad kasb: foydalanuvchi tanlagan yoki oxirgi test bashoratidan
    target_occ_id = current_user.target_occupation_id
    if target_occ_id is None:
        target_occ_id = _latest_prediction_occ_id(current_user.id, db)

    progress = None
    if target_occ_id is not None:
        progress = _calc_progress(user_skills, target_occ_id)

    # Statistika
    test_count = db.query(TestResult).filter(TestResult.user_id == current_user.id).count()

    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "avatar_url": current_user.avatar_url,
        "region": current_user.region,
        "date_of_birth": current_user.date_of_birth.isoformat() if current_user.date_of_birth else None,
        "target_occupation_id": current_user.target_occupation_id,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        "user_skills": user_skills,
        "progress": progress,
        "stats": {
            "test_count": test_count,
        },
    }


@router.patch("/me")
def update_profile(
    data: ProfileUpdate,
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Profil ma'lumotlarini yangilash (ism, maqsad kasb)."""
    if data.full_name is not None:
        current_user.full_name = data.full_name.strip() or current_user.full_name
    if data.target_occupation_id is not None:
        if data.target_occupation_id not in OCCUPATIONS_META:
            raise HTTPException(status_code=400, detail="Noto'g'ri kasb ID")
        current_user.target_occupation_id = data.target_occupation_id
    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    return {"message": "Profil yangilandi", "user": {
        "full_name": current_user.full_name,
        "target_occupation_id": current_user.target_occupation_id,
    }}


@router.post("/upload-avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Avatar rasmini yuklash. Ruxsat etilgan: JPEG, PNG, WebP, GIF. Max: 5MB."""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Rasm formati noto'g'ri. Ruxsat etilgan: JPEG, PNG, WebP, GIF",
        )

    # Fayl hajmini tekshirish
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Rasm hajmi 5 MB dan oshmasligi kerak")

    # Eski avatarni o'chirish
    if current_user.avatar_url:
        old_filename = current_user.avatar_url.split("/")[-1]
        old_path = os.path.join(AVATAR_DIR, old_filename)
        if os.path.exists(old_path):
            os.remove(old_path)

    # Yangi faylni saqlash
    ext = file.content_type.split("/")[-1]
    if ext == "jpeg":
        ext = "jpg"
    filename = f"user_{current_user.id}_{uuid.uuid4().hex[:8]}.{ext}"
    save_path = os.path.join(AVATAR_DIR, filename)

    with open(save_path, "wb") as f:
        f.write(content)

    avatar_url = f"/static/avatars/{filename}"
    current_user.avatar_url = avatar_url
    current_user.updated_at = datetime.utcnow()
    db.commit()

    return {"avatar_url": avatar_url, "message": "Avatar muvaffaqiyatli yangilandi"}


@router.get("/history")
def get_history(
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """
    Foydalanuvchining barcha RIASEC test natijalari va ML bashoratlarini
    vaqt bo'yicha teskari tartibda qaytaradi.
    """
    results = (
        db.query(TestResult)
        .filter(TestResult.user_id == current_user.id)
        .order_by(TestResult.created_at.desc())
        .all()
    )

    history = []
    for r in results:
        # Yangi format ("top") yoki eski ("top3")
        items = (r.predictions or {}).get("top") or (r.predictions or {}).get("top3") or []

        # Top kasb (#1)
        top_career = None
        if items:
            top_career = {
                "name_uz": items[0].get("name_uz"),
                "score": items[0].get("score"),
                "id": items[0].get("id"),
                "category_uz": items[0].get("category_uz"),
            }

        # Barcha bashorat qilingan kasblar (top 3+)
        top_careers = [
            {
                "id": it.get("id"),
                "name": it.get("name"),
                "name_uz": it.get("name_uz"),
                "score": it.get("score"),
                "category": it.get("category"),
                "category_uz": it.get("category_uz"),
                "avg_salary": it.get("avg_salary"),
                "demand": it.get("demand"),
            }
            for it in items
        ]

        # RIASEC dominant type
        dominant = None
        if r.riasec_scores:
            cat_names = {"R": "Realistik", "I": "Tadqiqotchi", "A": "Ijodkor",
                         "S": "Ijtimoiy", "E": "Tadbirkor", "C": "Konvensional"}
            best = max(r.riasec_scores.items(), key=lambda x: x[1], default=None)
            if best:
                dominant = {"code": best[0], "name": cat_names.get(best[0], best[0]), "score": best[1]}

        history.append({
            "id": r.id,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "riasec_scores": r.riasec_scores,
            "dominant_type": dominant,
            "user_skills": r.user_skills or [],
            "skills_count": len(r.user_skills or []),
            "top_career": top_career,
            "top_careers": top_careers,
            "academic_data": r.academic_data,
            "skills_gap": r.skills_gap,
        })

    return {
        "total": len(history),
        "history": history,
    }


@router.get("/occupations")
def list_occupations(current_user: User = Depends(require_auth)):
    """Barcha kasblar ro'yxatini qaytaradi (maqsad kasb tanlash uchun)."""
    from app.services.ml_service import CATEGORIES
    return {
        "total": len(OCCUPATIONS_META),
        "occupations": [
            {
                "id": occ_id,
                "name": occ["name"],
                "name_uz": occ["name_uz"],
                "category": occ.get("category"),
                "category_uz": CATEGORIES.get(occ.get("category", ""), ""),
                "avg_salary": occ["avg_salary"],
                "demand": occ.get("demand", ""),
            }
            for occ_id, occ in OCCUPATIONS_META.items()
        ],
    }


@router.post("/change-username")
def change_username(
    data: UsernameChange,
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Username o'zgartirish. Joriy parolni tasdiqlash talab qilinadi."""
    if not pwd_context.verify(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Joriy parol noto'g'ri")

    if data.new_username == current_user.username:
        raise HTTPException(status_code=400, detail="Yangi username joriy username bilan bir xil")

    existing = db.query(User).filter(User.username == data.new_username).first()
    if existing and existing.id != current_user.id:
        raise HTTPException(status_code=400, detail="Bu username allaqachon band")

    current_user.username = data.new_username
    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)

    new_token = create_token({"user_id": current_user.id, "username": current_user.username})
    return {
        "message": "Username muvaffaqiyatli yangilandi",
        "username": current_user.username,
        "access_token": new_token,
    }


@router.post("/change-email")
def change_email(
    data: EmailChange,
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Email o'zgartirish. Joriy parolni tasdiqlash talab qilinadi."""
    if not pwd_context.verify(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Joriy parol noto'g'ri")

    if data.new_email == current_user.email:
        raise HTTPException(status_code=400, detail="Yangi email joriy email bilan bir xil")

    existing = db.query(User).filter(User.email == data.new_email).first()
    if existing and existing.id != current_user.id:
        raise HTTPException(status_code=400, detail="Bu email allaqachon band")

    current_user.email = data.new_email
    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)

    return {
        "message": "Email muvaffaqiyatli yangilandi",
        "email": current_user.email,
    }


@router.post("/change-password")
def change_password(
    data: PasswordChange,
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Parolni o'zgartirish. Joriy parolni tasdiqlash talab qilinadi."""
    if not pwd_context.verify(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Joriy parol noto'g'ri")

    if data.current_password == data.new_password:
        raise HTTPException(status_code=400, detail="Yangi parol eski parol bilan bir xil")

    current_user.password_hash = pwd_context.hash(data.new_password)
    current_user.updated_at = datetime.utcnow()
    db.commit()

    return {"message": "Parol muvaffaqiyatli yangilandi"}


@router.post("/edit-profile")
def edit_profile_all(
    data: ProfileEditAll,
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """
    Profilning hamma maydonlarini bir marotaba tahrirlash.
    Email/username/parol o'zgartirilsa — joriy parol talab qilinadi.
    Region, date_of_birth, full_name uchun parol shart emas.
    """
    new_token = None

    # Sezgir o'zgarishlarni aniqlash (parol talab qiladi)
    email_change = data.email is not None and data.email.strip().lower() != (current_user.email or "").lower()
    username_change = data.username is not None and data.username.strip() != current_user.username
    password_change = bool(data.new_password)

    sensitive_change = email_change or username_change or password_change

    if sensitive_change:
        if not data.current_password:
            raise HTTPException(status_code=400, detail="Joriy parolni kiriting")
        if not pwd_context.verify(data.current_password, current_user.password_hash):
            raise HTTPException(status_code=400, detail="Joriy parol noto'g'ri")

    # Email
    if email_change:
        new_email = data.email.strip().lower()
        if not re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', new_email):
            raise HTTPException(status_code=400, detail="Email manzili noto'g'ri")
        if len(new_email) > 255:
            raise HTTPException(status_code=400, detail="Email 255 ta belgidan oshmasligi kerak")
        existing = db.query(User).filter(User.email == new_email).first()
        if existing and existing.id != current_user.id:
            raise HTTPException(status_code=400, detail="Bu email allaqachon band")
        current_user.email = new_email

    # Username
    if username_change:
        new_username = data.username.strip()
        if len(new_username) < 1:
            raise HTTPException(status_code=400, detail="Username bo'sh bo'lmasligi kerak")
        if len(new_username) > 30:
            raise HTTPException(status_code=400, detail="Username 30 ta belgidan oshmasligi kerak")
        if not re.match(r'^[a-zA-Z0-9_.]+$', new_username):
            raise HTTPException(status_code=400, detail="Username faqat harf, raqam, '_' va '.' dan iborat bo'lishi kerak")
        existing = db.query(User).filter(User.username == new_username).first()
        if existing and existing.id != current_user.id:
            raise HTTPException(status_code=400, detail="Bu username allaqachon band")
        current_user.username = new_username
        new_token = create_token({"user_id": current_user.id, "username": current_user.username})

    # Parol
    if password_change:
        if len(data.new_password) < 6:
            raise HTTPException(status_code=400, detail="Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak")
        if data.current_password == data.new_password:
            raise HTTPException(status_code=400, detail="Yangi parol eski parol bilan bir xil")
        current_user.password_hash = pwd_context.hash(data.new_password)

    # Full name
    if data.full_name is not None:
        fn = data.full_name.strip()
        current_user.full_name = fn or None

    # Region
    if data.region is not None:
        rg = data.region.strip()
        if len(rg) > 100:
            raise HTTPException(status_code=400, detail="Region 100 ta belgidan oshmasligi kerak")
        current_user.region = rg or None

    # Date of birth
    if data.date_of_birth is not None:
        dob_str = data.date_of_birth.strip()
        if dob_str == "":
            current_user.date_of_birth = None
        else:
            try:
                dob = date.fromisoformat(dob_str)
            except ValueError:
                raise HTTPException(status_code=400, detail="Tug'ilgan sana noto'g'ri (YYYY-MM-DD)")
            if dob > date.today():
                raise HTTPException(status_code=400, detail="Tug'ilgan sana kelajakda bo'lishi mumkin emas")
            current_user.date_of_birth = dob

    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)

    return {
        "message": "Profil yangilandi",
        "user": {
            "username": current_user.username,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "region": current_user.region,
            "date_of_birth": current_user.date_of_birth.isoformat() if current_user.date_of_birth else None,
        },
        "access_token": new_token,
    }


@router.delete("/history")
def clear_history(
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Foydalanuvchining barcha test natijalarini o'chirish."""
    deleted = (
        db.query(TestResult)
        .filter(TestResult.user_id == current_user.id)
        .delete(synchronize_session=False)
    )
    db.commit()
    return {"message": f"{deleted} ta test natijasi o'chirildi", "deleted": deleted}


@router.delete("/me")
def delete_account(
    current_password: str,
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Hisobni butunlay o'chirish (parol tasdiqlash bilan)."""
    if not pwd_context.verify(current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Parol noto'g'ri")

    # Avatarni o'chirish
    if current_user.avatar_url:
        filename = current_user.avatar_url.split("/")[-1]
        path = os.path.join(AVATAR_DIR, filename)
        if os.path.exists(path):
            try:
                os.remove(path)
            except OSError:
                pass

    # Test natijalarini o'chirish
    db.query(TestResult).filter(TestResult.user_id == current_user.id).delete(synchronize_session=False)
    db.delete(current_user)
    db.commit()
    return {"message": "Hisob o'chirildi"}
