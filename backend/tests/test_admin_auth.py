"""Tests for admin dependency and /admin/ping endpoint."""


def test_ping_as_admin(admin_client):
    resp = admin_client.get("/api/v1/admin/ping")
    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["email"] == "admin@example.com"


def test_ping_as_regular_user_returns_403(auth_client):
    resp = auth_client.get("/api/v1/admin/ping")
    assert resp.status_code == 403
    assert resp.json()["detail"]["code"] == "FORBIDDEN"


def test_ping_unauthenticated_returns_422(client):
    resp = client.get("/api/v1/admin/ping")
    assert resp.status_code == 422


def test_user_out_includes_admin_fields(auth_client):
    resp = auth_client.get("/api/v1/users/me")
    assert resp.status_code == 200
    data = resp.json()
    assert "is_admin" in data
    assert "is_supporter" in data
    assert data["is_admin"] is False
    assert data["is_supporter"] is False


def test_admin_user_out_shows_is_admin_true(admin_client):
    resp = admin_client.get("/api/v1/users/me")
    assert resp.status_code == 200
    assert resp.json()["is_admin"] is True


# ---------------------------------------------------------------------------
# POST /admin/self-test/error — proving crash reporting works without a real crash
# ---------------------------------------------------------------------------

def test_self_test_reports_that_nothing_is_configured(admin_client):
    # The test suite has no DSN, so the honest answer is "off", not a pretend success.
    resp = admin_client.post("/api/v1/admin/self-test/error")
    assert resp.status_code == 200
    data = resp.json()
    assert data["reporting_enabled"] is False
    assert data["event_id"] is None
    assert "environment" in data


def test_self_test_sends_an_event_when_a_dsn_is_configured(admin_client, monkeypatch):
    from app import monitoring

    sent = {}

    class FakeSentry:
        @staticmethod
        def capture_exception():
            import sys
            sent["exception"] = sys.exc_info()[1]
            return "abc123"

        @staticmethod
        def flush(timeout=None):
            sent["flushed"] = timeout

    import sys
    monkeypatch.setattr(monitoring.settings, "sentry_dsn", "https://key@example.ingest.sentry.io/1", raising=False)
    monkeypatch.setitem(sys.modules, "sentry_sdk", FakeSentry)

    resp = admin_client.post("/api/v1/admin/self-test/error")

    assert resp.status_code == 200
    data = resp.json()
    assert data["reporting_enabled"] is True
    assert data["event_id"] == "abc123"
    assert isinstance(sent["exception"], monitoring.CrashReportingSelfTest)
    assert sent["flushed"], "a serverless function is frozen before a background send finishes"
    assert "admin@example.com" not in str(sent["exception"]), "no account data in the report"


def test_self_test_as_regular_user_returns_403(auth_client):
    resp = auth_client.post("/api/v1/admin/self-test/error")
    assert resp.status_code == 403
    assert resp.json()["detail"]["code"] == "FORBIDDEN"


def test_self_test_reports_where_the_key_is_missing(admin_client, monkeypatch):
    # Both zero is the answer to "did the platform ever hand the key to the server".
    monkeypatch.delenv("SENTRY_DSN", raising=False)

    data = admin_client.post("/api/v1/admin/self-test/error").json()

    assert data["diagnosis"]["dsn_characters_in_settings"] == 0
    assert data["diagnosis"]["dsn_characters_in_process_env"] == 0


def test_self_test_diagnosis_counts_characters_without_leaking_the_key(admin_client, monkeypatch):
    from app import monitoring

    dsn = "https://key@o1.ingest.de.sentry.io/42"
    monkeypatch.setenv("SENTRY_DSN", dsn)
    monkeypatch.setattr(monitoring.settings, "sentry_dsn", dsn, raising=False)

    body = admin_client.post("/api/v1/admin/self-test/error").text

    assert str(len(dsn)) in body
    assert dsn not in body, "a length is enough; the key itself must not travel back"


# ---------------------------------------------------------------------------
# GET /admin/health/configuration — what the running server actually received
# ---------------------------------------------------------------------------

def test_configuration_health_flags_the_published_default_signing_key(admin_client, monkeypatch):
    from app.routers import admin as admin_router

    monkeypatch.setattr(admin_router.settings, "secret_key", "dev-secret-change-me", raising=False)

    data = admin_client.get("/api/v1/admin/health/configuration").json()

    assert data["signing_key_is_the_public_default"] is True, (
        "the default is in this repository; anyone could forge a login token with it"
    )


def test_configuration_health_is_quiet_with_a_real_signing_key(monkeypatch):
    # Called directly, not over HTTP: swapping the signing key invalidates the token the
    # test client is already holding, so the request would come back as 401 instead.
    from app.routers import admin as admin_router

    monkeypatch.setattr(admin_router.settings, "secret_key", "a-real-secret", raising=False)

    data = admin_router.configuration_health(admin=None)

    assert data["signing_key_is_the_public_default"] is False
    assert "a-real-secret" not in str(data), "never echo the key itself"


def test_configuration_health_as_regular_user_returns_403(auth_client):
    resp = auth_client.get("/api/v1/admin/health/configuration")
    assert resp.status_code == 403
