def test_register(client):
    r = client.post("/api/v1/auth/register", json={
        "email": "a@b.com", "password": "password1", "name": "Alice", "locale": "en"
    })
    assert r.status_code == 201
    data = r.json()
    assert "access_token" in data
    assert data["user"]["email"] == "a@b.com"


def test_register_duplicate(client):
    payload = {"email": "a@b.com", "password": "password1", "name": "Alice", "locale": "en"}
    client.post("/api/v1/auth/register", json=payload)
    r = client.post("/api/v1/auth/register", json=payload)
    assert r.status_code == 409
    assert r.json()["detail"]["code"] == "EMAIL_ALREADY_REGISTERED"


def test_login(client):
    client.post("/api/v1/auth/register", json={
        "email": "a@b.com", "password": "password1", "name": "Alice", "locale": "en"
    })
    r = client.post("/api/v1/auth/login", json={"email": "a@b.com", "password": "password1"})
    assert r.status_code == 200
    assert "access_token" in r.json()


def test_login_wrong_password(client):
    client.post("/api/v1/auth/register", json={
        "email": "a@b.com", "password": "password1", "name": "Alice", "locale": "en"
    })
    r = client.post("/api/v1/auth/login", json={"email": "a@b.com", "password": "wrong"})
    assert r.status_code == 401
    assert r.json()["detail"]["code"] == "INVALID_CREDENTIALS"


def test_refresh(client):
    r = client.post("/api/v1/auth/register", json={
        "email": "a@b.com", "password": "password1", "name": "Alice", "locale": "en"
    })
    refresh_token = r.json()["refresh_token"]
    r2 = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert r2.status_code == 200
    assert "access_token" in r2.json()


def test_register_es_locale(client):
    r = client.post("/api/v1/auth/register", json={
        "email": "es_user@example.com", "password": "password1", "name": "Usuario", "locale": "es"
    })
    assert r.status_code == 201
    assert r.json()["user"]["locale"] == "es"


def test_ci_setup_creates_admin(client, monkeypatch):
    monkeypatch.setattr("app.routers.auth.settings.ci_setup_token", "testtoken")
    r = client.post("/api/v1/auth/ci-setup", json={
        "email": "ci@example.com", "password": "password123", "token": "testtoken",
    })
    assert r.status_code == 204
    # Should be able to log in
    r2 = client.post("/api/v1/auth/login", json={"email": "ci@example.com", "password": "password123"})
    assert r2.status_code == 200
    assert r2.json()["user"]["is_admin"] is True


def test_ci_setup_updates_existing_user(client, monkeypatch):
    client.post("/api/v1/auth/register", json={
        "email": "ci@example.com", "password": "oldpassword1", "name": "Old", "locale": "en"
    })
    monkeypatch.setattr("app.routers.auth.settings.ci_setup_token", "testtoken")
    r = client.post("/api/v1/auth/ci-setup", json={
        "email": "ci@example.com", "password": "newpassword1", "token": "testtoken",
    })
    assert r.status_code == 204
    r2 = client.post("/api/v1/auth/login", json={"email": "ci@example.com", "password": "newpassword1"})
    assert r2.status_code == 200
    assert r2.json()["user"]["is_admin"] is True


def test_ci_setup_wrong_token(client, monkeypatch):
    monkeypatch.setattr("app.routers.auth.settings.ci_setup_token", "correcttoken")
    r = client.post("/api/v1/auth/ci-setup", json={
        "email": "ci@example.com", "password": "password123", "token": "wrongtoken",
    })
    assert r.status_code == 403


def test_ci_setup_no_token_configured(client):
    # When CI_SETUP_TOKEN is not set, endpoint always returns 403
    r = client.post("/api/v1/auth/ci-setup", json={
        "email": "ci@example.com", "password": "password123", "token": "",
    })
    assert r.status_code == 403


def test_ci_setup_disabled_in_production(client, monkeypatch):
    # Even with a correct token, ci-setup must be a no-op in production —
    # it exists only to let CI provision a demo/admin account on staging.
    monkeypatch.setattr("app.routers.auth.settings.environment", "production")
    monkeypatch.setattr("app.routers.auth.settings.ci_setup_token", "correcttoken")
    r = client.post("/api/v1/auth/ci-setup", json={
        "email": "ci@example.com", "password": "password123", "token": "correcttoken",
    })
    assert r.status_code == 404


def test_login_unknown_email_returns_generic_error(client):
    # Must behave identically to a known-email/wrong-password attempt —
    # no user enumeration via a different status code or message.
    r = client.post("/api/v1/auth/login", json={
        "email": "nobody@example.com", "password": "whatever123",
    })
    assert r.status_code == 401
    assert r.json()["detail"]["code"] == "INVALID_CREDENTIALS"


def test_login_rate_limited_after_threshold(client):
    for _ in range(10):
        r = client.post("/api/v1/auth/login", json={
            "email": "nobody@example.com", "password": "wrong",
        })
        assert r.status_code == 401
    r = client.post("/api/v1/auth/login", json={
        "email": "nobody@example.com", "password": "wrong",
    })
    assert r.status_code == 429


def test_register_rate_limited_after_threshold(client):
    payload = {"email": "a@b.com", "password": "password1", "name": "Alice", "locale": "en"}
    r = client.post("/api/v1/auth/register", json=payload)
    assert r.status_code == 201
    for _ in range(9):
        r = client.post("/api/v1/auth/register", json=payload)
        assert r.status_code == 409  # duplicate email — but still consumes the rate-limit budget
    r = client.post("/api/v1/auth/register", json=payload)
    assert r.status_code == 429


