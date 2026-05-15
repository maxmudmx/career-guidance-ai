"""Email yuborish xizmati — Gmail SMTP orqali.

SMTP_USER/SMTP_PASSWORD .env'da bo'sh bo'lsa, email yuborilmaydi —
funksiya `False` qaytaradi (lokal dev uchun jim fallback).
"""

import logging
import smtplib
import ssl
from email.message import EmailMessage
from email.utils import formataddr

from app.config import settings

logger = logging.getLogger(__name__)


def _build_verification_html(full_name: str, verify_url: str, ttl_hours: int) -> str:
    """Verifikatsiya emaili uchun HTML tana."""
    return f"""<!DOCTYPE html>
<html lang="uz">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
        <tr><td style="background:linear-gradient(135deg,#3b82f6,#06b6d4);padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;letter-spacing:-0.01em;">Kasbim</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.9);font-size:13px;">AI Kasbga Yo'naltirish Tizimi</p>
        </td></tr>
        <tr><td style="padding:36px 40px 28px;">
          <h2 style="margin:0 0 12px;color:#0f172a;font-size:20px;font-weight:700;">Salom, {full_name}!</h2>
          <p style="margin:0 0 18px;color:#334155;font-size:15px;line-height:1.6;">
            Kasbim tizimida ro'yxatdan o'tganingiz uchun rahmat. Akkauntingizni
            faollashtirish uchun quyidagi tugmani bosing:
          </p>
          <p style="text-align:center;margin:28px 0;">
            <a href="{verify_url}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#06b6d4);color:#fff;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;box-shadow:0 4px 14px rgba(59,130,246,0.35);">
              Emailni tasdiqlash
            </a>
          </p>
          <p style="margin:0 0 8px;color:#64748b;font-size:13px;line-height:1.6;">
            Yoki shu havolani brauzerga nusxalang:
          </p>
          <p style="margin:0 0 20px;color:#3b82f6;font-size:12px;word-break:break-all;font-family:ui-monospace,Menlo,Monaco,monospace;background:#f1f5f9;padding:10px 12px;border-radius:8px;">
            {verify_url}
          </p>
          <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.5;">
            Havola <strong>{ttl_hours} soat</strong> davomida amal qiladi.
            Agar siz ro'yxatdan o'tmagan bo'lsangiz, bu xatni e'tiborsiz qoldiring.
          </p>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:18px 40px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="margin:0;color:#94a3b8;font-size:11px;">
            © Kasbim · Bu avtomatik xat, javob bermang
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


def send_verification_email(to_email: str, full_name: str, token: str) -> bool:
    """Email tasdiqlash xatini yuboradi.

    Returns:
        True — muvaffaqiyatli yuborildi.
        False — SMTP sozlamalari yo'q yoki yuborishda xatolik (xatolik logga yoziladi).
    """
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning(
            "SMTP_USER/SMTP_PASSWORD sozlanmagan — email yuborilmadi (%s ga). "
            "Verify token: %s", to_email, token,
        )
        return False

    verify_url = f"{settings.FRONTEND_URL.rstrip('/')}/?verify_token={token}"
    html_body = _build_verification_html(full_name, verify_url, settings.EMAIL_VERIFICATION_TTL_HOURS)
    text_body = (
        f"Salom, {full_name}!\n\n"
        f"Kasbim da emailni tasdiqlash uchun shu havolaga o'ting:\n{verify_url}\n\n"
        f"Havola {settings.EMAIL_VERIFICATION_TTL_HOURS} soat amal qiladi."
    )

    msg = EmailMessage()
    msg["Subject"] = "Kasbim — Emailingizni tasdiqlang"
    msg["From"] = formataddr((settings.SMTP_FROM_NAME, settings.SMTP_USER))
    msg["To"] = to_email
    msg.set_content(text_body)
    msg.add_alternative(html_body, subtype="html")

    try:
        context = ssl.create_default_context()
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            server.ehlo()
            server.starttls(context=context)
            server.ehlo()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
        logger.info("Verification email yuborildi: %s", to_email)
        return True
    except Exception as e:
        logger.exception("Email yuborish xatoligi (%s): %s", to_email, e)
        return False


# ============================================================
# Parolni tiklash emaili
# ============================================================

def _build_password_reset_html(full_name: str, reset_url: str, ttl_hours: int) -> str:
    return f"""<!DOCTYPE html>
