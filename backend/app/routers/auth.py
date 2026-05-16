"""Autentifikatsiya API — sodda email/parol asosli (diplom versiyasi)."""

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr, field_validator
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt
import re

from app.database import get_db
from app.config import settings
from app.models.user import User

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
    username: str  # email yoki username
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


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


def _user_to_dict(user: User) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


# ---- Endpointlar ----

@router.post("/register", response_model=TokenResponse)
def register(data: UserRegister, db: Session = Depends(get_db)):
    """Yangi foydalanuvchi ro'yxatdan o'tkazish — darhol login."""
    if db.query(User).filter(User.email == str(data.email).lower()).first():
        raise HTTPException(status_code=400, detail="Bu email allaqachon ro'yxatdan o'tgan")
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=400, detail="Bu username allaqachon band")

    user = User(
        username=data.username,
        email=str(data.email).lower(),
        password_hash=pwd_context.hash(data.password),
        full_name=data.full_name or data.username,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_token({"user_id": user.id, "username": user.username})
    return TokenResponse(access_token=token, user=_user_to_dict(user))


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    """Tizimga kirish (username yoki email bilan)."""
    identifier = data.username.strip()
    user = db.query(User).filter(User.username == identifier).first()
    if not user:
        user = db.query(User).filter(User.email == identifier.lower()).first()

    if not user or not pwd_context.verify(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Login yoki parol noto'g'ri")

    token = create_token({"user_id": user.id, "username": user.username})
    return TokenResponse(access_token=token, user=_user_to_dict(user))


@router.get("/me")
def get_me(current_user: User = Depends(require_auth)):
    """Joriy foydalanuvchi ma'lumotlari."""
    return _user_to_dict(current_user)
