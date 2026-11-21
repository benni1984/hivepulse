"""The Paddle API key's expiry, and who hears about it (#528).

The live Paddle account does not offer "never expire" for an API key. This server never talks to
Paddle — RevenueCat does — so the day the key stops working, RevenueCat quietly loses its
connection while every endpoint here keeps answering. Nothing in the pipeline turns red and no
exception reaches Sentry; the only symptom is that purchases stop.

So the date is written down, shown on the admin health page, and said out loud by the daily run.
These tests are about the saying.
"""
from datetime import date

import pytest

from app.utils import paddle_key


@pytest.fixture(autouse=True)
def no_date_by_default(monkeypatch):
    """Every test states its own date. The default is empty, which is itself a finding."""
    from app.config import settings
    monkeypatch.setattr(settings, "paddle_api_key_expires_at", "")


def _set(monkeypatch, value: str) -> None:
    from app.config import settings
    monkeypatch.setattr(settings, "paddle_api_key_expires_at", value)


TODAY = date(2027, 3, 1)


class TestWhatTheDateMeans:

    def test_no_date_is_not_silence(self):
        """A key that must expire and whose date nobody recorded is the situation, not the
        absence of one. The health page has to be able to say so."""
        state = paddle_key.status(TODAY)

        assert state["paddle_key_expiry_known"] is False
        assert state["paddle_key_days_left"] is None
        assert state["paddle_key_expiring_soon"] is False

    def test_a_date_far_away_is_quiet(self, monkeypatch):
        _set(monkeypatch, "2027-12-31")

        state = paddle_key.status(TODAY)

        assert state["paddle_key_days_left"] == 305
        assert state["paddle_key_expiring_soon"] is False
        assert state["paddle_key_expired"] is False

    def test_a_month_out_is_soon(self, monkeypatch):
        _set(monkeypatch, "2027-03-31")

        assert paddle_key.status(TODAY)["paddle_key_expiring_soon"] is True

    def test_a_date_in_the_past_is_expired_and_still_soon(self, monkeypatch):
        """Both flags, because a page that only says "expiring soon" would stop saying anything
        the moment the thing it warned about actually happened."""
        _set(monkeypatch, "2027-02-01")

        state = paddle_key.status(TODAY)

        assert state["paddle_key_expired"] is True
        assert state["paddle_key_expiring_soon"] is True
        assert state["paddle_key_days_left"] == -28

    def test_a_typo_reads_as_no_date_rather_than_crashing(self, monkeypatch):
        """Raising here would take the daily reminder run down for every beekeeper over a typo
        in a date, which is worse than the warning this module exists to give."""
        _set(monkeypatch, "next May")

        assert paddle_key.days_left(TODAY) is None
        assert paddle_key.status(TODAY)["paddle_key_expiry_known"] is False


class TestTheDailyWarning:

    def test_nothing_to_say_without_a_date(self):
        assert paddle_key.warn_if_expiring(TODAY) is None

    def test_nothing_to_say_while_it_is_far_off(self, monkeypatch):
        _set(monkeypatch, "2027-12-31")

        assert paddle_key.warn_if_expiring(TODAY) is None

    def test_it_names_the_days_left_and_what_to_do(self, monkeypatch):
        _set(monkeypatch, "2027-03-15")

        message = paddle_key.warn_if_expiring(TODAY)

        assert message is not None
        assert "14 day" in message
        assert "PADDLE_API_KEY_EXPIRES_AT" in message, (
            "a warning that does not say what to move is a warning somebody half-acts on"
        )

    def test_it_says_plainly_when_it_is_already_too_late(self, monkeypatch):
        _set(monkeypatch, "2027-02-01")

        message = paddle_key.warn_if_expiring(TODAY)

        assert message is not None
        assert "expired" in message
        assert "failing" in message

    def test_a_broken_reporter_does_not_break_the_run(self, monkeypatch):
        """The daily run sends every beekeeper's reminders. It must not die while warning about
        a key — the log line is there either way."""
        _set(monkeypatch, "2027-03-02")
        import sys
        import types

        broken = types.ModuleType("sentry_sdk")

        def boom(*_args, **_kwargs):
            raise RuntimeError("no transport")

        broken.capture_message = boom  # type: ignore[attr-defined]
        monkeypatch.setitem(sys.modules, "sentry_sdk", broken)

        assert paddle_key.warn_if_expiring(TODAY) is not None


class TestWhatTheAdminPageSees:

    def test_the_health_endpoint_carries_the_state(self, admin_client, monkeypatch):
        _set(monkeypatch, "2099-01-01")

        body = admin_client.get("/api/v1/admin/health/configuration").json()

        assert body["paddle_key_expiry_known"] is True
        assert body["paddle_key_expires_at"] == "2099-01-01"
        assert body["paddle_key_expiring_soon"] is False

    def test_an_unconfigured_deployment_says_it_does_not_know(self, admin_client):
        body = admin_client.get("/api/v1/admin/health/configuration").json()

        assert body["paddle_key_expiry_known"] is False
        assert body["paddle_key_expires_at"] is None

    def test_it_is_not_public(self, auth_client):
        """Every other field on this endpoint is admin-only and this one is no different: when a
        key expires is an invitation to whoever is waiting for it to."""
        assert auth_client.get("/api/v1/admin/health/configuration").status_code == 403
