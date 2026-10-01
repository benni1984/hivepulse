"""Push delivery to Android (FCM v1) and iOS (APNs).

The senders were stubs: a token was stored, the reminder said "push sent", and nothing
ever arrived. These tests pin the two things that matter — the request actually goes out
in the shape each platform expects, and a dead token is dropped instead of being retried
on every nightly run forever.
"""
import json

import httpx
import pytest

from app.utils import push
from app.utils.push import PushResult, send_apns, send_fcm

# A throwaway EC key so the APNs provider token can really be signed in the test.
TEST_EC_KEY = """-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgevZzL1gdAFr88hb2
OF/2NxApJCzGCEDdfSp6VQO30hyhRANCAAQRWz+jn65BtOMvdyHKcvjBeBSDZH2r
1RTwjmYSi9R/zpBnuQ4EiMnCqfMPWiZqB4QdbAd0E7oH50VpuZ1P087G
-----END PRIVATE KEY-----"""


@pytest.fixture(autouse=True)
def reset_push_state(monkeypatch):
    """Each test starts without cached provider tokens and without credentials."""
    push._google_token = None
    push._apns_token = None
    monkeypatch.setattr(push.settings, "firebase_project_id", "", raising=False)
    monkeypatch.setattr(push.settings, "firebase_service_account_json", "", raising=False)
    monkeypatch.setattr(push.settings, "apns_key_id", "", raising=False)
    monkeypatch.setattr(push.settings, "apns_team_id", "", raising=False)
    monkeypatch.setattr(push.settings, "apns_private_key_p8", "", raising=False)
    monkeypatch.setattr(push.settings, "apns_bundle_id", "com.hivepulse.app", raising=False)
    monkeypatch.setattr(push.settings, "apns_sandbox", False, raising=False)
    yield
    push._google_token = None
    push._apns_token = None


def _configure_apns(monkeypatch):
    monkeypatch.setattr(push.settings, "apns_key_id", "KEY123", raising=False)
    monkeypatch.setattr(push.settings, "apns_team_id", "TEAM123", raising=False)
    monkeypatch.setattr(push.settings, "apns_private_key_p8", TEST_EC_KEY, raising=False)


def _configure_fcm(monkeypatch):
    monkeypatch.setattr(push.settings, "firebase_project_id", "hivepulse-prod", raising=False)
    monkeypatch.setattr(push.settings, "firebase_service_account_json", "{}", raising=False)
    # The OAuth2 exchange is covered separately; here we hand out a token directly.
    monkeypatch.setattr(push, "_google_access_token", lambda: "access-token")


# ── without credentials nothing is sent, and nothing blows up ─────────────────

def test_fcm_without_credentials_is_skipped(monkeypatch):
    calls = []
    monkeypatch.setattr(httpx, "post", lambda *a, **k: calls.append(a) or None)
    assert send_fcm("device-token", "Durchsicht fällig", "2 Völker") is PushResult.SKIPPED
    assert calls == []


def test_apns_without_credentials_is_skipped():
    assert send_apns("device-token", "Inspection due", "2 hives") is PushResult.SKIPPED


def test_malformed_service_account_json_disables_android_push(monkeypatch):
    monkeypatch.setattr(push.settings, "firebase_project_id", "p", raising=False)
    monkeypatch.setattr(push.settings, "firebase_service_account_json", "not json", raising=False)
    assert send_fcm("device-token", "t", "b") is PushResult.SKIPPED


# ── FCM ───────────────────────────────────────────────────────────────────────

def test_fcm_sends_the_v1_payload(monkeypatch):
    _configure_fcm(monkeypatch)
    seen = {}

    def fake_post(url, headers=None, json=None, timeout=None):
        seen.update(url=url, headers=headers, body=json)
        return httpx.Response(200, json={"name": "projects/x/messages/1"})

    monkeypatch.setattr(httpx, "post", fake_post)

    assert send_fcm("device-token", "Durchsicht fällig", "2 Völker warten") is PushResult.SENT
    assert seen["url"] == "https://fcm.googleapis.com/v1/projects/hivepulse-prod/messages:send"
    assert seen["headers"]["Authorization"] == "Bearer access-token"
    assert seen["body"]["message"]["token"] == "device-token"
    assert seen["body"]["message"]["notification"] == {
        "title": "Durchsicht fällig", "body": "2 Völker warten"
    }


def test_fcm_reports_a_dead_token(monkeypatch):
    _configure_fcm(monkeypatch)
    monkeypatch.setattr(
        httpx, "post",
        lambda *a, **k: httpx.Response(404, json={"error": {"status": "UNREGISTERED"}}),
    )
    assert send_fcm("stale-token", "t", "b") is PushResult.UNREGISTERED


