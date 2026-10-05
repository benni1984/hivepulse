"""Signing in with Apple or Google.

The token is the only evidence that the person is who the client says, so these tests sign
real tokens with a real key and let the real verification run. Mocking the verification away
would leave the one part that matters untested — and this is the part where a mistake hands
somebody another beekeeper's hives.
"""
import base64
import time

import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from jose import jwt

from app.config import settings
from app.models import User
from app.utils import social_identity

GOOGLE_AUDIENCE = "hivepulse-test.apps.googleusercontent.com"
APPLE_AUDIENCE = "com.hivepulse.app"


def _b64(number: int) -> str:
    raw = number.to_bytes((number.bit_length() + 7) // 8, "big")
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()


@pytest.fixture(scope="module")
def signing():
    """One keypair for the module: generating RSA keys per test would dominate the runtime."""
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    pem = key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode()
    numbers = key.public_key().public_numbers()
    jwks = {"keys": [{
        "kty": "RSA", "kid": "test-key", "use": "sig", "alg": "RS256",
        "n": _b64(numbers.n), "e": _b64(numbers.e),
    }]}

    other = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    other_pem = other.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode()
    return pem, jwks, other_pem


@pytest.fixture(autouse=True)
def provider_setup(signing, monkeypatch):
    _, jwks, _ = signing
    monkeypatch.setattr(settings, "google_client_ids", GOOGLE_AUDIENCE)
    monkeypatch.setattr(settings, "apple_client_ids", APPLE_AUDIENCE)
    # Stand in for the provider's key endpoint; everything downstream is the real thing.
    monkeypatch.setattr(social_identity, "_signing_keys", lambda url: jwks)
    yield


def _token(private_pem: str, **overrides) -> str:
    claims = {
        "iss": "https://accounts.google.com",
        "aud": GOOGLE_AUDIENCE,
        "sub": "google-subject-1",
        "email": "imker@example.com",
        "email_verified": True,
        "name": "Ada Imker",
        "exp": int(time.time()) + 600,
        "iat": int(time.time()),
    }
    claims.update(overrides)
    return jwt.encode(claims, private_pem, algorithm="RS256", headers={"kid": "test-key"})


def _sign_in(client, token, provider="google", **extra):
    return client.post("/api/v1/auth/social",
                       json={"provider": provider, "id_token": token, **extra})


# ── The happy path ────────────────────────────────────────────────────────────

def test_a_first_sign_in_creates_the_account(client, signing):
    pem, _, _ = signing
    r = _sign_in(client, _token(pem))

    assert r.status_code == 200
    body = r.json()
    assert body["access_token"] and body["refresh_token"]
    assert body["user"]["email"] == "imker@example.com"
    assert body["user"]["name"] == "Ada Imker"


def test_signing_in_again_returns_the_same_account(client, signing):
    pem, _, _ = signing
    first = _sign_in(client, _token(pem, sub="repeat-1", email="repeat@example.com")).json()
    second = _sign_in(client, _token(pem, sub="repeat-1", email="repeat@example.com")).json()

    # A second account for the same person would silently split their hives in two.
    assert first["user"]["id"] == second["user"]["id"]


def test_the_account_has_no_password_at_all(client, signing, db_session):
    pem, _, _ = signing
    _sign_in(client, _token(pem, sub="nopw-1", email="nopw@example.com"))

    user = db_session.query(User).filter(User.email == "nopw@example.com").one()
    assert user.hashed_password is None
    assert user.google_sub == "nopw-1"


def test_apple_takes_the_name_from_the_request(client, signing):
    pem, _, _ = signing
    token = _token(pem, iss="https://appleid.apple.com", aud=APPLE_AUDIENCE,
                   sub="apple-1", email="apple@example.com", name=None)
    r = _sign_in(client, token, provider="apple", name="Grete Imkerin")

    assert r.status_code == 200
    # Apple sends the name once, outside the token. Without the client passing it on there
    # would be nothing to call this person.
    assert r.json()["user"]["name"] == "Grete Imkerin"


# ── Tokens that must not be accepted ──────────────────────────────────────────

def test_a_token_for_another_app_is_refused(client, signing):
    pem, _, _ = signing
    r = _sign_in(client, _token(pem, aud="some-other-app.apps.googleusercontent.com"))

    # Same provider, same signature, different audience: this is a real token, just not ours.
    assert r.status_code == 401
    assert r.json()["detail"]["code"] == "INVALID_IDENTITY_TOKEN"


def test_a_token_signed_by_somebody_else_is_refused(client, signing):
    _, _, other_pem = signing
    r = _sign_in(client, _token(other_pem))

    assert r.status_code == 401


def test_an_expired_token_is_refused(client, signing):
    pem, _, _ = signing
    r = _sign_in(client, _token(pem, exp=int(time.time()) - 60))

    assert r.status_code == 401


def test_a_token_from_the_wrong_issuer_is_refused(client, signing):
    pem, _, _ = signing
    r = _sign_in(client, _token(pem, iss="https://evil.example.com"))

    assert r.status_code == 401


def test_the_reason_a_token_failed_is_not_handed_back(client, signing):
    pem, _, _ = signing
    detail = _sign_in(client, _token(pem, aud="wrong")).json()["detail"]

    # Telling a forger which part to fix next is a favour nobody needs.
    assert "aud" not in str(detail).lower()
    assert "signature" not in str(detail).lower()


# ── Claiming an existing account ──────────────────────────────────────────────

def test_a_verified_address_claims_its_existing_account(client, signing, db_session):
    pem, _, _ = signing
    client.post("/api/v1/auth/register", json={
        "email": "existing@example.com", "password": "password123", "name": "Alt",
    })

    r = _sign_in(client, _token(pem, sub="link-1", email="existing@example.com"))

    assert r.status_code == 200
    user = db_session.query(User).filter(User.email == "existing@example.com").one()
    assert user.google_sub == "link-1"
    # The password still works: this links an account, it does not replace it.
    assert user.hashed_password is not None


def test_an_unverified_address_cannot_claim_an_account(client, signing, db_session):
    pem, _, _ = signing
    client.post("/api/v1/auth/register", json={
        "email": "target@example.com", "password": "password123", "name": "Ziel",
    })

    r = _sign_in(client, _token(pem, sub="attacker-1", email="target@example.com",
                                email_verified=False))

    # Anybody who can register an unverified address at a provider would otherwise walk
    # straight into somebody else's hives.
    assert r.status_code == 401
    assert r.json()["detail"]["code"] == "EMAIL_NOT_VERIFIED"

    user = db_session.query(User).filter(User.email == "target@example.com").one()
    assert user.google_sub is None


def test_apple_sends_email_verified_as_a_string(client, signing):
    pem, _, _ = signing
    token = _token(pem, iss="https://appleid.apple.com", aud=APPLE_AUDIENCE,
                   sub="apple-string-1", email="string@example.com",
                   email_verified="true")

    assert _sign_in(client, token, provider="apple").status_code == 200


def test_anything_other_than_true_counts_as_unverified(client, signing):
    pem, _, _ = signing
    client.post("/api/v1/auth/register", json={
        "email": "sneaky@example.com", "password": "password123", "name": "Ziel",
    })
    token = _token(pem, sub="sneaky-1", email="sneaky@example.com", email_verified="yes")

    assert _sign_in(client, token).status_code == 401


# ── Not configured ────────────────────────────────────────────────────────────

def test_a_provider_without_client_ids_says_so(client, signing, monkeypatch):
    pem, _, _ = signing
    monkeypatch.setattr(settings, "google_client_ids", "")

    r = _sign_in(client, _token(pem))

    # Not a 401: nothing is wrong with the token, the server simply cannot check it.
    assert r.status_code == 503
    assert r.json()["detail"]["code"] == "SOCIAL_SIGN_IN_UNCONFIGURED"


def test_an_account_without_a_password_cannot_be_logged_into(client, signing):
    """The password path must refuse it, not fall over it.

    Verifying against a null hash raises rather than returning False, which would turn a
    wrong guess into a 500 and tell the guesser that this address exists and is special.
    """
    pem, _, _ = signing
    _sign_in(client, _token(pem, sub="pwless-1", email="pwless@example.com"))

    r = client.post("/api/v1/auth/login",
                    json={"email": "pwless@example.com", "password": "anything-at-all"})

    assert r.status_code == 401
    assert r.json()["detail"]["code"] == "INVALID_CREDENTIALS"
