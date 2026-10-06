"""Sending one email through Resend, without ever failing the request that asked for it."""
import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


def send_email(to_email: str, subject: str, html: str) -> bool:
    """True when Resend accepted it. A failed mail is logged and swallowed: the thing the person
    asked for (an invitation, say) has already been stored, and must not look like it failed
    because a mail provider had a bad minute."""
    if not settings.resend_api_key:
        logger.warning("RESEND_API_KEY not configured, not sending '%s' to %s", subject, to_email)
        return False
    try:
        response = httpx.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {settings.resend_api_key}"},
            json={
                "from": "HivePulse <noreply@multihead.de>",
                "to": [to_email],
                "subject": subject,
                "html": html,
            },
            timeout=10,
        )
    except httpx.HTTPError as failure:
        logger.error("Could not send email to %s: %s", to_email, failure)
        return False
    if response.status_code >= 400:
        logger.error("Resend refused the email to %s: %s %s", to_email, response.status_code, response.text)
        return False
    return True
