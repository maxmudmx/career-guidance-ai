"""Autentifikatsiya API — email + 6 raqamli kod orqali tasdiqlash."""

import re
import secrets
import logging
from datetime import datetime, timedelta

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr, field_validator
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt

from app.database import get_db
from app.config import settings
from app.models.user import User
from app.models.email_verification import EmailVerification
from app.services.email_service import send_verification_email

router = APIRouter(prefix="/api/auth", tags=["Autentifikatsiya"])
logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


# ---- Sxemalar ----

class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str | None = None

    @field_validator("username")
    @classmethod
    def validate_username(cls, v):
        v = v.strip()
        if len(v) < 1 or len(v) > 30:
            raise ValueError("Username 1-30 belgi bo'lishi kerak")
        if not re.match(r"^[a-zA-Z0-9_.]+$", v):
            raise ValueError("Username faqat harf, raqam, '_' va '.' dan iborat")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError("Parol kamida 6 ta belgi")
        return v


class UserLogin(BaseModel):
    username: str
    password: str


class VerifyEmailRequest(BaseModel):
    email: EmailStr
    code: str


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class RegisterResponse(BaseModel):
    ok: bool
    message: str
    email: str


# ---- Yordamchi funksiyalar ----

def create_token(data: dict) -> str:
    to_encode = data.copy()
    to_encode["exp"] = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def verify_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except Exception:
        return None


def require_auth(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    if not token:
        raise HTTPException(status_code=401, detail="Kirish talab qilinadi")
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token yaroqsiz yoki muddati o'tgan")
    user = db.query(User).filter(User.id == payload.get("user_id")).first()
    if not user:
        raise HTTPException(status_code=401, detail="Foydalanuvchi topilmadi")
    return user


def optional_auth(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User | None:
    """Auth optional — token bo'lmasa yoki yaroqsiz bo'lsa None qaytaradi."""
    if not token:
        return None
    payload = verify_token(token)
    if not payload:
        return None
    user = db.query(User).filter(User.id == payload.get("user_id")).first()
    return user


def require_admin(current_user: User = Depends(require_auth)) -> User:
    """Faqat admin bo'lgan foydalanuvchilarga ruxsat beradi."""
    if not bool(getattr(current_user, "is_admin", False)):
        raise HTTPException(status_code=403, detail="Bu amal faqat administrator uchun")
    return current_user


def _user_to_dict(user: User) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "is_verified": bool(getattr(user, "is_verified", False)),
        "is_admin": bool(getattr(user, "is_admin", False)),
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


def _create_verification_code(db: Session, user: User) -> str:
    """Foydalanuvchi uchun yangi 6 raqamli kod yaratadi.
    Eski ishlatilmagan kodlar bekor qilinadi."""
    db.query(EmailVerification).filter(
        EmailVerification.user_id == user.id,
        EmailVerification.used_at.is_(None),
    ).update({"used_at": datetime.utcnow()})

    code = f"{secrets.randbelow(1000000):06d}"
    rec = EmailVerification(
        user_id=user.id,
        code=code,
        expires_at=datetime.utcnow() + timedelta(minutes=settings.EMAIL_VERIFICATION_TTL_MINUTES),
    )
    db.add(rec)
    db.commit()
    return code


# ---- Endpointlar ----

@router.post("/register", response_model=RegisterResponse)
def register(
    data: UserRegister,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Yangi foydalanuvchi yaratadi va emailga 6 raqamli tasdiqlash kodi yuboradi.

    Foydalanuvchi `is_verified=False` bilan yaratiladi. Kodni kiritmaguncha
    tizimga kira olmaydi.
    """
    email_lower = str(data.email).lower()
    if db.query(User).filter(User.email == email_lower).first():
        raise HTTPException(status_code=400, detail="Bu email allaqachon ro'yxatdan o'tgan")
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=400, detail="Bu username allaqachon band")

    user = User(
        username=data.username,
        email=email_lower,
        password_hash=pwd_context.hash(data.password),
        full_name=data.full_name or data.username,
        is_verified=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    code = _create_verification_code(db, user)
    background_tasks.add_task(
        send_verification_email,
        user.email,
        user.full_name or user.username,
        code,
    )

    return RegisterResponse(
        ok=True,
        message="Emailingizga 6 raqamli kod yubordik. Uni saytda kiriting.",
        email=user.email,
    )


@router.post("/verify-email", response_model=TokenResponse)
def verify_email(data: VerifyEmailRequest, db: Session = Depends(get_db)):
    """6 raqamli kod orqali emailni tasdiqlash. Muvaffaqiyatli bo'lsa token qaytaradi."""
    user = db.query(User).filter(User.email == str(data.email).lower()).first()
    if not user:
        raise HTTPException(status_code=400, detail="Email yoki kod noto'g'ri")

    if getattr(user, "is_verified", False):
        access_token = create_token({"user_id": user.id, "username": user.username})
        return TokenResponse(access_token=access_token, user=_user_to_dict(user))

    code = data.code.strip().replace(" ", "")
    rec = (
        db.query(EmailVerification)
        .filter(
            EmailVerification.user_id == user.id,
            EmailVerification.code == code,
            EmailVerification.used_at.is_(None),
        )
        .first()
    )
    if not rec:
        raise HTTPException(status_code=400, detail="Email yoki kod noto'g'ri")
    if rec.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Kod muddati tugagan. Yangi kod so'rang")

    user.is_verified = True
    rec.used_at = datetime.utcnow()
    db.commit()
    db.refresh(user)

    access_token = create_token({"user_id": user.id, "username": user.username})
    return TokenResponse(access_token=access_token, user=_user_to_dict(user))


@router.post("/resend-verification")
def resend_verification(
    data: ResendVerificationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """6 raqamli kodni qayta yuborish. 60 sekund throttle bor."""
    user = db.query(User).filter(User.email == str(data.email).lower()).first()
    generic = {"ok": True, "message": "Agar email mavjud bo'lsa, kod yuborildi"}
    if not user:
        return generic
    if getattr(user, "is_verified", False):
        return {"ok": True, "message": "Bu email allaqachon tasdiqlangan"}

    last = (
        db.query(EmailVerification)
        .filter(EmailVerification.user_id == user.id)
        .order_by(EmailVerification.created_at.desc())
        .first()
    )
    if last and (datetime.utcnow() - last.created_at).total_seconds() < 60:
        raise HTTPException(status_code=429, detail="Iltimos 1 daqiqa kutib qayta urinib ko'ring")

    code = _create_verification_code(db, user)
    background_tasks.add_task(
        send_verification_email,
        user.email,
        user.full_name or user.username,
        code,
    )
    return generic


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    """Tizimga kirish (username yoki email bilan)."""
    identifier = data.username.strip()
    user = db.query(User).filter(User.username == identifier).first()
    if not user:
        user = db.query(User).filter(User.email == identifier.lower()).first()

    if not user or not pwd_context.verify(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Login yoki parol noto'g'ri")

    if not getattr(user, "is_verified", False):
        raise HTTPException(
            status_code=403,
            detail={
                "code": "email_not_verified",
                "message": "Emailingiz hali tasdiqlanmagan. Pochtangizdagi 6 raqamli kodni kiriting.",
                "email": user.email,
            },
        )

    token = create_token({"user_id": user.id, "username": user.username})
    return TokenResponse(access_token=token, user=_user_to_dict(user))


@router.get("/me")
def get_me(current_user: User = Depends(require_auth)):
    return _user_to_dict(current_user)
