"""Notification router — inspection reminder push + email notifications.

The POST /send-reminders endpoint is protected by X-Cron-Secret and called
daily at 06:00 UTC by GitHub Actions. Push delivery is stubbed until Firebase
credentials are configured via the FIREBASE_SERVER_KEY environment variable.
Email delivery (opt-in via reminder_email_enabled) is fully functional today
via Resend, the same provider already used for password-reset emails -- it's
the only channel available to web-only users, since push tokens are only
ever registered by the iOS/Android apps.
"""
import logging
import secrets
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import APIRouter, HTTPException, Request

from app.config import settings
from app.database import get_db
from app.deps import DB
from app.models import Apiary, Hive, Inspection, User
from app.schemas import ReminderSendResult

router = APIRouter(prefix="/notifications", tags=["notifications"])
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _send_push(
    token_fcm: str | None,
    token_apns: str | None,
    title: str,
    body: str,
) -> None:
    """Stub push sender.

    Logs a warning when credentials are absent; will call FCM v1 HTTP API
    once FIREBASE_SERVER_KEY is configured.
    """
    if token_fcm:
        if not settings.firebase_server_key:
            logger.warning(
                "FCM token present but FIREBASE_SERVER_KEY not configured — skipping push"
            )
            return
        # TODO: implement real FCM v1 HTTP call when Firebase project is created
        logger.info("FCM push sent (stub): %s", title)
        return

    if token_apns:
        # TODO: implement APNs HTTP/2 call when certificates are available
        logger.info("APNs push stub (not yet configured): %s", title)


def _send_reminder_email(to_email: str, overdue_count: int) -> None:
    """Send an inspection-reminder email via Resend.

    Same provider/pattern as the password-reset email (auth.py's
    _send_reset_email) -- logs and returns rather than raising when
    RESEND_API_KEY is absent, since this must never break the cron run for
    every other user just because one email failed to send.
    """
    if not settings.resend_api_key:
        logger.warning("RESEND_API_KEY not configured — skipping reminder email to %s", to_email)
        return
    hive_word = "hive" if overdue_count == 1 else "hives"
    try:
        resp = httpx.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {settings.resend_api_key}"},
            json={
                "from": "HivePulse <noreply@multihead.de>",
                "to": [to_email],
                "subject": "Inspection due",
                "html": (
                    f"<p>{overdue_count} {hive_word} in your apiaries are due for inspection.</p>"
                    f"<p><a href='{settings.app_base_url}/dashboard'>Open HivePulse</a></p>"
                    f"<p>You can turn off email reminders any time in your profile settings.</p>"
                ),
            },
            timeout=10,
        )
        if resp.status_code >= 400:
            logger.error("Resend API error %s: %s", resp.status_code, resp.text)
        else:
            logger.info("Reminder email sent to %s (id=%s)", to_email, resp.json().get("id"))
    except Exception as exc:
        logger.error("Failed to send reminder email: %s", exc)


def _get_overdue_hive_count(user_id: str, interval_days: int, db) -> int:
    """Count hives owned by user that have not been inspected within interval_days."""
    from sqlalchemy import func, select

    cutoff = datetime.now(timezone.utc) - timedelta(days=interval_days)

    # Subquery: latest inspection created_at per hive
    latest_by_hive = (
        select(Inspection.hive_id, func.max(Inspection.created_at).label("latest"))
        .group_by(Inspection.hive_id)
        .subquery()
    )

    # Select of hive IDs belonging to this user
    user_hive_sel = (
        select(Hive.id)
        .join(Apiary, Hive.apiary_id == Apiary.id)
        .where(Apiary.user_id == user_id)
    )

    # Hives with no inspection at all
    never_inspected = (
        db.query(Hive.id)
        .filter(Hive.id.in_(user_hive_sel))
        .outerjoin(latest_by_hive, Hive.id == latest_by_hive.c.hive_id)
        .filter(latest_by_hive.c.latest.is_(None))
        .count()
    )

    # Hives whose latest inspection is older than cutoff
    overdue = (
        db.query(Hive.id)
        .filter(Hive.id.in_(user_hive_sel))
        .join(latest_by_hive, Hive.id == latest_by_hive.c.hive_id)
        .filter(latest_by_hive.c.latest < cutoff)
        .count()
    )

    return never_inspected + overdue


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------


@router.post("/send-reminders", response_model=ReminderSendResult)
def send_reminders(request: Request, db: DB) -> ReminderSendResult:
    """Cron endpoint — check all users and send overdue inspection reminders.

    Protected by X-Cron-Secret header (constant-time comparison).
    Called daily at 06:00 UTC via GitHub Actions.
    """
    incoming_secret = request.headers.get("X-Cron-Secret", "")
    # Protect against empty cron_secret in dev by requiring non-empty match
    if not settings.cron_secret or not secrets.compare_digest(
        incoming_secret, settings.cron_secret
    ):
        raise HTTPException(status_code=401, detail="Unauthorized")

    current_month = datetime.now(timezone.utc).month
    users = db.query(User).all()

    sent = 0
    skipped_off_season = 0
    skipped_disabled = 0
    skipped_no_channel = 0

    for user in users:
        if not user.reminder_enabled:
            skipped_disabled += 1
            continue

        start = user.reminder_season_start
        end = user.reminder_season_end
        if start <= end:
            in_season = start <= current_month <= end
        else:
            # Season wraps the year boundary (e.g. Oct → Feb)
            in_season = current_month >= start or current_month <= end

        if not in_season:
            skipped_off_season += 1
            continue

        has_push_token = bool(user.push_token_fcm or user.push_token_apns)
        if not has_push_token and not user.reminder_email_enabled:
            skipped_no_channel += 1
            continue

        overdue = _get_overdue_hive_count(user.id, user.reminder_interval_days, db)
        if overdue > 0:
            # Independent channels -- a user with both a push token and
            # reminder_email_enabled gets both, not one-or-the-other.
            if has_push_token:
                hive_word = "hive" if overdue == 1 else "hives"
                _send_push(
                    user.push_token_fcm,
                    user.push_token_apns,
                    title="Inspection due",
                    body=f"{overdue} {hive_word} need inspection",
                )
            if user.reminder_email_enabled:
                _send_reminder_email(user.email, overdue)
            sent += 1

    return ReminderSendResult(
        sent=sent,
        skipped_off_season=skipped_off_season,
        skipped_disabled=skipped_disabled,
        skipped_no_channel=skipped_no_channel,
    )
