"""Loyiha konfiguratsiyasi - .env faylidan o'qiydi."""

from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/career_guidance"
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Email yuborish (Brevo HTTP API)
    BREVO_API_KEY: str = ""
    EMAIL_FROM: str = ""
    EMAIL_FROM_NAME: str = "Kasbim"
    EMAIL_VERIFICATION_TTL_MINUTES: int = 15

    # Super-admin: bu emaildan adminlikni hech kim olib tashlay olmaydi
    # va bu foydalanuvchini o'chirib bo'lmaydi.
    SUPER_ADMIN_EMAIL: str = "elmurodovmaxmud8@gmail.com"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
