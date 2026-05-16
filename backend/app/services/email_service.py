"""Email yuborish xizmati.

Production: Brevo HTTP API (Render bepul rejasi SMTP'ni bloklaydi).
Lokal dev: agar BREVO_API_KEY yo'q bo'lsa va SMTP_USER bo'lsa — SMTP fallback.
Hech qaysi sozlanmagan bo'lsa — log'ga yozadi va False qaytaradi.
"""

import logging
import smtplib
import ssl
from email.message import EmailMessage
from email.utils import formataddr

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


def _build_verification_html(full_name: str, code: str, ttl_minutes: int) -> str:
    """6 raqamli tasdiqlash kodi bilan HTML email tanasi."""
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
          <p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:1.6;">
            Kasbim tizimida ro'yxatdan o'tganingiz uchun rahmat. Akkauntingizni
            faollashtirish uchun quyidagi 6 raqamli kodni saytga kiriting:
          </p>
          <div style="text-align:center;margin:28px 0;">
            <div style="display:inline-block;background:linear-gradient(135deg,#eff6ff,#cffafe);border:2px solid #3b82f6;border-radius:14px;padding:24px 40px;">
              <div style="font-family:ui-monospace,Menlo,Monaco,'Courier New',monospace;font-size:36px;font-weight:800;color:#1e40af;letter-spacing:8px;">{code}</div>
            </div>
          </div>
          <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.5;text-align:center;">
            Kod <strong>{ttl_minutes} daqiqa</strong> davomida amal qiladi.<br/>
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


def _send_via_brevo(to_email: str, subject: str, html_body: str, text_body: str) -> bool:
    """Brevo HTTP API orqali email yuborish."""
    sender_email = settings.EMAIL_FROM or settings.SMTP_USER
    if not sender_email:
        logger.error("EMAIL_FROM/SMTP_USER sozlanmagan — sender email yo'q")
        return False

    payload = {
        "sender": {"name": settings.EMAIL_FROM_NAME, "email": sender_email},
        "to": [{"email": to_email}],
        "subject": subject,
        "htmlContent": html_body,
        "textContent": text_body,
    }
    headers = {
        "accept": "application/json",
        "api-key": settings.BREVO_API_KEY,
        "content-type": "application/json",
    }
    try:
        resp = httpx.post(BREVO_API_URL, json=payload, headers=headers, timeout=15)
        if resp.status_code in (200, 201, 202):
            logger.info("Brevo email yuborildi: %s", to_email)
            return True
        logger.error("Brevo xatolik (%s): status=%s body=%s", to_email, resp.status_code, resp.text)
        return False
    except Exception as e:
        logger.exception("Brevo so'rov xatoligi (%s): %s", to_email, e)
        return False


def _send_via_smtp(to_email: str, subject: str, html_body: str, text_body: str) -> bool:
    """SMTP fallback (lokal dev uchun)."""
    msg = EmailMessage()
    msg["Subject"] = subject
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
        logger.info("SMTP email yuborildi: %s", to_email)
        return True
    except Exception as e:
        logger.exception("SMTP yuborish xatoligi (%s): %s", to_email, e)
        return False


def send_verification_email(to_email: str, full_name: str, code: str) -> bool:
    """Email tasdiqlash kodini yuboradi (6 raqamli).

    Avval Brevo, agar sozlanmagan bo'lsa SMTP, agar u ham yo'q bo'lsa log'ga yozadi.
    """
    ttl = settings.EMAIL_VERIFICATION_TTL_MINUTES
    subject = f"Kasbim — Tasdiqlash kodi: {code}"
    html_body = _build_verification_html(full_name, code, ttl)
    text_body = (
        f"Salom, {full_name}!\n\n"
        f"Kasbim'da emailingizni tasdiqlash uchun quyidagi kodni saytga kiriting:\n\n"
        f"   {code}\n\n"
        f"Kod {ttl} daqiqa davomida amal qiladi."
    )

    if settings.BREVO_API_KEY:
        return _send_via_brevo(to_email, subject, html_body, text_body)

    if settings.SMTP_USER and settings.SMTP_PASSWORD:
        return _send_via_smtp(to_email, subject, html_body, text_body)

    logger.warning(
        "Email yuborish sozlanmagan — kod %s ga yuborilmadi (foydalanuvchi: %s)",
        to_email, code,
    )
    return False


# ============================================================
# Parolni tiklash emaili (eski link asosli)
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
    """Parolni tiklash xatini yuboradi."""
    reset_url = f"{settings.FRONTEND_URL.rstrip('/')}/?reset_token={token}"
    ttl = settings.PASSWORD_RESET_TTL_HOURS
    subject = "Kasbim — Parolni tiklash"
    html_body = _build_password_reset_html(full_name, reset_url, ttl)
    text_body = (
        f"Salom, {full_name}!\n\n"
        f"Kasbim hisobingiz uchun parolni tiklash so'rovi qabul qilindi.\n"
        f"Yangi parol o'rnatish uchun shu havolaga o'ting:\n{reset_url}\n\n"
        f"Havola {ttl} soat amal qiladi."
    )

    if settings.BREVO_API_KEY:
        return _send_via_brevo(to_email, subject, html_body, text_body)
    if settings.SMTP_USER and settings.SMTP_PASSWORD:
        return _send_via_smtp(to_email, subject, html_body, text_body)

    logger.warning(
        "Email yuborish sozlanmagan — reset token %s ga yuborilmadi (foydalanuvchi: %s)",
        to_email, token,
    )
    return False
