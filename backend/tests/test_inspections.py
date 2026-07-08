import pytest


@pytest.fixture
def hive(auth_client):
    apiary = auth_client.post("/api/v1/apiaries", json={"name": "Garden"}).json()
    batch = auth_client.post("/api/v1/qr-batches", json={"count": 1}).json()
    token = batch["tokens"][0]["token"]
    return auth_client.post("/api/v1/hives/initialize", json={
        "qr_token": token, "apiary_id": apiary["id"], "name": "H1", "hive_type": "langstroth"
    }).json()


def test_create_inspection(auth_client, hive):
    r = auth_client.post(f"/api/v1/hives/{hive['id']}/inspections", json={
        "date": "2026-04-01",
        "queen_seen": True,
        "brood_frames": 5,
        "mood": "calm",
        "varroa_count": 2,
    })
    assert r.status_code == 201
    assert r.json()["brood_frames"] == 5


def test_list_inspections(auth_client, hive):
    for d in ["2026-03-01", "2026-04-01"]:
        auth_client.post(f"/api/v1/hives/{hive['id']}/inspections", json={"date": d})
    r = auth_client.get(f"/api/v1/hives/{hive['id']}/inspections")
    assert r.json()["total"] == 2


def test_update_inspection(auth_client, hive):
    r = auth_client.post(f"/api/v1/hives/{hive['id']}/inspections", json={"date": "2026-04-01", "varroa_count": 3})
    iid = r.json()["id"]
    r2 = auth_client.put(f"/api/v1/inspections/{iid}", json={"varroa_count": 5})
    assert r2.json()["varroa_count"] == 5


def test_update_inspection_with_date(auth_client, hive):
    r = auth_client.post(f"/api/v1/hives/{hive['id']}/inspections", json={"date": "2026-04-01", "varroa_count": 3, "mood": "calm"})
    iid = r.json()["id"]
    r2 = auth_client.put(f"/api/v1/inspections/{iid}", json={"date": "2026-04-02", "varroa_count": 7, "mood": "calm", "queen_seen": True, "brood_frames": 5})
    assert r2.status_code == 200
    assert r2.json()["varroa_count"] == 7
    assert r2.json()["date"] == "2026-04-02"


def test_delete_inspection(auth_client, hive):
    r = auth_client.post(f"/api/v1/hives/{hive['id']}/inspections", json={"date": "2026-04-01"})
    iid = r.json()["id"]
    r2 = auth_client.delete(f"/api/v1/inspections/{iid}")
    assert r2.status_code == 204


# ---------------------------------------------------------------------------
# Cross-user ownership isolation (#202)
# ---------------------------------------------------------------------------


def test_inspection_isolated_across_users(auth_client, auth_client2, hive):
    iid = auth_client.post(f"/api/v1/hives/{hive['id']}/inspections", json={
        "date": "2026-04-01", "varroa_count": 3,
    }).json()["id"]

    assert auth_client2.get(f"/api/v1/inspections/{iid}").status_code == 404
    assert auth_client2.put(f"/api/v1/inspections/{iid}", json={"varroa_count": 99}).status_code == 404
    assert auth_client2.delete(f"/api/v1/inspections/{iid}").status_code == 404
    # Another user also can't list inspections on a hive they don't own.
    assert auth_client2.get(f"/api/v1/hives/{hive['id']}/inspections").status_code == 404

    assert auth_client.get(f"/api/v1/inspections/{iid}").json()["varroa_count"] == 3