def test_forgot_password_rate_limited_after_threshold(client):
    for _ in range(5):
        r = client.post("/api/v1/auth/forgot-password", json={"email": "nobody@example.com"})
        assert r.status_code == 204
    r = client.post("/api/v1/auth/forgot-password", json={"email": "nobody@example.com"})
    assert r.status_code == 429


def test_expired_access_token_returns_token_expired_code(client):
    from datetime import datetime, timedelta, timezone
    from jose import jwt

    data = _register(client)
    user_id = data["user"]["id"]
    expired_token = jwt.encode(
        {"sub": user_id, "type": "access", "exp": datetime.now(timezone.utc) - timedelta(minutes=1)},
        "dev-secret-change-me",
        algorithm="HS256",
    )
    r = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert r.status_code == 401
    assert r.json()["detail"]["code"] == "TOKEN_EXPIRED"


def test_logout(client):
    r = client.post("/api/v1/auth/register", json={
        "email": "a@b.com", "password": "password1", "name": "Alice", "locale": "en"
    })
    refresh_token = r.json()["refresh_token"]
    r2 = client.post("/api/v1/auth/logout", json={"refresh_token": refresh_token})
    assert r2.status_code == 204
    r3 = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert r3.status_code == 401


# ---------------------------------------------------------------------------
# Password reset
# ---------------------------------------------------------------------------

def _register(client, email="user@example.com", password="password1"):
    r = client.post("/api/v1/auth/register", json={
        "email": email, "password": password, "name": "User", "locale": "en"
    })
    assert r.status_code == 201
    return r.json()


def test_forgot_password_returns_204_for_known_email(client):
    _register(client)
    r = client.post("/api/v1/auth/forgot-password", json={"email": "user@example.com"})
    assert r.status_code == 204


def test_forgot_password_returns_204_for_unknown_email(client):
    # Must not reveal whether the email exists
    r = client.post("/api/v1/auth/forgot-password", json={"email": "nobody@example.com"})
    assert r.status_code == 204


def test_reset_password_with_valid_token(client, db_session):
    from app.models import PasswordResetToken
    from datetime import datetime, timedelta, timezone
    _register(client)
    client.post("/api/v1/auth/forgot-password", json={"email": "user@example.com"})
    prt = db_session.query(PasswordResetToken).first()
    assert prt is not None

    r = client.post("/api/v1/auth/reset-password", json={
        "token": prt.token, "new_password": "newpassword1"
    })
    assert r.status_code == 204

    # Can now log in with new password
    r2 = client.post("/api/v1/auth/login", json={
        "email": "user@example.com", "password": "newpassword1"
    })
    assert r2.status_code == 200


def test_reset_password_old_password_no_longer_works(client, db_session):
    from app.models import PasswordResetToken
    _register(client)
    client.post("/api/v1/auth/forgot-password", json={"email": "user@example.com"})
    prt = db_session.query(PasswordResetToken).first()

    client.post("/api/v1/auth/reset-password", json={
        "token": prt.token, "new_password": "newpassword1"
    })
    r = client.post("/api/v1/auth/login", json={
        "email": "user@example.com", "password": "password1"
    })
    assert r.status_code == 401


def test_reset_password_token_can_only_be_used_once(client, db_session):
    from app.models import PasswordResetToken
    _register(client)
    client.post("/api/v1/auth/forgot-password", json={"email": "user@example.com"})
    prt = db_session.query(PasswordResetToken).first()

    client.post("/api/v1/auth/reset-password", json={
        "token": prt.token, "new_password": "newpassword1"
    })
    r = client.post("/api/v1/auth/reset-password", json={
        "token": prt.token, "new_password": "anotherpass1"
    })
    assert r.status_code == 400
    assert r.json()["detail"]["code"] == "RESET_TOKEN_INVALID"


def test_reset_password_expired_token(client, db_session):
    from app.models import PasswordResetToken
    from datetime import datetime, timedelta, timezone
    _register(client)
    client.post("/api/v1/auth/forgot-password", json={"email": "user@example.com"})
    prt = db_session.query(PasswordResetToken).first()
    prt.expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)
    db_session.commit()

    r = client.post("/api/v1/auth/reset-password", json={
        "token": prt.token, "new_password": "newpassword1"
    })
    assert r.status_code == 400
    assert r.json()["detail"]["code"] == "RESET_TOKEN_INVALID"


def test_reset_password_invalid_token(client):
    r = client.post("/api/v1/auth/reset-password", json={
        "token": "totally-fake-token", "new_password": "newpassword1"
    })
    assert r.status_code == 400
    assert r.json()["detail"]["code"] == "RESET_TOKEN_INVALID"


def test_reset_password_too_short(client, db_session):
    from app.models import PasswordResetToken
    _register(client)
    client.post("/api/v1/auth/forgot-password", json={"email": "user@example.com"})
    prt = db_session.query(PasswordResetToken).first()

    r = client.post("/api/v1/auth/reset-password", json={
        "token": prt.token, "new_password": "short"
    })
    assert r.status_code == 422


def test_reset_password_revokes_existing_sessions(client, db_session):
    from app.models import PasswordResetToken, RefreshToken
    data = _register(client)
    old_refresh = data["refresh_token"]

    client.post("/api/v1/auth/forgot-password", json={"email": "user@example.com"})
    prt = db_session.query(PasswordResetToken).first()

    client.post("/api/v1/auth/reset-password", json={
        "token": prt.token, "new_password": "newpassword1"
    })

    # Old refresh token must be revoked
    r = client.post("/api/v1/auth/refresh", json={"refresh_token": old_refresh})
    assert r.status_code == 401
