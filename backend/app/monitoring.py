"""Crash and error reporting.

Without a DSN this is inert, so development, tests and a self-hosted deployment run with no
reporting at all. With one, unhandled errors reach Sentry — otherwise the only way to learn
about a broken endpoint is a user writing in.

Beekeeper data must not travel with a report: we send no request bodies, no cookies and no
IP addresses, and [scrub_event] removes the fields that still tend to carry secrets.
"""
from __future__ import annotations

import logging
from typing import Any, Optional

from app.config import settings

logger = logging.getLogger(__name__)

SENSITIVE_KEYS = {
    "authorization", "cookie", "set-cookie", "x-cron-secret", "cron_secret", "password",
    "current_password", "new_password", "access_token", "refresh_token", "token",
    "secret_key", "resend_api_key", "firebase_service_account_json", "apns_private_key_p8",
}


def scrub_event(event: dict[str, Any], _hint: Optional[dict] = None) -> dict[str, Any]:
    """Drop anything that could carry credentials or personal data."""
    request = event.get("request")
    if isinstance(request, dict):
        request.pop("data", None)      # request bodies hold passwords and notes
        request.pop("cookies", None)
        request.pop("env", None)       # REMOTE_ADDR lives here
        request.pop("query_string", None)
        headers = request.get("headers")
        if isinstance(headers, dict):
            request["headers"] = {
                key: ("[filtered]" if key.lower() in SENSITIVE_KEYS else value)
                for key, value in headers.items()
            }
    # A user id is enough to find the account; the address is not ours to send.
    user = event.get("user")
    if isinstance(user, dict):
        for key in ("email", "ip_address", "username"):
            user.pop(key, None)
    extra = event.get("extra")
    if isinstance(extra, dict):
        for key in list(extra):
            if key.lower() in SENSITIVE_KEYS:
                extra[key] = "[filtered]"
    return event


def init_monitoring() -> bool:
    """Start error reporting when a DSN is configured. Returns whether it was started."""
    dsn = settings.sentry_dsn.strip()
    if not dsn:
        return False
    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.starlette import StarletteIntegration
    except ImportError:
        logger.warning("SENTRY_DSN is set but sentry-sdk is not installed — error reporting off")
        return False

    try:
        sentry_sdk.init(
            dsn=dsn,
            environment=settings.environment,
            release=settings.release,
            # Errors only: performance tracing on a serverless backend costs quota without
            # telling us much that the Vercel logs do not.
            traces_sample_rate=0.0,
            send_default_pii=False,
            max_request_body_size="never",
            before_send=scrub_event,
            integrations=[StarletteIntegration(), FastApiIntegration()],
        )
    except Exception:
        # Reporting runs before the app object exists, so anything raised here would take
        # the whole API down at import. sentry-sdk 2.20 did exactly that when markupsafe
        # was installed without jinja2. Losing reports is bad; losing the API is worse.
        logger.exception("Error reporting could not be started — continuing without it")
        return False

    logger.info("Error reporting enabled for environment %s", settings.environment)
    return True


class CrashReportingSelfTest(RuntimeError):
    """Raised on purpose by the admin self-test. Never a real failure."""


def send_self_test() -> dict:
    """Report a deliberate error so an admin can see whether reports actually arrive.

    Waiting for a real crash to find out that reporting was misconfigured defeats the
    point of having it. The message carries no account data: the admin who triggered it
    is identifiable from the access log, and Sentry does not need to know.
    """
    result = {
        "reporting_enabled": False,
        "event_id": None,
        "environment": settings.environment,
        "release": settings.release,
    }
    if not settings.sentry_dsn.strip():
        return result

    try:
        import sentry_sdk
    except ImportError:
        return result

    result["reporting_enabled"] = True
    try:
        raise CrashReportingSelfTest(
            "Crash reporting self-test — a deliberate error, safe to resolve"
        )
    except CrashReportingSelfTest:
        result["event_id"] = sentry_sdk.capture_exception()

    # Sending happens on a background thread, and a serverless function is frozen the
    # moment it answers — without this the report would often never leave the machine.
    sentry_sdk.flush(timeout=5)
    return result
