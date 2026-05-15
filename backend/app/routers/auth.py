"""Autentifikatsiya API endpointlari."""

import os
import re
import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr, field_validator
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt

from app.database import get_db
from app.config import settings
from app.models.user import User
from app.models.email_verification import EmailVerification
from app.models.password_reset import PasswordReset
from app.services.email_service import send_verification_email, send_password_reset_email

router = APIRouter(prefix="/api/auth", tags=["Autentifikatsiya"])

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
        if len(v) < 1:
            raise ValueError("Username bo'sh bo'lmasligi kerak")
        if len(v) > 30:
            raise ValueError("Username 30 ta belgidan oshmasligi kerak")
        import re
        if not re.match(r'^[a-zA-Z0-9_.]+$', v):
            raise ValueError("Username faqat harf, raqam, '_' va '.' dan iborat bo'lishi kerak")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError("Parol kamida 6 ta belgidan iborat bo'lishi kerak")
        return v

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v):
        if v is not None:
            v = v.strip()
            if len(v) > 100:
                raise ValueError("Ism 100 ta belgidan oshmasligi kerak")
        return v


class UserLogin(BaseModel):
    username: str   # email yoki username
    password: str


class GoogleLoginRequest(BaseModel):
    credential: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class RegisterResponse(BaseModel):
    ok: bool = True
    message: str
    email: str


# ---- Yordamchi funksiyalar ----

def create_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def verify_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except Exception:
        return None


