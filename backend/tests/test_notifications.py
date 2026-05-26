"""Tests for POST /api/v1/notifications/send-reminders."""
from datetime import datetime, timedelta, timezone

import pytest


ENDPOINT = "/api/v1/notifications/send-reminders"
SECRET = "test-cron-secret-abc123"


@pytest.fixture(autouse=True)
def set_cron_secret(monkeypatch):
    """Patch settings.cron_secret for every test in this module."""
    from app import config as cfg
    monkeypatch.setattr(cfg.settings, "cron_secret", SECRET)


def _cron_headers():
    return {"X-Cron-Secret": SECRET}


# ---------------------------------------------------------------------------
# Auth / secret guard
# ---------------------------------------------------------------------------


def test_send_reminders_requires_cron_secret(client):
    r = client.post(ENDPOINT)
    assert r.status_code == 401


def test_send_reminders_wrong_secret_returns_401(client):
    r = client.post(ENDPOINT, headers={"X-Cron-Secret": "wrong-secret"})
    assert r.status_code == 401


# ---------------------------------------------------------------------------
# Skipping logic
# ---------------------------------------------------------------------------


def test_send_reminders_skips_disabled_user(auth_client, db_session):
    """User with reminder_enabled=False must be counted in skipped_disabled."""
    from app.models import User
    user = db_session.query(User).filter(User.email == "test@example.com").first()
    user.reminder_enabled = False
    user.push_token_fcm = "fake-fcm-token"
    db_session.commit()

    r = auth_client.post(ENDPOINT, headers=_cron_headers())
    assert r.status_code == 200
    data = r.json()
    assert data["skipped_disabled"] >= 1
    assert data["sent"] == 0


def test_send_reminders_skips_off_season_user(auth_client, db_session, monkeypatch):
    """User whose current month is outside their season window is skipped."""
    from app.models import User
    user = db_session.query(User).filter(User.email == "test@example.com").first()
    # Set season Apr–Aug, force current month to January
    user.reminder_season_start = 4
    user.reminder_season_end = 8
    user.push_token_fcm = "fake-fcm-token"
    db_session.commit()

    # Freeze time to January
    import app.routers.notifications as notif_module
    monkeypatch.setattr(
        notif_module,
        "datetime",
        type("_DT", (), {"now": staticmethod(lambda tz=None: datetime(2026, 1, 15, tzinfo=timezone.utc))})(),
    )

    r = auth_client.post(ENDPOINT, headers=_cron_headers())
    assert r.status_code == 200
    data = r.json()
    assert data["skipped_off_season"] >= 1
    assert data["sent"] == 0


def test_send_reminders_skips_user_with_no_token(auth_client):
    """User with no push tokens must be counted in skipped_no_token."""
    r = auth_client.post(ENDPOINT, headers=_cron_headers())
    assert r.status_code == 200
    data = r.json()
    # Default user has no tokens
    assert data["skipped_no_token"] >= 1
    assert data["sent"] == 0


# ---------------------------------------------------------------------------
# Overdue hive detection
# ---------------------------------------------------------------------------


def test_send_reminders_counts_overdue_hives(auth_client, db_session, monkeypatch):
    """User with an overdue hive and a push token → sent increments to 1."""
    from app.models import User, Apiary, Hive, QrBatch, QrToken
    import uuid

    # Give the user a push token
    user = db_session.query(User).filter(User.email == "test@example.com").first()
    user.push_token_fcm = "fake-fcm-token"
    user.reminder_interval_days = 7
    user.reminder_season_start = 1  # always in season
    user.reminder_season_end = 12

    # Create apiary → QR batch → token → hive (no inspection = always overdue)
    apiary = Apiary(id=str(uuid.uuid4()), user_id=user.id, name="Test Apiary")
    batch = QrBatch(id=str(uuid.uuid4()), user_id=user.id, count=1)
    qr = QrToken(token=str(uuid.uuid4()), batch_id=batch.id, user_id=user.id)
    hive = Hive(
        id=str(uuid.uuid4()),
        qr_token=qr.token,
        apiary_id=apiary.id,
        user_id=user.id,
        name="Test Hive",
    )
    db_session.add_all([apiary, batch, qr, hive])
    db_session.commit()

    r = auth_client.post(ENDPOINT, headers=_cron_headers())
    assert r.status_code == 200
    data = r.json()
    assert data["sent"] == 1


def test_send_reminders_skips_recently_inspected_hives(auth_client, db_session):
    """User whose hive was inspected yesterday must NOT trigger a reminder."""
    from app.models import User, Apiary, Hive, Inspection, QrBatch, QrToken
    import uuid
    from datetime import date

    user = db_session.query(User).filter(User.email == "test@example.com").first()
    user.push_token_fcm = "fake-fcm-token"
    user.reminder_interval_days = 7
    user.reminder_season_start = 1
    user.reminder_season_end = 12

    apiary = Apiary(id=str(uuid.uuid4()), user_id=user.id, name="Test Apiary")
    batch = QrBatch(id=str(uuid.uuid4()), user_id=user.id, count=1)
    qr = QrToken(token=str(uuid.uuid4()), batch_id=batch.id, user_id=user.id)
    hive = Hive(
        id=str(uuid.uuid4()),
        qr_token=qr.token,
        apiary_id=apiary.id,
        user_id=user.id,
        name="Test Hive",
    )
    # Inspection created right now (definitely within interval)
    insp = Inspection(
        id=str(uuid.uuid4()),
        hive_id=hive.id,
        date=date.today(),
        created_at=datetime.now(timezone.utc),
    )
    db_session.add_all([apiary, batch, qr, hive, insp])
    db_session.commit()

    r = auth_client.post(ENDPOINT, headers=_cron_headers())
    assert r.status_code == 200
    data = r.json()
    assert data["sent"] == 0


# ---------------------------------------------------------------------------
# Result shape
# ---------------------------------------------------------------------------


def test_send_reminders_returns_counts(auth_client):
    """Response must contain all four count keys."""
    r = auth_client.post(ENDPOINT, headers=_cron_headers())
    assert r.status_code == 200
    data = r.json()
    for key in ("sent", "skipped_off_season", "skipped_disabled", "skipped_no_token"):
        assert key in data
        assert isinstance(data[key], int)
