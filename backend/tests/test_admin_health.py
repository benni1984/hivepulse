"""Tests for admin data health endpoints."""
from datetime import datetime, timedelta

from app.models import Hive, Inspection, User


def _register_and_login(client, email, name="User"):
    client.post("/api/v1/auth/register", json={
        "email": email, "password": "password123", "name": name, "locale": "en",
    })
    resp = client.post("/api/v1/auth/login", json={"email": email, "password": "password123"})
    return resp.json()["access_token"]


def _backdate_user(db_session, email, days=31):
    user = db_session.query(User).filter(User.email == email).first()
    user.created_at = datetime.utcnow() - timedelta(days=days)
    db_session.commit()


# ---------------------------------------------------------------------------
# GET /admin/health/summary
# ---------------------------------------------------------------------------

def test_health_summary_returns_all_fields(admin_client):
    resp = admin_client.get("/api/v1/admin/health/summary")
    assert resp.status_code == 200
    data = resp.json()
    assert "inactive_users" in data
    assert "zero_inspection_hives" in data
    assert "no_varroa_inspections" in data


def test_health_summary_counts_inactive_users(admin_client, db_session):
    _register_and_login(admin_client, "inactive@example.com")
    _backdate_user(db_session, "inactive@example.com")

    resp = admin_client.get("/api/v1/admin/health/summary")
    assert resp.json()["inactive_users"] >= 1


def test_health_summary_requires_admin(auth_client):
    resp = auth_client.get("/api/v1/admin/health/summary")
    assert resp.status_code == 403


# ---------------------------------------------------------------------------
# GET /admin/health/inactive-users
# ---------------------------------------------------------------------------

def test_inactive_users_empty_for_fresh_registrations(admin_client):
    _register_and_login(admin_client, "fresh@example.com")
    resp = admin_client.get("/api/v1/admin/health/inactive-users")
    assert resp.status_code == 200
    # fresh user registered today — not inactive yet
    emails = [u["email"] for u in resp.json()["items"]]
    assert "fresh@example.com" not in emails


def test_inactive_users_includes_backdated_user_with_no_inspections(admin_client, db_session):
    _register_and_login(admin_client, "old@example.com")
    _backdate_user(db_session, "old@example.com", days=31)

    resp = admin_client.get("/api/v1/admin/health/inactive-users")
    assert resp.status_code == 200
    emails = [u["email"] for u in resp.json()["items"]]
    assert "old@example.com" in emails


def test_inactive_users_response_has_expected_fields(admin_client, db_session):
    _register_and_login(admin_client, "fields@example.com")
    _backdate_user(db_session, "fields@example.com")

    resp = admin_client.get("/api/v1/admin/health/inactive-users")
    items = resp.json()["items"]
    assert len(items) >= 1
    item = next(u for u in items if u["email"] == "fields@example.com")
    assert "id" in item
    assert "email" in item
    assert "name" in item
    assert "created_at" in item
    assert "apiary_count" in item


def test_inactive_users_pagination(admin_client, db_session):
    for i in range(3):
        _register_and_login(admin_client, f"old{i}@example.com")
        _backdate_user(db_session, f"old{i}@example.com")

    resp = admin_client.get("/api/v1/admin/health/inactive-users?per_page=2")
    data = resp.json()
    assert len(data["items"]) <= 2
    assert data["total"] >= 3


def test_inactive_users_requires_admin(auth_client):
    resp = auth_client.get("/api/v1/admin/health/inactive-users")
    assert resp.status_code == 403


# ---------------------------------------------------------------------------
# GET /admin/health/no-varroa-inspections
# ---------------------------------------------------------------------------

def test_no_varroa_inspections_empty_when_all_have_varroa(admin_client):
    apiary = admin_client.post("/api/v1/apiaries", json={"name": "A"}).json()
    batch = admin_client.post("/api/v1/qr-batches", json={"count": 1}).json()
    token = batch["tokens"][0]["token"]
    admin_client.post("/api/v1/hives/initialize", json={
        "qr_token": token, "apiary_id": apiary["id"], "name": "H1",
    })
    hive = admin_client.get(f"/api/v1/apiaries/{apiary['id']}/hives").json()["items"][0]
    admin_client.post(f"/api/v1/hives/{hive['id']}/inspections", json={
        "date": "2024-06-01", "varroa_count": 5,
    })

    resp = admin_client.get("/api/v1/admin/health/no-varroa-inspections")
    assert resp.status_code == 200
    apiary_ids = [a["apiary_id"] for a in resp.json()]
    assert apiary["id"] not in apiary_ids


