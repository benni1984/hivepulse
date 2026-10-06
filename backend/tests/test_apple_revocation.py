"""Giving Apple its token back when an account is deleted.

Apple's rule: an app that offers Sign in with Apple must revoke the user's tokens when the
account goes. These tests use a real ES256 key, so the client secret that would go to Apple is
signed and checked for real; only the HTTP call to Apple is replaced. Whether the identity
token itself checks out is covered in test_social_sign_in.py, so verification is stubbed here.
"""
import httpx
import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec
from jose import jwt

from app.config import settings
from app.models import User
from app.utils import apple_auth, social_identity

BUNDLE_ID = "com.hivepulse.app"
SERVICES_ID = "com.hivepulse.web"


@pytest.fixture(scope="module")
def apple_key():
    key = ec.generate_private_key(ec.SECP256R1())
    private_pem = key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode()
    public_pem = key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    ).decode()
    return private_pem, public_pem


@pytest.fixture
def configured(apple_key, monkeypatch):
    monkeypatch.setattr(settings, "apple_team_id", "TEAM123456")
    monkeypatch.setattr(settings, "apple_key_id", "KEY1234567")
    monkeypatch.setattr(settings, "apple_private_key", apple_key[0])
    monkeypatch.setattr(settings, "apple_client_ids", f"{SERVICES_ID},{BUNDLE_ID}")
    monkeypatch.setattr(settings, "app_base_url", "https://hivepulse.example")


class FakeApple:
    """Stands in for appleid.apple.com and remembers what it was asked."""

    def __init__(self, monkeypatch, token_status=200, revoke_status=200, unreachable=False):
        self.calls = []
        self.token_status = token_status
        self.revoke_status = revoke_status
        self.unreachable = unreachable
        monkeypatch.setattr(apple_auth.httpx, "post", self._post)

    def _post(self, url, data=None, timeout=None):
        self.calls.append((url, data))
        if self.unreachable:
            raise httpx.ConnectError("no route to Apple")
        if url == apple_auth.TOKEN_URL:
            if self.token_status == 200:
                body = {"refresh_token": "apple-refresh-1"}
            else:
                body = {"error": "invalid_grant"}
            return httpx.Response(self.token_status, json=body)
        return httpx.Response(self.revoke_status, json={})

    def to(self, url):
        return [data for called, data in self.calls if called == url]


def _identity(provider="apple", audience=BUNDLE_ID, sub="apple-sub-1", email="a@example.com"):
    return social_identity.SocialIdentity(
        provider=provider, subject=sub, email=email, email_verified=True,
        name="Ada", audience=audience,
    )


@pytest.fixture
def signed_in_as(monkeypatch):
    def use(identity):
        monkeypatch.setattr(social_identity, "verify", lambda provider, token: identity)
    return use


def _sign_in(client, provider="apple", **extra):
    return client.post("/api/v1/auth/social",
                       json={"provider": provider, "id_token": "stubbed", **extra})


def _auth(response):
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


# -- The secret that goes to Apple ---------------------------------------------------------

def test_the_client_secret_says_who_we_are(configured, apple_key):
    secret = apple_auth._client_secret(BUNDLE_ID)

    claims = jwt.decode(secret, apple_key[1], algorithms=["ES256"],
                        audience="https://appleid.apple.com")
    assert claims["iss"] == "TEAM123456"
    assert claims["sub"] == BUNDLE_ID
    assert jwt.get_unverified_header(secret)["kid"] == "KEY1234567"
    # Five minutes, not the six months Apple would allow: it only has to cover one request.
    assert claims["exp"] - claims["iat"] == 300


def test_a_key_pasted_with_escaped_newlines_still_signs(configured, apple_key, monkeypatch):
    monkeypatch.setattr(settings, "apple_private_key", apple_key[0].strip().replace("\n", "\\n"))

    assert apple_auth._client_secret(BUNDLE_ID) is not None


def test_a_broken_key_gives_no_secret_instead_of_an_error(configured, monkeypatch):
    monkeypatch.setattr(settings, "apple_private_key", "not a key")

    assert apple_auth._client_secret(BUNDLE_ID) is None


def test_nothing_is_sent_to_apple_when_the_key_is_missing(monkeypatch):
    monkeypatch.setattr(settings, "apple_private_key", "")
    apple = FakeApple(monkeypatch)

    assert apple_auth.exchange_code("code", BUNDLE_ID) is None
    assert apple_auth.revoke("token", BUNDLE_ID) is False
    assert apple.calls == []


# -- Trading the code ----------------------------------------------------------------------

def test_the_iphone_code_is_exchanged_without_a_redirect(configured, monkeypatch):
    apple = FakeApple(monkeypatch)

    assert apple_auth.exchange_code("one-time", BUNDLE_ID) == "apple-refresh-1"

    sent = apple.to(apple_auth.TOKEN_URL)[0]
    assert sent["client_id"] == BUNDLE_ID
    assert sent["code"] == "one-time"
    assert sent["grant_type"] == "authorization_code"
    assert "redirect_uri" not in sent


