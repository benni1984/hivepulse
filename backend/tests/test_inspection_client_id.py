"""A retried offline inspection must not create a duplicate.

Apps record inspections at the apiary, where there is often no connection, and send them
later. Without an idempotency key, a retry after a timeout silently doubles the visit.
"""
import uuid


def _hive(auth_client, name="Hive 1"):
    """A hive is created by linking a QR token, same as in test_inspections.py."""
    apiary = auth_client.post("/api/v1/apiaries", json={"name": "Meadow"}).json()
    batch = auth_client.post("/api/v1/qr-batches", json={"count": 1}).json()
    hive = auth_client.post("/api/v1/hives/initialize", json={
        "qr_token": batch["tokens"][0]["token"],
        "apiary_id": apiary["id"],
        "name": name,
        "hive_type": "langstroth",
    }).json()
    return hive["id"]


def test_same_client_id_is_stored_once(auth_client):
    hive_id = _hive(auth_client)
    cid = str(uuid.uuid4())
    body = {"date": "2026-04-23", "brood_frames": 5, "varroa_level": 1, "client_id": cid}

    first = auth_client.post(f"/api/v1/hives/{hive_id}/inspections", json=body)
    assert first.status_code == 201, first.text

    retry = auth_client.post(f"/api/v1/hives/{hive_id}/inspections", json=body)
    assert retry.status_code == 200, retry.text
    assert retry.json()["id"] == first.json()["id"]

    listed = auth_client.get(f"/api/v1/hives/{hive_id}/inspections").json()
    assert listed["total"] == 1


def test_the_retry_does_not_overwrite_the_stored_inspection(auth_client):
    hive_id = _hive(auth_client)
    cid = str(uuid.uuid4())
    auth_client.post(
        f"/api/v1/hives/{hive_id}/inspections",
        json={"date": "2026-04-23", "brood_frames": 5, "client_id": cid},
    )
    # A retry built from a stale queue entry must not change what is already stored
    retry = auth_client.post(
        f"/api/v1/hives/{hive_id}/inspections",
        json={"date": "2026-04-23", "brood_frames": 9, "client_id": cid},
    )
    assert retry.status_code == 200
    assert retry.json()["brood_frames"] == 5


def test_client_id_is_returned_so_the_queue_can_match_entries(auth_client):
    hive_id = _hive(auth_client)
    cid = str(uuid.uuid4())
    created = auth_client.post(
        f"/api/v1/hives/{hive_id}/inspections",
        json={"date": "2026-04-23", "client_id": cid},
    ).json()
    assert created["client_id"] == cid

    fetched = auth_client.get(f"/api/v1/inspections/{created['id']}").json()
    assert fetched["client_id"] == cid


def test_the_same_client_id_may_be_used_on_another_hive(auth_client):
    first_hive = _hive(auth_client)
    second_hive = _hive(auth_client, "Hive 2")
    cid = str(uuid.uuid4())
    body = {"date": "2026-04-23", "client_id": cid}

    a = auth_client.post(f"/api/v1/hives/{first_hive}/inspections", json=body)
    b = auth_client.post(f"/api/v1/hives/{second_hive}/inspections", json=body)
    assert a.status_code == 201 and b.status_code == 201
    assert a.json()["id"] != b.json()["id"]


def test_without_a_client_id_every_post_creates_an_inspection(auth_client):
    hive_id = _hive(auth_client)
    body = {"date": "2026-04-23"}
    auth_client.post(f"/api/v1/hives/{hive_id}/inspections", json=body)
    auth_client.post(f"/api/v1/hives/{hive_id}/inspections", json=body)
    listed = auth_client.get(f"/api/v1/hives/{hive_id}/inspections").json()
    assert listed["total"] == 2


def test_client_id_is_length_limited(auth_client):
    hive_id = _hive(auth_client)
    too_long = auth_client.post(
        f"/api/v1/hives/{hive_id}/inspections",
        json={"date": "2026-04-23", "client_id": "x" * 65},
    )
    assert too_long.status_code == 422
