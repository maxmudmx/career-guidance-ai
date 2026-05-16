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

    # Email yuborish — Brevo HTTP API (Render bepul rejasi SMTP'ni bloklaydi)
    BREVO_API_KEY: str = ""
    EMAIL_FROM: str = ""              # Brevo'da tasdiqlangan sender email
    EMAIL_FROM_NAME: str = "Kasbim"

    # SMTP (lokal dev fallback uchun)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_NAME: str = "Kasbim"

    FRONTEND_URL: str = "http://localhost:5173"
    EMAIL_VERIFICATION_TTL_MINUTES: int = 15  # 6 raqamli kod 15 daqiqa amal qiladi
    PASSWORD_RESET_TTL_HOURS: int = 2

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
