"""Push delivery for Android (FCM HTTP v1) and iOS (APNs HTTP/2).

Both senders are no-ops without credentials: a cron run that reminds a hundred beekeepers
must not fail because one channel is unconfigured. The caller gets a [PushResult] back so a
token the platform reports as dead can be removed from the account.

Why FCM *v1*: the legacy `key=AAAA…` server-key endpoint Google shut down in 2024 is gone,
so delivery needs a service account and an OAuth2 access token.
"""
from __future__ import annotations

import json
import logging
import time
from dataclasses import dataclass
from enum import Enum
from typing import Optional

import httpx
from jose import jwt

from app.config import settings

logger = logging.getLogger(__name__)

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
FCM_SCOPE = "https://www.googleapis.com/auth/firebase.messaging"
APNS_HOST = "https://api.push.apple.com"
APNS_SANDBOX_HOST = "https://api.sandbox.push.apple.com"


class PushResult(Enum):
    SENT = "sent"
    SKIPPED = "skipped"          # no credentials configured
    FAILED = "failed"            # transient: network, 5xx, rate limit
    UNREGISTERED = "unregistered"  # the token is dead — stop using it


@dataclass
class _CachedToken:
    value: str
    expires_at: float

    @property
    def valid(self) -> bool:
        return time.time() < self.expires_at - 60  # refresh a minute early


_google_token: Optional[_CachedToken] = None
_apns_token: Optional[_CachedToken] = None


def _service_account() -> Optional[dict]:
    raw = settings.firebase_service_account_json.strip()
    if not raw:
        return None
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        logger.error("FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON — push to Android disabled")
        return None


def _google_access_token() -> Optional[str]:
    """OAuth2 access token for FCM, signed with the service account key."""
    global _google_token
    if _google_token and _google_token.valid:
        return _google_token.value

    account = _service_account()
    if not account:
        return None

    now = int(time.time())
    assertion = jwt.encode(
        {
            "iss": account["client_email"],
            "scope": FCM_SCOPE,
            "aud": GOOGLE_TOKEN_URL,
            "iat": now,
            "exp": now + 3600,
        },
        account["private_key"],
        algorithm="RS256",
        headers={"kid": account.get("private_key_id")},
    )
    try:
        response = httpx.post(
            GOOGLE_TOKEN_URL,
            data={"grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer", "assertion": assertion},
            timeout=10,
        )
    except httpx.HTTPError as exc:
        logger.error("Could not reach Google token endpoint: %s", exc)
        return None

    if response.status_code >= 400:
        logger.error("Google token endpoint refused the assertion: %s %s", response.status_code, response.text)
        return None

    payload = response.json()
    _google_token = _CachedToken(payload["access_token"], time.time() + payload.get("expires_in", 3600))
    return _google_token.value


def send_fcm(token: str, title: str, body: str) -> PushResult:
    """One notification to one Android device."""
    project_id = settings.firebase_project_id.strip()
    access_token = _google_access_token()
    if not project_id or not access_token:
        logger.warning("FCM token present but Firebase is not configured — skipping push")
        return PushResult.SKIPPED

    try:
        response = httpx.post(
            f"https://fcm.googleapis.com/v1/projects/{project_id}/messages:send",
            headers={"Authorization": f"Bearer {access_token}"},
            json={"message": {"token": token, "notification": {"title": title, "body": body}}},
            timeout=10,
        )
    except httpx.HTTPError as exc:
        logger.error("FCM request failed: %s", exc)
        return PushResult.FAILED

    if response.status_code < 300:
        return PushResult.SENT
    # The app was uninstalled or the token was replaced; keeping it only wastes requests.
    if response.status_code in (400, 403, 404) and "UNREGISTERED" in response.text.upper():
        return PushResult.UNREGISTERED
    if response.status_code == 404:
        return PushResult.UNREGISTERED
    logger.error("FCM refused the message: %s %s", response.status_code, response.text)
    return PushResult.FAILED


def _apns_jwt() -> Optional[str]:
    """Provider token for APNs, signed with the .p8 auth key (ES256)."""
    global _apns_token
    if _apns_token and _apns_token.valid:
        return _apns_token.value

    key = settings.apns_private_key_p8.strip().replace("\\n", "\n")
    if not key or not settings.apns_key_id or not settings.apns_team_id:
        return None

    now = int(time.time())
    try:
        token = jwt.encode(
            {"iss": settings.apns_team_id, "iat": now},
            key,
            algorithm="ES256",
            headers={"kid": settings.apns_key_id},
        )
    except Exception as exc:  # malformed key material
        logger.error("Could not sign the APNs provider token: %s", exc)
        return None

    # Apple rejects tokens older than an hour and refuses refreshes more often than 20 minutes.
    _apns_token = _CachedToken(token, time.time() + 2400)
    return _apns_token.value


def send_apns(token: str, title: str, body: str) -> PushResult:
    """One notification to one iPhone."""
    provider_token = _apns_jwt()
    if not provider_token:
        logger.warning("APNs token present but APNs is not configured — skipping push")
        return PushResult.SKIPPED

    host = APNS_SANDBOX_HOST if settings.apns_sandbox else APNS_HOST
    try:
        # APNs only speaks HTTP/2.
        with httpx.Client(http2=True, timeout=10) as client:
            response = client.post(
                f"{host}/3/device/{token}",
                headers={
                    "authorization": f"bearer {provider_token}",
                    "apns-topic": settings.apns_bundle_id,
                    "apns-push-type": "alert",
                    "apns-priority": "10",
                },
                json={"aps": {"alert": {"title": title, "body": body}, "sound": "default"}},
            )
    except httpx.HTTPError as exc:
        logger.error("APNs request failed: %s", exc)
        return PushResult.FAILED

    if response.status_code < 300:
        return PushResult.SENT
    if response.status_code in (400, 410) and "BadDeviceToken" in response.text or response.status_code == 410:
        return PushResult.UNREGISTERED
    logger.error("APNs refused the notification: %s %s", response.status_code, response.text)
    return PushResult.FAILED
