"""Tests for admin token management endpoints."""


def _register_and_login(client, email, name="User"):
    client.post("/api/v1/auth/register", json={
        "email": email, "password": "password123", "name": name, "locale": "en",
    })
    resp = client.post("/api/v1/auth/login", json={"email": email, "password": "password123"})
    return resp.json()


def _get_user_id(admin_client, email):
    resp = admin_client.get(f"/api/v1/admin/users?q={email}")
    return resp.json()["items"][0]["id"]


# ---------------------------------------------------------------------------
# GET /admin/tokens/stats
# ---------------------------------------------------------------------------

def test_token_stats_returns_expected_fields(admin_client):
    resp = admin_client.get("/api/v1/admin/tokens/stats")
    assert resp.status_code == 200
    data = resp.json()
    assert "total_active_sessions" in data
    assert "users_with_active_sessions" in data
    assert "avg_sessions_per_user" in data


def test_token_stats_counts_active_sessions(admin_client):
    _register_and_login(admin_client, "session1@example.com")
    _register_and_login(admin_client, "session2@example.com")

    resp = admin_client.get("/api/v1/admin/tokens/stats")
    data = resp.json()
    # admin + 2 new users each have at least 1 active session
    assert data["total_active_sessions"] >= 3
    assert data["users_with_active_sessions"] >= 3


def test_token_stats_avg_per_user_is_numeric(admin_client):
    resp = admin_client.get("/api/v1/admin/tokens/stats")
    avg = resp.json()["avg_sessions_per_user"]
    assert isinstance(avg, (int, float))
    assert avg >= 0


def test_token_stats_requires_admin(auth_client):
    resp = auth_client.get("/api/v1/admin/tokens/stats")
    assert resp.status_code == 403


# ---------------------------------------------------------------------------
# GET /admin/users/{id}/tokens
# ---------------------------------------------------------------------------

def test_list_user_tokens_returns_active_tokens(admin_client):
    _register_and_login(admin_client, "tokuser@example.com")
    user_id = _get_user_id(admin_client, "tokuser@example.com")

    resp = admin_client.get(f"/api/v1/admin/users/{user_id}/tokens")
    assert resp.status_code == 200
    tokens = resp.json()
    assert len(tokens) >= 1
    assert "id" in tokens[0]
    assert "expires_at" in tokens[0]


def test_list_user_tokens_excludes_revoked(admin_client, db_session):
    from app.models import RefreshToken

    _register_and_login(admin_client, "revoked@example.com")
    user_id = _get_user_id(admin_client, "revoked@example.com")

    # revoke all tokens directly so we don't depend on logout creating only 1 token
    db_session.query(RefreshToken).filter(
        RefreshToken.user_id == user_id
    ).update({"revoked": True}, synchronize_session=False)
    db_session.commit()

    resp = admin_client.get(f"/api/v1/admin/users/{user_id}/tokens")
    assert resp.status_code == 200
    assert len(resp.json()) == 0


def test_list_user_tokens_not_found(admin_client):
    resp = admin_client.get("/api/v1/admin/users/nonexistent/tokens")
    assert resp.status_code == 404
    assert resp.json()["detail"]["code"] == "USER_NOT_FOUND"


def test_list_user_tokens_requires_admin(auth_client):
    resp = auth_client.get("/api/v1/admin/users/any-id/tokens")
    assert resp.status_code == 403


# ---------------------------------------------------------------------------
# DELETE /admin/users/{id}/tokens
# ---------------------------------------------------------------------------

def test_revoke_user_tokens_returns_204(admin_client):
    _register_and_login(admin_client, "todel@example.com")
    user_id = _get_user_id(admin_client, "todel@example.com")

    resp = admin_client.delete(f"/api/v1/admin/users/{user_id}/tokens")
    assert resp.status_code == 204


def test_revoke_user_tokens_clears_active_sessions(admin_client):
    _register_and_login(admin_client, "forcedout@example.com")
    # login again to get a second token
    _register_and_login(admin_client, "forcedout@example.com")
    user_id = _get_user_id(admin_client, "forcedout@example.com")

    admin_client.delete(f"/api/v1/admin/users/{user_id}/tokens")

    resp = admin_client.get(f"/api/v1/admin/users/{user_id}/tokens")
    assert resp.json() == []


def test_revoke_user_tokens_prevents_refresh(admin_client):
    data = _register_and_login(admin_client, "cannotrefresh@example.com")
    refresh_token = data["refresh_token"]
    user_id = _get_user_id(admin_client, "cannotrefresh@example.com")

    admin_client.delete(f"/api/v1/admin/users/{user_id}/tokens")

    # use the client without overriding auth header — refresh is an unauthenticated endpoint
    resp = admin_client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert resp.status_code == 401


def test_revoke_user_tokens_not_found(admin_client):
    resp = admin_client.delete("/api/v1/admin/users/nonexistent/tokens")
    assert resp.status_code == 404
    assert resp.json()["detail"]["code"] == "USER_NOT_FOUND"


def test_revoke_user_tokens_requires_admin(auth_client):
    resp = auth_client.delete("/api/v1/admin/users/any-id/tokens")
    assert resp.status_code == 403
