"""Autentifikatsiya API endpointlari."""

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt

from app.database import get_db
from app.config import settings
from app.models.user import User

router = APIRouter(prefix="/api/auth", tags=["Autentifikatsiya"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


# ---- Sxemalar ----

class UserRegister(BaseModel):
    username: str
    email: str
    password: str
    full_name: str | None = None


class UserLogin(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


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


# ---- Endpointlar ----

@router.post("/register", response_model=TokenResponse)
def register(data: UserRegister, db: Session = Depends(get_db)):
    """Yangi foydalanuvchi ro'yxatdan o'tkazish."""
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=400, detail="Bu username allaqachon band")
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Bu email allaqachon ro'yxatdan o'tgan")

    user = User(
        username=data.username,
        email=data.email,
        password_hash=pwd_context.hash(data.password),
        full_name=data.full_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_token({"user_id": user.id, "username": user.username})
    return TokenResponse(
        access_token=token,
        user={
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
        },
    )


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    """Tizimga kirish."""
    user = db.query(User).filter(User.username == data.username).first()
    if not user or not pwd_context.verify(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Login yoki parol noto'g'ri")

    token = create_token({"user_id": user.id, "username": user.username})
    return TokenResponse(
        access_token=token,
        user={
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
        },
    )


@router.get("/me")
def get_me(current_user: User = Depends(require_auth)):
    """Token orqali joriy foydalanuvchi ma'lumotlarini olish."""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
    }