def test_the_browser_code_is_exchanged_with_the_registered_redirect(configured, monkeypatch):
    apple = FakeApple(monkeypatch)

    apple_auth.exchange_code("one-time", SERVICES_ID)

    sent = apple.to(apple_auth.TOKEN_URL)[0]
    assert sent["client_id"] == SERVICES_ID
    assert sent["redirect_uri"] == "https://hivepulse.example/api/v1/auth/apple/callback"


@pytest.mark.parametrize("trouble", [{"token_status": 400}, {"unreachable": True}])
def test_a_failed_exchange_gives_nothing_back(configured, monkeypatch, trouble):
    FakeApple(monkeypatch, **trouble)

    assert apple_auth.exchange_code("one-time", BUNDLE_ID) is None


# -- Signing in ----------------------------------------------------------------------------

def test_sign_in_keeps_the_token_apple_hands_out(configured, monkeypatch, client, signed_in_as,
                                                 db_session):
    FakeApple(monkeypatch)
    signed_in_as(_identity())

    r = _sign_in(client, authorization_code="one-time")

    assert r.status_code == 200
    user = db_session.query(User).filter(User.apple_sub == "apple-sub-1").one()
    assert user.apple_refresh_token == "apple-refresh-1"
    # The client ID is stored with it: Apple wants the same one back when revoking.
    assert user.apple_token_client_id == BUNDLE_ID


def test_the_token_never_travels_back_to_a_client(configured, monkeypatch, client, signed_in_as):
    FakeApple(monkeypatch)
    signed_in_as(_identity())

    body = _sign_in(client, authorization_code="one-time").json()

    assert "apple-refresh-1" not in str(body)


def test_sign_in_without_a_code_asks_apple_for_nothing(configured, monkeypatch, client,
                                                       signed_in_as, db_session):
    apple = FakeApple(monkeypatch)
    signed_in_as(_identity())

    assert _sign_in(client).status_code == 200

    assert apple.calls == []
    assert db_session.query(User).one().apple_refresh_token is None


def test_a_google_sign_in_never_talks_to_apple(configured, monkeypatch, client, signed_in_as):
    apple = FakeApple(monkeypatch)
    signed_in_as(_identity(provider="google", audience="g.apps", sub="g-1"))

    assert _sign_in(client, provider="google", authorization_code="stray").status_code == 200

    assert apple.calls == []


def test_a_refused_exchange_still_signs_the_person_in(configured, monkeypatch, client,
                                                      signed_in_as, db_session):
    FakeApple(monkeypatch, token_status=400)
    signed_in_as(_identity())

    r = _sign_in(client, authorization_code="expired")

    assert r.status_code == 200
    assert db_session.query(User).one().apple_refresh_token is None


# -- Deleting the account ------------------------------------------------------------------

def test_deleting_the_account_revokes_the_token_with_the_same_client(
        configured, monkeypatch, client, signed_in_as, db_session):
    apple = FakeApple(monkeypatch)
    signed_in_as(_identity(audience=SERVICES_ID))
    signed = _sign_in(client, authorization_code="one-time")

    assert client.delete("/api/v1/users/me", headers=_auth(signed)).status_code == 204

    revoked = apple.to(apple_auth.REVOKE_URL)
    assert len(revoked) == 1
    assert revoked[0]["token"] == "apple-refresh-1"
    assert revoked[0]["client_id"] == SERVICES_ID
    assert revoked[0]["token_type_hint"] == "refresh_token"
    assert db_session.query(User).count() == 0


def test_deleting_an_account_without_a_token_asks_apple_for_nothing(
        configured, monkeypatch, client, signed_in_as):
    apple = FakeApple(monkeypatch)
    signed_in_as(_identity())
    signed = _sign_in(client)

    assert client.delete("/api/v1/users/me", headers=_auth(signed)).status_code == 204

    assert apple.calls == []


@pytest.mark.parametrize("trouble", [{"revoke_status": 400}, {"unreachable": True}])
def test_deletion_goes_through_when_apple_does_not_answer(
        configured, monkeypatch, client, signed_in_as, db_session, trouble):
    apple = FakeApple(monkeypatch)
    signed_in_as(_identity())
    signed = _sign_in(client, authorization_code="one-time")
    apple.revoke_status = trouble.get("revoke_status", 200)
    apple.unreachable = trouble.get("unreachable", False)

    # Somebody's right to delete their own data does not depend on Apple being reachable.
    assert client.delete("/api/v1/users/me", headers=_auth(signed)).status_code == 204
    assert db_session.query(User).count() == 0


def test_an_email_account_deletes_without_any_apple_call(auth_client, monkeypatch):
    apple = FakeApple(monkeypatch)

    assert auth_client.delete("/api/v1/users/me").status_code == 204

    assert apple.calls == []
