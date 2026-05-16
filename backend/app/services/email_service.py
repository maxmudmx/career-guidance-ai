"""Email yuborish — Brevo HTTP API orqali 6 raqamli tasdiqlash kodi.

Render bepul rejasi SMTP (25/465/587) portlarini bloklaydi, shuning uchun
SMTP o'rniga Brevo'ning HTTP API ishlatamiz.
"""

import logging
import httpx

from app.config import settings

logger = logging.getLogger(__name__)

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


def _build_html(full_name: str, code: str, ttl_minutes: int) -> str:
    """6 raqamli kod bilan chiroyli HTML email."""
    return f"""<!DOCTYPE html>
<html lang="uz">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e5e5;">
        <tr><td style="background:#000000;padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">Kasbim</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">AI Kasbga Yo'naltirish Tizimi</p>
        </td></tr>
        <tr><td style="padding:36px 40px 28px;">
          <h2 style="margin:0 0 12px;color:#000000;font-size:20px;font-weight:700;">Salom, {full_name}!</h2>
          <p style="margin:0 0 24px;color:#404040;font-size:15px;line-height:1.6;">
            Kasbim tizimida ro'yxatdan o'tganingiz uchun rahmat. Akkauntingizni
            faollashtirish uchun quyidagi 6 raqamli kodni saytga kiriting:
          </p>
          <div style="text-align:center;margin:28px 0;">
            <div style="display:inline-block;background:#fafafa;border:2px solid #000000;border-radius:14px;padding:24px 40px;">
              <div style="font-family:ui-monospace,Menlo,monospace;font-size:36px;font-weight:800;color:#000000;letter-spacing:8px;">{code}</div>
            </div>
          </div>
          <p style="margin:0;color:#737373;font-size:12px;line-height:1.5;text-align:center;">
            Kod <strong>{ttl_minutes} daqiqa</strong> davomida amal qiladi.<br/>
            Agar siz ro'yxatdan o'tmagan bo'lsangiz, bu xatni e'tiborsiz qoldiring.
          </p>
        </td></tr>
        <tr><td style="background:#fafafa;padding:18px 40px;text-align:center;border-top:1px solid #e5e5e5;">
          <p style="margin:0;color:#737373;font-size:11px;">
            © Kasbim · Bu avtomatik xat, javob bermang
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


def send_verification_email(to_email: str, full_name: str, code: str) -> bool:
    """6 raqamli tasdiqlash kodini Brevo HTTP API orqali yuboradi."""
    if not settings.BREVO_API_KEY:
        logger.warning("BREVO_API_KEY sozlanmagan — kod %s yuborilmadi (%s)", code, to_email)
        return False

    sender_email = settings.EMAIL_FROM
    if not sender_email:
        logger.error("EMAIL_FROM sozlanmagan")
        return False

    ttl = settings.EMAIL_VERIFICATION_TTL_MINUTES
    subject = f"Kasbim — Tasdiqlash kodi: {code}"
    html_body = _build_html(full_name, code, ttl)
    text_body = (
        f"Salom, {full_name}!\n\n"
        f"Kasbim'da emailingizni tasdiqlash uchun quyidagi kodni saytga kiriting:\n\n"
        f"   {code}\n\n"
        f"Kod {ttl} daqiqa davomida amal qiladi."
    )

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
        logger.error("Brevo xato (%s): status=%s body=%s", to_email, resp.status_code, resp.text)
        return False
    except Exception as e:
        logger.exception("Brevo so'rov xatosi (%s): %s", to_email, e)
        return False
