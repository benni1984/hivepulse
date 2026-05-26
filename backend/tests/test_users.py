def test_get_me(auth_client):
    r = auth_client.get("/api/v1/users/me")
    assert r.status_code == 200
    data = r.json()
    assert data["email"] == "test@example.com"
    assert data["name"] == "Test User"
    assert data["locale"] == "en"
    assert "id" in data
    assert "created_at" in data


def test_update_name(auth_client):
    r = auth_client.put("/api/v1/users/me", json={"name": "Updated Name"})
    assert r.status_code == 200
    assert r.json()["name"] == "Updated Name"
    # Verify persistence
    assert auth_client.get("/api/v1/users/me").json()["name"] == "Updated Name"


def test_update_locale(auth_client):
    r = auth_client.put("/api/v1/users/me", json={"locale": "fr"})
    assert r.status_code == 200
    assert r.json()["locale"] == "fr"


def test_update_partial_fields_unchanged(auth_client):
    auth_client.put("/api/v1/users/me", json={"name": "Alice"})
    r = auth_client.put("/api/v1/users/me", json={"locale": "de"})
    assert r.json()["name"] == "Alice"
    assert r.json()["locale"] == "de"


def test_get_me_no_header_returns_422(client):
    # Missing Authorization header → FastAPI 422 (required header absent)
    r = client.get("/api/v1/users/me")
    assert r.status_code == 422


def test_get_me_invalid_token_returns_401(client):
    r = client.get("/api/v1/users/me", headers={"Authorization": "Bearer notavalidtoken"})
    assert r.status_code == 401
    assert r.json()["detail"]["code"] == "TOKEN_INVALID"


def test_update_invalid_locale(auth_client):
    r = auth_client.put("/api/v1/users/me", json={"locale": "xx"})
    assert r.status_code == 422


def test_change_password_success(auth_client):
    r = auth_client.put("/api/v1/users/me", json={
        "password": "newpassword123",
        "current_password": "password123",
    })
    assert r.status_code == 200
    # New password works
    r2 = auth_client.post("/api/v1/auth/login", json={
        "email": "test@example.com", "password": "newpassword123",
    })
    assert r2.status_code == 200


def test_change_password_wrong_current(auth_client):
    r = auth_client.put("/api/v1/users/me", json={
        "password": "newpassword123",
        "current_password": "wrongpassword",
    })
    assert r.status_code == 400


def test_change_password_missing_current(auth_client):
    r = auth_client.put("/api/v1/users/me", json={"password": "newpassword123"})
    assert r.status_code == 422


def test_delete_me(auth_client):
    r = auth_client.delete("/api/v1/users/me")
    assert r.status_code == 204
    # Account is gone — login should fail
    r2 = auth_client.post("/api/v1/auth/login", json={
        "email": "test@example.com", "password": "password123",
    })
    assert r2.status_code == 401


# ---------------------------------------------------------------------------
# Reminder settings
# ---------------------------------------------------------------------------


def test_get_reminder_settings_default_values(auth_client):
    r = auth_client.get("/api/v1/users/me/reminder")
    assert r.status_code == 200
    data = r.json()
    assert data["reminder_enabled"] is True
    assert data["reminder_interval_days"] == 7
    assert data["reminder_season_start"] == 4
    assert data["reminder_season_end"] == 8
    assert data["push_token_apns"] is None
    assert data["push_token_fcm"] is None


def test_get_reminder_settings_requires_auth(client):
    r = client.get("/api/v1/users/me/reminder")
    assert r.status_code == 422  # missing Authorization header


def test_update_reminder_enabled_false(auth_client):
    r = auth_client.put("/api/v1/users/me/reminder", json={"reminder_enabled": False})
    assert r.status_code == 200
    assert r.json()["reminder_enabled"] is False
    # Verify persistence
    r2 = auth_client.get("/api/v1/users/me/reminder")
    assert r2.json()["reminder_enabled"] is False


def test_update_reminder_interval_days(auth_client):
    r = auth_client.put("/api/v1/users/me/reminder", json={"reminder_interval_days": 14})
    assert r.status_code == 200
    assert r.json()["reminder_interval_days"] == 14


def test_update_reminder_season_start_and_end(auth_client):
    r = auth_client.put("/api/v1/users/me/reminder", json={
        "reminder_season_start": 3,
        "reminder_season_end": 9,
    })
    assert r.status_code == 200
    data = r.json()
    assert data["reminder_season_start"] == 3
    assert data["reminder_season_end"] == 9


def test_update_reminder_partial_update_preserves_other_fields(auth_client):
    auth_client.put("/api/v1/users/me/reminder", json={"reminder_interval_days": 21})
    r = auth_client.put("/api/v1/users/me/reminder", json={"reminder_enabled": False})
    data = r.json()
    assert data["reminder_interval_days"] == 21
    assert data["reminder_enabled"] is False


def test_update_reminder_invalid_interval(auth_client):
    r = auth_client.put("/api/v1/users/me/reminder", json={"reminder_interval_days": 0})
    assert r.status_code == 422


def test_update_reminder_invalid_season_month(auth_client):
    r = auth_client.put("/api/v1/users/me/reminder", json={"reminder_season_start": 13})
    assert r.status_code == 422


# ---------------------------------------------------------------------------
# Push token registration
# ---------------------------------------------------------------------------


def test_register_push_token_ios(auth_client):
    r = auth_client.post("/api/v1/users/me/push-token", json={
        "platform": "ios",
        "token": "fake-apns-device-token",
    })
    assert r.status_code == 200
    assert r.json() == {"ok": True}
    # Verify token is stored
    reminder = auth_client.get("/api/v1/users/me/reminder").json()
    assert reminder["push_token_apns"] == "fake-apns-device-token"
    assert reminder["push_token_fcm"] is None


def test_register_push_token_android(auth_client):
    r = auth_client.post("/api/v1/users/me/push-token", json={
        "platform": "android",
        "token": "fake-fcm-registration-token",
    })
    assert r.status_code == 200
    reminder = auth_client.get("/api/v1/users/me/reminder").json()
    assert reminder["push_token_fcm"] == "fake-fcm-registration-token"
    assert reminder["push_token_apns"] is None


def test_register_push_token_overwrites_previous(auth_client):
    auth_client.post("/api/v1/users/me/push-token", json={"platform": "ios", "token": "old-token"})
    auth_client.post("/api/v1/users/me/push-token", json={"platform": "ios", "token": "new-token"})
    reminder = auth_client.get("/api/v1/users/me/reminder").json()
    assert reminder["push_token_apns"] == "new-token"


def test_register_push_token_requires_auth(client):
    r = client.post("/api/v1/users/me/push-token", json={"platform": "ios", "token": "t"})
    assert r.status_code == 422
