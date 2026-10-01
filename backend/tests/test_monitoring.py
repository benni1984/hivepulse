"""Error reporting must stay silent without a DSN and must never carry user data.

A crash report is sent to a third party, so what it may contain is a privacy decision,
not a detail: no request bodies (they hold passwords and hive notes), no cookies, no IP
addresses, and no credentials in headers.
"""
from app import monitoring
from app.monitoring import init_monitoring, scrub_event


def test_without_a_dsn_nothing_is_started(monkeypatch):
    monkeypatch.setattr(monitoring.settings, "sentry_dsn", "", raising=False)
    assert init_monitoring() is False


def test_a_blank_dsn_counts_as_unset(monkeypatch):
    monkeypatch.setattr(monitoring.settings, "sentry_dsn", "   ", raising=False)
    assert init_monitoring() is False


def test_with_a_dsn_the_sdk_is_configured_without_pii(monkeypatch):
    captured = {}

    class FakeSentry:
        @staticmethod
        def init(**kwargs):
            captured.update(kwargs)

    import sys
    import types

    monkeypatch.setattr(monitoring.settings, "sentry_dsn", "https://key@example.ingest.sentry.io/1", raising=False)
    monkeypatch.setattr(monitoring.settings, "environment", "production", raising=False)
    # Stand in for the SDK and the two integration modules init_monitoring imports.
    monkeypatch.setitem(sys.modules, "sentry_sdk", FakeSentry)
    for name, attribute in (("fastapi", "FastApiIntegration"), ("starlette", "StarletteIntegration")):
        module = types.ModuleType(f"sentry_sdk.integrations.{name}")
        setattr(module, attribute, object)
        monkeypatch.setitem(sys.modules, f"sentry_sdk.integrations.{name}", module)

    assert init_monitoring() is True
    assert captured["send_default_pii"] is False
    assert captured["max_request_body_size"] == "never"
    assert captured["traces_sample_rate"] == 0.0
    assert captured["environment"] == "production"
    assert captured["before_send"] is scrub_event


def test_request_bodies_cookies_and_addresses_are_removed():
    event = {
        "request": {
            "url": "https://hivepulse.multihead.de/api/v1/auth/login",
            "data": {"email": "imker@example.com", "password": "hunter2"},
            "cookies": {"session": "abc"},
            "env": {"REMOTE_ADDR": "203.0.113.7"},
            "query_string": "token=secret",
            "headers": {"Authorization": "Bearer abc", "User-Agent": "HivePulse/1.0"},
        }
    }

    scrubbed = scrub_event(event)

    request = scrubbed["request"]
    assert "data" not in request
    assert "cookies" not in request
    assert "env" not in request
    assert "query_string" not in request
    assert request["headers"]["Authorization"] == "[filtered]"
    assert request["headers"]["User-Agent"] == "HivePulse/1.0", "harmless headers stay"
    assert request["url"].endswith("/auth/login"), "the path is what makes a report useful"


def test_the_user_is_reduced_to_an_id():
    event = {"user": {"id": "u-1", "email": "imker@example.com", "ip_address": "203.0.113.7"}}

    scrubbed = scrub_event(event)

    assert scrubbed["user"] == {"id": "u-1"}


def test_secrets_in_extra_data_are_filtered():
    event = {"extra": {"cron_secret": "s3cret", "hive_count": 12, "APNS_PRIVATE_KEY_P8": "-----BEGIN"}}

    scrubbed = scrub_event(event)

    assert scrubbed["extra"]["cron_secret"] == "[filtered]"
    assert scrubbed["extra"]["APNS_PRIVATE_KEY_P8"] == "[filtered]"
    assert scrubbed["extra"]["hive_count"] == 12, "context that helps debugging stays"


def test_an_event_without_request_or_user_passes_through():
    event = {"message": "something broke"}
    assert scrub_event(event) == {"message": "something broke"}
