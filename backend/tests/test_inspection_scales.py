"""Varroa level (0–3) and three-step colony strength (1–3)."""
import csv
import io

import pytest

from app.utils.scales import population_strength_from_legacy, varroa_level_from_count


@pytest.fixture
def hive(auth_client):
    apiary = auth_client.post("/api/v1/apiaries", json={"name": "Scales"}).json()
    token = auth_client.post("/api/v1/qr-batches", json={"count": 1}).json()["tokens"][0]["token"]
    return auth_client.post("/api/v1/hives/initialize", json={
        "qr_token": token, "apiary_id": apiary["id"], "name": "S1", "hive_type": "langstroth",
    }).json()


def _create(auth_client, hive, **fields):
    return auth_client.post(f"/api/v1/hives/{hive['id']}/inspections", json={"date": "2026-05-01", **fields})


@pytest.mark.parametrize("count,level", [
    (None, None), (0, 0), (1, 1), (2, 1), (3, 2), (5, 2), (6, 3), (40, 3),
])
def test_varroa_level_from_count_bands(count, level):
    assert varroa_level_from_count(count) == level


@pytest.mark.parametrize("old,new", [(None, None), (1, 1), (2, 1), (3, 2), (4, 3), (5, 3)])
def test_population_strength_from_legacy(old, new):
    assert population_strength_from_legacy(old) == new


def test_varroa_level_is_stored_and_returned(auth_client, hive):
    r = _create(auth_client, hive, varroa_level=2)
    assert r.status_code == 201
    assert r.json()["varroa_level"] == 2
    assert r.json()["varroa_count"] is None


@pytest.mark.parametrize("level", [-1, 4])
def test_varroa_level_out_of_range_is_rejected(auth_client, hive, level):
    assert _create(auth_client, hive, varroa_level=level).status_code == 422


def test_legacy_count_derives_level_on_create(auth_client, hive):
    """Older app builds still send a mite count; the level must follow."""
    body = _create(auth_client, hive, varroa_count=4).json()
    assert body["varroa_count"] == 4
    assert body["varroa_level"] == 2


def test_explicit_level_wins_over_count(auth_client, hive):
    assert _create(auth_client, hive, varroa_count=40, varroa_level=1).json()["varroa_level"] == 1


def test_legacy_count_derives_level_on_update(auth_client, hive):
    iid = _create(auth_client, hive, varroa_level=0).json()["id"]
    body = auth_client.put(f"/api/v1/inspections/{iid}", json={"varroa_count": 9}).json()
    assert body["varroa_level"] == 3


def test_update_level_only_keeps_count(auth_client, hive):
    iid = _create(auth_client, hive, varroa_count=2).json()["id"]
    body = auth_client.put(f"/api/v1/inspections/{iid}", json={"varroa_level": 3}).json()
    assert body["varroa_level"] == 3
    assert body["varroa_count"] == 2


@pytest.mark.parametrize("value,status", [(1, 201), (3, 201), (0, 422), (4, 422), (9, 422)])
def test_population_strength_is_three_steps(auth_client, hive, value, status):
    """Android used to send 9 for "strong", which the API now clearly rejects."""
    assert _create(auth_client, hive, population_strength=value).status_code == status


def test_hive_stats_varroa_trend_uses_levels(auth_client, hive):
    _create(auth_client, hive, varroa_count=10)
    trend = auth_client.get(f"/api/v1/hives/{hive['id']}/stats").json()["varroa_trend"]
    assert [p["value"] for p in trend] == [3]


def test_export_has_varroa_level_column(auth_client, hive):
    _create(auth_client, hive, varroa_level=1)
    r = auth_client.get(f"/api/v1/hives/{hive['id']}/inspections/export?format=csv")
    assert r.status_code == 200
    rows = list(csv.DictReader(io.StringIO(r.text)))
    assert rows[0]["varroa_level"] == "1"