def require_auth(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """FastAPI dependency — himoyalangan endpointlar uchun."""
    if not token:
        raise HTTPException(status_code=401, detail="Kirish talab qilinadi. Iltimos tizimga kiring.")
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token yaroqsiz yoki muddati o'tgan")
    user = db.query(User).filter(User.id == payload.get("user_id")).first()
    if not user:
        raise HTTPException(status_code=401, detail="Foydalanuvchi topilmadi")
    return user


def _user_to_dict(user: User) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "avatar_url": getattr(user, "avatar_url", None),
        "is_verified": bool(getattr(user, "is_verified", False)),
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


def _create_verification_token(db: Session, user: User) -> str:
    """Foydalanuvchi uchun yangi verifikatsiya tokenini yaratadi.
    Eski ishlatilmagan tokenlar bekor qilinadi."""
    db.query(EmailVerification).filter(
        EmailVerification.user_id == user.id,
        EmailVerification.used_at.is_(None),
    ).update({"used_at": datetime.utcnow()})

    token = secrets.token_urlsafe(48)
    rec = EmailVerification(
        user_id=user.id,
        token=token,
        expires_at=datetime.utcnow() + timedelta(hours=settings.EMAIL_VERIFICATION_TTL_HOURS),
    )
    db.add(rec)
    db.commit()
    return token


# ---- Endpointlar ----

@router.post("/register", response_model=RegisterResponse)
def register(
    data: UserRegister,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Yangi foydalanuvchi ro'yxatdan o'tkazish.

    Yangi userlar `is_verified=False` bilan yaratiladi va emaillariga
    verifikatsiya havolasi yuboriladi. Tizimga kirish uchun avval
    email tasdiqlanishi shart — shu sababli access token qaytarilmaydi.
    """
    # Email allaqachon bormi?
    if db.query(User).filter(User.email == str(data.email).lower()).first():
        raise HTTPException(
            status_code=400,
            detail="Bu email allaqachon ro'yxatdan o'tgan. Tizimga kiring yoki boshqa email ishlating."
        )
    # Username band emasmi?
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=400, detail="Bu username allaqachon band. Boshqa username tanlang.")

    user = User(
        username=data.username,
        email=str(data.email).lower(),
        password_hash=pwd_context.hash(data.password),
        full_name=data.full_name or data.username,
        is_verified=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Verifikatsiya tokeni va email — fonda yuboriladi
    verify_token_str = _create_verification_token(db, user)
    background_tasks.add_task(
        send_verification_email,
        user.email,
        user.full_name or user.username,
        verify_token_str,
    )

    return RegisterResponse(
        ok=True,
        message=(
            "Ro'yxatdan o'tdingiz! Emailingizga tasdiqlash havolasi yubordik. "
            "Pochtangizdagi havolani bosing va keyin tizimga kiring."
        ),
        email=user.email,
    )


# ---- Email verification endpointlari ----

class VerifyEmailRequest(BaseModel):
    token: str


class ResendVerificationRequest(BaseModel):
    email: EmailStr


@router.post("/verify-email")
def verify_email(data: VerifyEmailRequest, db: Session = Depends(get_db)):
    """Token orqali emailni tasdiqlash.

    Idempotent: bir token bir necha marta yuborilsa (React Strict Mode ikki marta
    chaqirishi yoki email klient link'ni preview qilishi natijasida), 60 sekund
    ichida takroriy chaqiruv ham muvaffaqiyatli javob qaytaradi.
    """
    rec = db.query(EmailVerification).filter(EmailVerification.token == data.token).first()
    if not rec:
        raise HTTPException(status_code=400, detail="Havola noto'g'ri yoki bekor qilingan.")

    user = db.query(User).filter(User.id == rec.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi.")

    # Token allaqachon ishlatilgan
    if rec.used_at is not None:
        # Yaqinda ishlatilgan + user verified → idempotent muvaffaqiyat
        recently_used = (datetime.utcnow() - rec.used_at).total_seconds() < 60
        if user.is_verified and recently_used:
            access_token = create_token({"user_id": user.id, "username": user.username})
            return {
                "ok": True,
                "message": "Email tasdiqlangan.",
                "user": _user_to_dict(user),
                "access_token": access_token,
                "token_type": "bearer",
            }
        raise HTTPException(status_code=400, detail="Bu havola allaqachon ishlatilgan.")

    if rec.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Havola muddati tugagan. Qaytadan jo'natishni so'rang.")

    user.is_verified = True
    rec.used_at = datetime.utcnow()
    db.commit()
    db.refresh(user)

    access_token = create_token({"user_id": user.id, "username": user.username})
    return {
        "ok": True,
        "message": "Email muvaffaqiyatli tasdiqlandi.",
        "user": _user_to_dict(user),
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.post("/resend-verification")
def resend_verification(
    data: ResendVerificationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Verifikatsiya emailini qaytadan jo'natish.

    Bir daqiqada bir necha marta so'rashning oldini olish uchun
    eng yangi token 60 sekunddan kam bo'lsa, yangi yubormaymiz.
    """
    user = db.query(User).filter(User.email == str(data.email).lower()).first()
    # Email enumeration'dan saqlanish — har doim bir xil javob
    generic_response = {"ok": True, "message": "Agar email mavjud bo'lsa, havola yuborildi."}

    if not user:
        return generic_response
    if user.is_verified:
        return {"ok": True, "message": "Bu email allaqachon tasdiqlangan."}

    # Throttle: oxirgi token 60s ichida yuborilgan bo'lsa, qaytarmaymiz
    last = (
        db.query(EmailVerification)
        .filter(EmailVerification.user_id == user.id)
        .order_by(EmailVerification.created_at.desc())
        .first()
    )
    if last and (datetime.utcnow() - last.created_at).total_seconds() < 60:
        raise HTTPException(
            status_code=429,
            detail="Iltimos, qayta urinishdan oldin 1 daqiqa kuting.",
        )

    new_token = _create_verification_token(db, user)
    background_tasks.add_task(
        send_verification_email,
        user.email,
        user.full_name or user.username,
        new_token,
    )
    return generic_response


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    """Tizimga kirish (username yoki email bilan)."""
    identifier = data.username.strip()

    # Email yoki username orqali qidirish
    user = db.query(User).filter(User.username == identifier).first()
    if not user:
        user = db.query(User).filter(User.email == identifier.lower()).first()

    if not user or not pwd_context.verify(data.password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Login (username/email) yoki parol noto'g'ri"
        )

    if not user.is_verified:
        raise HTTPException(
            status_code=403,
            detail={
                "code": "email_not_verified",
                "message": "Emailingiz hali tasdiqlanmagan. Pochtangizdagi havolani bosing yoki yangi havola so'rang.",
                "email": user.email,
            },
        )

    token = create_token({"user_id": user.id, "username": user.username})
    return TokenResponse(access_token=token, user=_user_to_dict(user))


@router.get("/me")
def get_me(current_user: User = Depends(require_auth)):
    """Token orqali joriy foydalanuvchi ma'lumotlarini olish."""
    return _user_to_dict(current_user)


# ============================================================
# Parolni tiklash (Forgot / Reset password)
# ============================================================

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v):
        if len(v) < 6:
            raise ValueError("Parol kamida 6 ta belgidan iborat bo'lishi kerak")
        return v


class VerifyResetTokenRequest(BaseModel):
    token: str


def _create_password_reset_token(db: Session, user: User) -> str:
    """Foydalanuvchi uchun yangi parolni tiklash tokenini yaratadi.
    Eski ishlatilmagan tokenlar bekor qilinadi."""
    db.query(PasswordReset).filter(
        PasswordReset.user_id == user.id,
        PasswordReset.used_at.is_(None),
    ).update({"used_at": datetime.utcnow()})

    token = secrets.token_urlsafe(48)
    rec = PasswordReset(
        user_id=user.id,
        token=token,
        expires_at=datetime.utcnow() + timedelta(hours=settings.PASSWORD_RESET_TTL_HOURS),
    )
    db.add(rec)
    db.commit()
    return token


@router.post("/forgot-password")
def forgot_password(
    data: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Parolni tiklash — emailga havola yuboradi.

    Email enumeration'dan saqlanish uchun har doim bir xil javob qaytaradi
    (foydalanuvchi mavjud yoki yo'qligini bildirmaydi).
    """
    generic_response = {
        "ok": True,
        "message": "Agar bu email tizimda mavjud bo'lsa, parolni tiklash havolasi yuborildi.",
    }

    user = db.query(User).filter(User.email == str(data.email).lower()).first()
    if not user:
        return generic_response

    # Throttle: oxirgi token 60s ichida yuborilgan bo'lsa, qaytarmaymiz
    last = (
        db.query(PasswordReset)
        .filter(PasswordReset.user_id == user.id)
        .order_by(PasswordReset.created_at.desc())
        .first()
    )
    if last and (datetime.utcnow() - last.created_at).total_seconds() < 60:
        raise HTTPException(
            status_code=429,
            detail="Iltimos, qayta urinishdan oldin 1 daqiqa kuting.",
        )

    new_token = _create_password_reset_token(db, user)
    background_tasks.add_task(
        send_password_reset_email,
        user.email,
        user.full_name or user.username,
        new_token,
    )
    return generic_response


@router.post("/verify-reset-token")
def verify_reset_token(data: VerifyResetTokenRequest, db: Session = Depends(get_db)):
    """Tokenning hali yaroqliligini tekshiradi (frontend reset sahifasi uchun)."""
    rec = db.query(PasswordReset).filter(PasswordReset.token == data.token).first()
    if not rec:
        raise HTTPException(status_code=400, detail="Havola noto'g'ri yoki bekor qilingan.")
    if rec.used_at is not None:
        raise HTTPException(status_code=400, detail="Bu havola allaqachon ishlatilgan.")
    if rec.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Havola muddati tugagan. Qaytadan jo'natishni so'rang.")
    return {"ok": True, "valid": True}


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Token orqali yangi parolni o'rnatadi."""
    rec = db.query(PasswordReset).filter(PasswordReset.token == data.token).first()
    if not rec:
        raise HTTPException(status_code=400, detail="Havola noto'g'ri yoki bekor qilingan.")
    if rec.used_at is not None:
        raise HTTPException(status_code=400, detail="Bu havola allaqachon ishlatilgan.")
    if rec.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Havola muddati tugagan. Qaytadan jo'natishni so'rang.")

    user = db.query(User).filter(User.id == rec.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi.")

    # Parolni yangilash
    user.password_hash = pwd_context.hash(data.new_password)
    # Email tasdiqlangan deb belgilash (parolni eshitish — ownership tasdiqi)
    if not user.is_verified:
        user.is_verified = True

    rec.used_at = datetime.utcnow()
    db.commit()
    db.refresh(user)

    # Yangi parol bilan darhol kirish uchun token qaytaramiz
    access_token = create_token({"user_id": user.id, "username": user.username})
    return {
        "ok": True,
        "message": "Parol muvaffaqiyatli yangilandi.",
        "access_token": access_token,
        "token_type": "bearer",
        "user": _user_to_dict(user),
    }


@router.post("/google", response_model=TokenResponse)
def google_auth(data: GoogleLoginRequest, db: Session = Depends(get_db)):
    """Google OAuth access token orqali kirish yoki ro'yxatdan o'tish."""
    import urllib.request
    import json as _json

    try:
        req = urllib.request.Request(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {data.credential}"},
        )
        with urllib.request.urlopen(req, timeout=8) as resp:
            idinfo = _json.loads(resp.read())
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Google token yaroqsiz: {e}")

    email = idinfo.get("email", "").lower()
    full_name = idinfo.get("name", "")
    avatar_url = idinfo.get("picture", None)

    if not email:
        raise HTTPException(status_code=400, detail="Google akkauntda email topilmadi")

    # Mavjud foydalanuvchini qidirish
    user = db.query(User).filter(User.email == email).first()

    if not user:
        # Yangi foydalanuvchi yaratish
        base_username = re.sub(r"[^a-zA-Z0-9_.]", "", email.split("@")[0]) or "user"
        username = base_username
        counter = 1
        while db.query(User).filter(User.username == username).first():
            username = f"{base_username}{counter}"
            counter += 1

        user = User(
            username=username,
            email=email,
            password_hash=pwd_context.hash(os.urandom(32).hex()),
            full_name=full_name or username,
            avatar_url=avatar_url,
            is_verified=True,  # Google email allaqachon tasdiqlangan
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Mavjud user: agar Google orqali kelsa, verified deb belgilaymiz
        changed = False
        if not user.is_verified:
            user.is_verified = True
            changed = True
        if avatar_url and not getattr(user, "avatar_url", None):
            user.avatar_url = avatar_url
            changed = True
        if changed:
            db.commit()
            db.refresh(user)

    token = create_token({"user_id": user.id, "username": user.username})
    return TokenResponse(access_token=token, user=_user_to_dict(user))