def test_fcm_server_error_is_a_transient_failure(monkeypatch):
    _configure_fcm(monkeypatch)
    monkeypatch.setattr(httpx, "post", lambda *a, **k: httpx.Response(503, text="unavailable"))
    assert send_fcm("device-token", "t", "b") is PushResult.FAILED


def test_fcm_network_error_does_not_raise(monkeypatch):
    _configure_fcm(monkeypatch)

    def boom(*a, **k):
        raise httpx.ConnectError("no route")

    monkeypatch.setattr(httpx, "post", boom)
    assert send_fcm("device-token", "t", "b") is PushResult.FAILED


# ── APNs ──────────────────────────────────────────────────────────────────────

class _FakeClient:
    """Stands in for httpx.Client so the test can inspect the APNs request."""

    captured: dict = {}
    response: httpx.Response = httpx.Response(200)

    def __init__(self, **kwargs):
        _FakeClient.captured["client_kwargs"] = kwargs

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    def post(self, url, headers=None, json=None):
        _FakeClient.captured.update(url=url, headers=headers, body=json)
        return _FakeClient.response


def test_apns_sends_an_alert_over_http2(monkeypatch):
    _configure_apns(monkeypatch)
    _FakeClient.captured = {}
    _FakeClient.response = httpx.Response(200)
    monkeypatch.setattr(httpx, "Client", _FakeClient)

    assert send_apns("device-token", "Durchsicht fällig", "2 Völker warten") is PushResult.SENT

    captured = _FakeClient.captured
    assert captured["client_kwargs"]["http2"] is True
    assert captured["url"] == "https://api.push.apple.com/3/device/device-token"
    assert captured["headers"]["apns-topic"] == "com.hivepulse.app"
    assert captured["headers"]["apns-push-type"] == "alert"
    assert captured["headers"]["authorization"].startswith("bearer ")
    assert captured["body"]["aps"]["alert"] == {"title": "Durchsicht fällig", "body": "2 Völker warten"}


def test_apns_uses_the_sandbox_host_for_development_builds(monkeypatch):
    _configure_apns(monkeypatch)
    monkeypatch.setattr(push.settings, "apns_sandbox", True, raising=False)
    _FakeClient.captured = {}
    _FakeClient.response = httpx.Response(200)
    monkeypatch.setattr(httpx, "Client", _FakeClient)

    send_apns("device-token", "t", "b")

    assert _FakeClient.captured["url"].startswith("https://api.sandbox.push.apple.com/")


def test_apns_410_means_the_token_is_dead(monkeypatch):
    _configure_apns(monkeypatch)
    _FakeClient.captured = {}
    _FakeClient.response = httpx.Response(410, json={"reason": "Unregistered"})
    monkeypatch.setattr(httpx, "Client", _FakeClient)

    assert send_apns("stale-token", "t", "b") is PushResult.UNREGISTERED


def test_apns_provider_token_is_reused_between_sends(monkeypatch):
    _configure_apns(monkeypatch)
    _FakeClient.captured = {}
    _FakeClient.response = httpx.Response(200)
    monkeypatch.setattr(httpx, "Client", _FakeClient)

    send_apns("device-token", "t", "b")
    first = _FakeClient.captured["headers"]["authorization"]
    send_apns("device-token", "t", "b")
    second = _FakeClient.captured["headers"]["authorization"]

    # Apple refuses provider tokens refreshed more often than every 20 minutes.
    assert first == second


def test_apns_bad_key_material_is_reported_not_raised(monkeypatch):
    monkeypatch.setattr(push.settings, "apns_key_id", "KEY123", raising=False)
    monkeypatch.setattr(push.settings, "apns_team_id", "TEAM123", raising=False)
    monkeypatch.setattr(push.settings, "apns_private_key_p8", "-----BEGIN PRIVATE KEY-----\nnope\n-----END PRIVATE KEY-----", raising=False)

    assert send_apns("device-token", "t", "b") is PushResult.SKIPPED


# ── the OAuth2 exchange ───────────────────────────────────────────────────────

def test_google_access_token_is_requested_once_and_cached(monkeypatch):
    account = {
        "client_email": "push@hivepulse.iam.gserviceaccount.com",
        "private_key_id": "kid-1",
        "private_key": None,  # filled below with a real RSA key
    }
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric import rsa

    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    account["private_key"] = key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode()

    monkeypatch.setattr(push.settings, "firebase_service_account_json", json.dumps(account), raising=False)
    calls = []

    def fake_post(url, data=None, timeout=None):
        calls.append(data)
        return httpx.Response(200, json={"access_token": "tok-1", "expires_in": 3600})

    monkeypatch.setattr(httpx, "post", fake_post)

    assert push._google_access_token() == "tok-1"
    assert push._google_access_token() == "tok-1"
    assert len(calls) == 1, "the access token is cached until it nears expiry"
    assert calls[0]["grant_type"] == "urn:ietf:params:oauth:grant-type:jwt-bearer"