<html lang="uz">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);box-shadow:0 4px 20px rgba(0,0,0,0.4);">
        <tr><td style="background:linear-gradient(135deg,#1e3a8a,#1d4ed8);padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;letter-spacing:-0.02em;">Kasbim</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Parolni tiklash so'rovi</p>
        </td></tr>
        <tr><td style="padding:36px 40px 28px;">
          <h2 style="margin:0 0 12px;color:#f1f5f9;font-size:20px;font-weight:700;">Salom, {full_name}!</h2>
          <p style="margin:0 0 18px;color:#cbd5e1;font-size:15px;line-height:1.6;">
            Kasbim hisobingiz uchun parolni tiklash so'rovi qabul qilindi. Yangi parol o'rnatish
            uchun quyidagi tugmani bosing:
          </p>
          <p style="text-align:center;margin:28px 0;">
            <a href="{reset_url}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:#fff;padding:14px 36px;border-radius:9999px;text-decoration:none;font-weight:700;font-size:15px;box-shadow:0 4px 14px rgba(59,130,246,0.45);">
              Yangi parol o'rnatish
            </a>
          </p>
          <p style="margin:0 0 8px;color:#94a3b8;font-size:13px;line-height:1.6;">
            Yoki shu havolani brauzerga nusxalang:
          </p>
          <p style="margin:0 0 20px;color:#60a5fa;font-size:12px;word-break:break-all;font-family:ui-monospace,Menlo,Monaco,monospace;background:#0f172a;padding:10px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.05);">
            {reset_url}
          </p>
          <p style="margin:0;color:#64748b;font-size:12px;line-height:1.5;">
            Havola <strong style="color:#94a3b8;">{ttl_hours} soat</strong> davomida amal qiladi.
            Agar siz parolni tiklashni so'ramagan bo'lsangiz, bu xatni e'tiborsiz qoldiring —
            akkauntingiz xavfsiz qoladi.
          </p>
        </td></tr>
        <tr><td style="background:#0f172a;padding:18px 40px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);">
          <p style="margin:0;color:#64748b;font-size:11px;">
            © Kasbim · Bu avtomatik xat, javob bermang
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


def send_password_reset_email(to_email: str, full_name: str, token: str) -> bool:
    """Parolni tiklash xatini yuboradi.

    Returns:
        True — muvaffaqiyatli yuborildi yoki SMTP yo'q (lokal dev fallback).
    """
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning(
            "SMTP_USER/SMTP_PASSWORD sozlanmagan — parolni tiklash emaili yuborilmadi (%s ga). "
            "Reset token: %s", to_email, token,
        )
        return False

    reset_url = f"{settings.FRONTEND_URL.rstrip('/')}/?reset_token={token}"
    html_body = _build_password_reset_html(full_name, reset_url, settings.PASSWORD_RESET_TTL_HOURS)
    text_body = (
        f"Salom, {full_name}!\n\n"
        f"Kasbim hisobingiz uchun parolni tiklash so'rovi qabul qilindi.\n"
        f"Yangi parol o'rnatish uchun shu havolaga o'ting:\n{reset_url}\n\n"
        f"Havola {settings.PASSWORD_RESET_TTL_HOURS} soat amal qiladi. "
        f"Agar siz so'ramagan bo'lsangiz, bu xatni e'tiborsiz qoldiring."
    )

    msg = EmailMessage()
    msg["Subject"] = "Kasbim — Parolni tiklash"
    msg["From"] = formataddr((settings.SMTP_FROM_NAME, settings.SMTP_USER))
    msg["To"] = to_email
    msg.set_content(text_body)
    msg.add_alternative(html_body, subtype="html")

    try:
        context = ssl.create_default_context()
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            server.ehlo()
            server.starttls(context=context)
            server.ehlo()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
        logger.info("Password reset email yuborildi: %s", to_email)
        return True
    except Exception as e:
        logger.exception("Password reset email yuborish xatoligi (%s): %s", to_email, e)
        return False
