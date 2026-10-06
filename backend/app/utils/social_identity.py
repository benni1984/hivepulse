"""Verify an identity token from Apple or Google.

The client hands us a token it got from the platform. Everything that matters is decided
here, because the token is the only evidence we have that the person is who the client says:

* the signature must be made by a key the provider currently publishes,
* the issuer must be the provider itself,
* the audience must be one of our own client IDs — otherwise a token minted for a different
  app, by the same provider, would sign somebody in here,
* and it must not have expired.

Nothing in the token body is trusted before the signature checks out, which is why the
decode below verifies first and reads afterwards.
"""
from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Optional

import httpx
from jose import jwt
from jose.exceptions import JWTError

from app.config import settings

GOOGLE_ISSUERS = ("https://accounts.google.com", "accounts.google.com")
GOOGLE_KEYS_URL = "https://www.googleapis.com/oauth2/v3/certs"

APPLE_ISSUER = "https://appleid.apple.com"
APPLE_KEYS_URL = "https://appleid.apple.com/auth/keys"

# Providers rotate their signing keys. Caching for an hour keeps a sign-in from waiting on a
# second network call, and is short enough that a rotation heals by itself.
_KEY_CACHE_SECONDS = 3600
_key_cache: dict[str, tuple[float, dict]] = {}


class IdentityError(Exception):
    """The token did not check out. The reason is for the log, never for the caller."""


class ProviderUnconfigured(Exception):
    """No client IDs are configured, so no token from this provider could ever be accepted."""


@dataclass(frozen=True)
class SocialIdentity:
    provider: str
    subject: str
    email: Optional[str]
    email_verified: bool
    name: Optional[str]
    # The one of our client IDs the token was issued for.
    audience: Optional[str] = None


def _audiences(provider: str) -> list[str]:
    raw = settings.google_client_ids if provider == "google" else settings.apple_client_ids
    return [value.strip() for value in raw.split(",") if value.strip()]


def _signing_keys(url: str) -> dict:
    cached = _key_cache.get(url)
    if cached and time.time() - cached[0] < _KEY_CACHE_SECONDS:
        return cached[1]
    response = httpx.get(url, timeout=10)
    response.raise_for_status()
    keys = response.json()
    _key_cache[url] = (time.time(), keys)
    return keys


def _claims(token: str, url: str, audiences: list[str], issuer) -> dict:
    try:
        claims = jwt.decode(
            token,
            _signing_keys(url),
            algorithms=["RS256"],
            issuer=issuer,
            options={
                # python-jose accepts a single audience string, and we have one client ID per
                # platform. The claim is checked below instead — the check is the point, not
                # which library performs it.
                "verify_aud": False,
                "verify_at_hash": False,  # no access token alongside; nothing to bind to
            },
        )
    except JWTError as error:
        raise IdentityError(str(error)) from error
    except httpx.HTTPError as error:
        # Provider unreachable is not the caller's fault and must not read like a bad token.
        raise IdentityError(f"could not fetch signing keys: {error}") from error

    # A token for a different app of the same provider is perfectly valid and signed by the
    # same key. The audience is the only thing that says it was meant for us.
    claimed = claims.get("aud")
    claimed = [claimed] if isinstance(claimed, str) else list(claimed or [])
    matched = next((one for one in claimed if one in audiences), None)
    if matched is None:
        raise IdentityError(f"audience {claimed} is not one of ours")
    claims["_matched_audience"] = matched
    return claims


def verify(provider: str, id_token: str) -> SocialIdentity:
    audiences = _audiences(provider)
    if not audiences:
        raise ProviderUnconfigured(provider)

    if provider == "google":
        claims = _claims(id_token, GOOGLE_KEYS_URL, audiences, GOOGLE_ISSUERS)
        name = claims.get("name")
    elif provider == "apple":
        claims = _claims(id_token, APPLE_KEYS_URL, audiences, APPLE_ISSUER)
        # Apple sends the name once, in the authorization response of the first sign-in, and
        # never in the token. The client has to pass it on or it is lost for good.
        name = None
    else:
        raise IdentityError(f"unknown provider {provider!r}")

    subject = claims.get("sub")
    if not subject:
        raise IdentityError("token carries no subject")

    # Apple sends this as the string "true"; Google as a boolean. Anything else counts as
    # unverified, because this flag decides whether an address may claim an existing account.
    verified = claims.get("email_verified")
    email_verified = verified is True or verified == "true"

    return SocialIdentity(
        provider=provider,
        subject=subject,
        email=claims.get("email"),
        email_verified=email_verified,
        name=name,
        audience=claims["_matched_audience"],
    )
