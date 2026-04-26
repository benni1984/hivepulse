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
