"""Talking to Apple on behalf of an account: trading a sign-in code for a token, and giving
that token back when the account is deleted.

Apple requires the second part. An app that offers Sign in with Apple has to revoke the
user's tokens when it deletes their account, otherwise the user keeps seeing the app under
"Sign in with Apple" in their Apple ID settings, connected to an account that no longer exists.

Both calls need a client secret, which is a short-lived JWT signed with the .p8 key from the
Apple developer account. Nothing here raises: a failed call to Apple must never block a
sign-in or stand between a person and the deletion of their own data. Failures are logged
without the token, and the caller carries on.
"""
from __future__ import annotations

import logging
import time
from typing import Optional

import httpx
from jose import jwt

from app.config import settings

logger = logging.getLogger(__name__)

APPLE_AUDIENCE = "https://appleid.apple.com"
TOKEN_URL = "https://appleid.apple.com/auth/token"
REVOKE_URL = "https://appleid.apple.com/auth/revoke"

# Long enough to cover one request, short enough that a leaked secret is useless by morning.
_SECRET_LIFETIME_SECONDS = 300


def configured() -> bool:
    return bool(
        settings.apple_team_id and settings.apple_key_id and settings.apple_private_key.strip()
    )


def _client_secret(client_id: str) -> Optional[str]:
    if not configured():
        return None
    # The key is pasted into a one-line environment variable, where newlines turn up as "\n".
    key = settings.apple_private_key.strip().replace("\\n", "\n")
    now = int(time.time())
    try:
        return jwt.encode(
            {
                "iss": settings.apple_team_id,
                "iat": now,
                "exp": now + _SECRET_LIFETIME_SECONDS,
                "aud": APPLE_AUDIENCE,
                "sub": client_id,
            },
            key,
            algorithm="ES256",
            headers={"kid": settings.apple_key_id},
        )
    except Exception as failure:  # malformed key material
        logger.error("Could not sign the Apple client secret: %s", failure)
        return None


def web_redirect_uri() -> str:
    """The address the browser sign-in registered, which Apple compares against."""
    return f"{settings.app_base_url.rstrip('/')}/api/v1/auth/apple/callback"


def exchange_code(code: str, client_id: str) -> Optional[str]:
    """Trade the one-time code from a sign-in for a refresh token. None when it fails.

    The client ID has to be the one the code was issued to: the app's bundle ID for the iPhone,
    the Services ID for the browser. The token's own audience says which it was.
    """
    secret = _client_secret(client_id)
    if secret is None:
        return None
    data = {
        "client_id": client_id,
        "client_secret": secret,
        "code": code,
        "grant_type": "authorization_code",
    }
    if client_id != settings.apns_bundle_id:
        # Only the browser flow has a redirect, and Apple insists it matches.
        data["redirect_uri"] = web_redirect_uri()
    try:
        response = httpx.post(TOKEN_URL, data=data, timeout=10)
    except httpx.HTTPError as failure:
        logger.warning("Apple code exchange unreachable: %s", failure)
        return None
    if response.status_code != 200:
        logger.warning("Apple refused the code exchange: %s %s",
                       response.status_code, response.text[:200])
        return None
    return response.json().get("refresh_token") or None


def revoke(refresh_token: str, client_id: str) -> bool:
    """Tell Apple the user's tokens are gone. True when Apple accepted it."""
    secret = _client_secret(client_id)
    if secret is None:
        return False
    try:
        response = httpx.post(
            REVOKE_URL,
            data={
                "client_id": client_id,
                "client_secret": secret,
                "token": refresh_token,
                "token_type_hint": "refresh_token",
            },
            timeout=10,
        )
    except httpx.HTTPError as failure:
        logger.warning("Apple token revocation unreachable: %s", failure)
        return False
    if response.status_code != 200:
        logger.warning("Apple refused the revocation: %s %s",
                       response.status_code, response.text[:200])
        return False
    return True
