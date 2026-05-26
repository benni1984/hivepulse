"""Notification router — inspection reminder push notifications.

The POST /send-reminders endpoint is protected by X-Cron-Secret and called
daily at 06:00 UTC by GitHub Actions. Push delivery is stubbed until Firebase
credentials are configured via the FIREBASE_SERVER_KEY environment variable.
"""
import logging
import secrets
from datetime import datetime, timedelta, timezone

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
    skipped_no_token = 0

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

        if not user.push_token_fcm and not user.push_token_apns:
            skipped_no_token += 1
            continue

        overdue = _get_overdue_hive_count(user.id, user.reminder_interval_days, db)
        if overdue > 0:
            hive_word = "hive" if overdue == 1 else "hives"
            _send_push(
                user.push_token_fcm,
                user.push_token_apns,
                title="Inspection due",
                body=f"{overdue} {hive_word} need inspection",
            )
            sent += 1

    return ReminderSendResult(
        sent=sent,
        skipped_off_season=skipped_off_season,
        skipped_disabled=skipped_disabled,
        skipped_no_token=skipped_no_token,
    )
