"""Loyiha konfiguratsiyasi - .env faylidan o'qiydi."""

from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/career_guidance"
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    HH_API_TOKEN: str = ""

    # SMTP (Gmail) — email tasdiqlash uchun
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""               # Gmail manzilingiz
    SMTP_PASSWORD: str = ""           # Gmail App Password (16 belgili, bo'shliqsiz)
    SMTP_FROM_NAME: str = "Kasbim"
    FRONTEND_URL: str = "http://localhost:5173"
    EMAIL_VERIFICATION_TTL_HOURS: int = 24
    PASSWORD_RESET_TTL_HOURS: int = 2  # parolni tiklash havolasi 2 soat amal qiladi

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