def test_no_varroa_inspections_detects_null_varroa(admin_client):
    apiary = admin_client.post("/api/v1/apiaries", json={"name": "NV Apiary"}).json()
    batch = admin_client.post("/api/v1/qr-batches", json={"count": 1}).json()
    token = batch["tokens"][0]["token"]
    admin_client.post("/api/v1/hives/initialize", json={
        "qr_token": token, "apiary_id": apiary["id"], "name": "H1",
    })
    hive = admin_client.get(f"/api/v1/apiaries/{apiary['id']}/hives").json()["items"][0]
    admin_client.post(f"/api/v1/hives/{hive['id']}/inspections", json={
        "date": "2024-06-01",  # no varroa_count → NULL
    })

    resp = admin_client.get("/api/v1/admin/health/no-varroa-inspections")
    assert resp.status_code == 200
    apiary_ids = [a["apiary_id"] for a in resp.json()]
    assert apiary["id"] in apiary_ids
    entry = next(a for a in resp.json() if a["apiary_id"] == apiary["id"])
    assert entry["missing_varroa_count"] == 1


def test_no_varroa_inspections_requires_admin(auth_client):
    resp = auth_client.get("/api/v1/admin/health/no-varroa-inspections")
    assert resp.status_code == 403


# ---------------------------------------------------------------------------
# GET /admin/health/zero-inspection-hives
# ---------------------------------------------------------------------------

def test_zero_inspection_hives_detects_uninspected_hive(admin_client):
    apiary = admin_client.post("/api/v1/apiaries", json={"name": "ZI Apiary"}).json()
    batch = admin_client.post("/api/v1/qr-batches", json={"count": 1}).json()
    token = batch["tokens"][0]["token"]
    admin_client.post("/api/v1/hives/initialize", json={
        "qr_token": token, "apiary_id": apiary["id"], "name": "Never Inspected",
    })

    resp = admin_client.get("/api/v1/admin/health/zero-inspection-hives")
    assert resp.status_code == 200
    names = [h["name"] for h in resp.json()]
    assert "Never Inspected" in names


def test_zero_inspection_hives_excludes_inspected_hive(admin_client):
    apiary = admin_client.post("/api/v1/apiaries", json={"name": "ZI2 Apiary"}).json()
    batch = admin_client.post("/api/v1/qr-batches", json={"count": 1}).json()
    token = batch["tokens"][0]["token"]
    admin_client.post("/api/v1/hives/initialize", json={
        "qr_token": token, "apiary_id": apiary["id"], "name": "Was Inspected",
    })
    hive = admin_client.get(f"/api/v1/apiaries/{apiary['id']}/hives").json()["items"][0]
    admin_client.post(f"/api/v1/hives/{hive['id']}/inspections", json={"date": "2024-06-01"})

    resp = admin_client.get("/api/v1/admin/health/zero-inspection-hives")
    names = [h["name"] for h in resp.json()]
    assert "Was Inspected" not in names


def test_zero_inspection_hives_response_has_expected_fields(admin_client):
    apiary = admin_client.post("/api/v1/apiaries", json={"name": "Fields Apiary"}).json()
    batch = admin_client.post("/api/v1/qr-batches", json={"count": 1}).json()
    token = batch["tokens"][0]["token"]
    admin_client.post("/api/v1/hives/initialize", json={
        "qr_token": token, "apiary_id": apiary["id"], "name": "Field Hive",
    })

    resp = admin_client.get("/api/v1/admin/health/zero-inspection-hives")
    item = next((h for h in resp.json() if h["name"] == "Field Hive"), None)
    assert item is not None
    for field in ["id", "name", "hive_type", "apiary_id", "apiary_name", "owner_email", "initialized_at"]:
        assert field in item


def test_zero_inspection_hives_requires_admin(auth_client):
    resp = auth_client.get("/api/v1/admin/health/zero-inspection-hives")
    assert resp.status_code == 403
