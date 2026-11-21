"""The Paddle API key's expiry date, and who finds out when it passes (#528).

The live Paddle account does not offer "never expire" for an API key — a date is required. That
matters more than a wrong sentence in a setup guide, because of **how** the key fails.

This server never talks to Paddle. RevenueCat does. So when the key expires, RevenueCat loses
its connection and our side carries on as if nothing had happened: `GET /subscriptions/me` keeps
answering, the webhook endpoint keeps listening, and nothing turns red anywhere. Since #541 the
customer at least sees an error instead of a dead link — the checkout runs in their browser and
its failure reaches the page — but *we* still hear nothing, because the website has no crash
reporting of its own. The only symptom would be that purchases stop.

A date we were told cannot be verified; this module does not pretend otherwise. What it does is
refuse to let a date somebody typed into Paddle live only in Paddle: it is written down as
`PADDLE_API_KEY_EXPIRES_AT`, shown on the admin health page, and said out loud by the daily cron
while there is still time to rotate it.
"""
from __future__ import annotations

import logging
from datetime import date
from typing import Optional

from app.clock import today_utc
from app.config import settings

log = logging.getLogger(__name__)

#: How long before the date somebody should hear about it. Four weeks is a month's notice and
#: four chances to see the warning on a Monday, which is long enough to rotate a key that needs
#: a console visit and a redeploy on somebody else's dashboard.
WARN_WITHIN_DAYS = 30


def expires_on() -> Optional[date]:
    """The configured date, or None when nobody wrote one down.

    An unparseable value is None too, and says so in the log. The alternative — raising — would
    take down the daily reminder run for every beekeeper over a typo in a date, which is a worse
    outcome than the warning this module exists to give.
    """
    raw = settings.paddle_api_key_expires_at.strip()
    if not raw:
        return None
    try:
        return date.fromisoformat(raw)
    except ValueError:
        log.warning("PADDLE_API_KEY_EXPIRES_AT is not an ISO date (YYYY-MM-DD): %r", raw)
        return None


def days_left(today: Optional[date] = None) -> Optional[int]:
    """Days until the key stops working; negative once it has. None when no date is known."""
    expiry = expires_on()
    if expiry is None:
        return None
    return (expiry - (today or today_utc())).days


def status(today: Optional[date] = None) -> dict:
    """What the admin health page reports.

    `known: false` is a finding of its own and not an absence: a key that must expire and whose
    date nobody wrote down is exactly the situation #528 is about.
    """
    left = days_left(today)
    return {
        "paddle_key_expiry_known": left is not None,
        "paddle_key_expires_at": settings.paddle_api_key_expires_at.strip() or None,
        "paddle_key_days_left": left,
        "paddle_key_expiring_soon": left is not None and left <= WARN_WITHIN_DAYS,
        "paddle_key_expired": left is not None and left < 0,
    }


def warn_if_expiring(today: Optional[date] = None) -> Optional[str]:
    """Say it out loud, once a day, while there is still time. Returns the message or None.

    Called from the daily reminder run rather than from a schedule of its own: that one already
    runs every morning, and an extra schedule is an extra thing to forget. It is also the reason
    this is a log line and a Sentry message rather than a mail — the run has no address to write
    to, and Sentry is where somebody already looks.
    """
    left = days_left(today)
    if left is None or left > WARN_WITHIN_DAYS:
        return None

    message = (
        f"The Paddle API key expired {abs(left)} day(s) ago — RevenueCat can no longer reach "
        f"Paddle, and web purchases are failing."
        if left < 0 else
        f"The Paddle API key expires in {left} day(s). Rotate it in Paddle, paste it into "
        f"RevenueCat, and move PADDLE_API_KEY_EXPIRES_AT with it."
    )
    log.warning(message)
    try:
        import sentry_sdk

        sentry_sdk.capture_message(message, level="error" if left < 0 else "warning")
    except Exception:  # pragma: no cover - reporting must never break the run
        # No Sentry configured, or it failed. The log line above is still there, and a cron that
        # dies while warning about a key is worse than a key nobody was warned about.
        log.debug("could not report the Paddle key warning to Sentry", exc_info=True)
    return message
