"""Tests for the Hornet Tracker endpoints (all public, no auth required)."""


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------


def test_stats_empty_db(client):
    r = client.get("/api/v1/hornets/stats")
    assert r.status_code == 200
    data = r.json()
    assert data["total_caught"] == 0
    assert data["total_nests"] == 0
    assert data["destroyed_nests"] == 0
    assert data["pending_sightings"] == 0
    assert data["confirmed_sightings"] == 0


def test_stats_no_auth_required(client):
    assert client.get("/api/v1/hornets/stats").status_code == 200


def test_stats_aggregates_catches(client):
    client.post("/api/v1/hornets/catches", json={"count": 5})
    client.post("/api/v1/hornets/catches", json={"count": 3})
    data = client.get("/api/v1/hornets/stats").json()
    assert data["total_caught"] == 8


def test_stats_counts_nests_and_destroyed(client):
    client.post("/api/v1/hornets/nests", json={"latitude": 48.0, "longitude": 2.0})
    client.post("/api/v1/hornets/nests", json={"latitude": 49.0, "longitude": 3.0})
    # Manually confirm a nest as destroyed via DB
    from app.models import HornetNest
    from tests.conftest import TestingSession
    db = TestingSession()
    try:
        nest = db.query(HornetNest).first()
        nest.status = "destroyed"
        db.commit()
    finally:
        db.close()
    data = client.get("/api/v1/hornets/stats").json()
    assert data["total_nests"] == 2
    assert data["destroyed_nests"] == 1


def test_stats_counts_sightings(client):
    client.post("/api/v1/hornets/sightings", json={"photo_url": "https://blob.example.com/1.jpg"})
    data = client.get("/api/v1/hornets/stats").json()
    assert data["pending_sightings"] == 1
    assert data["confirmed_sightings"] == 0


# ---------------------------------------------------------------------------
# Catches
# ---------------------------------------------------------------------------


def test_report_catch_minimal(client):
    r = client.post("/api/v1/hornets/catches", json={"count": 1})
    assert r.status_code == 201
    data = r.json()
    assert data["count"] == 1
    assert data["latitude"] is None
    assert data["longitude"] is None
    assert "id" in data
    assert "created_at" in data


def test_report_catch_with_location(client):
    r = client.post("/api/v1/hornets/catches", json={
        "count": 3,
        "latitude": 48.8566,
        "longitude": 2.3522,
        "reporter_name": "Alice",
    })
    assert r.status_code == 201
    data = r.json()
    assert data["count"] == 3
    assert data["latitude"] == 48.8566
    assert data["longitude"] == 2.3522


def test_report_catch_default_count(client):
    r = client.post("/api/v1/hornets/catches", json={})
    assert r.status_code == 201
    assert r.json()["count"] == 1


def test_report_catch_count_validation_too_low(client):
    r = client.post("/api/v1/hornets/catches", json={"count": 0})
    assert r.status_code == 422


def test_report_catch_count_validation_too_high(client):
    r = client.post("/api/v1/hornets/catches", json={"count": 1001})
    assert r.status_code == 422


def test_report_catch_no_auth_required(client):
    r = client.post("/api/v1/hornets/catches", json={"count": 2})
    assert r.status_code == 201


# ---------------------------------------------------------------------------
# Nests
# ---------------------------------------------------------------------------


def test_report_nest_success(client):
    r = client.post("/api/v1/hornets/nests", json={
        "latitude": 48.8566,
        "longitude": 2.3522,
        "reporter_name": "Bob",
        "notes": "Under the roof",
        "photo_url": "https://blob.example.com/nest.jpg",
    })
    assert r.status_code == 201
    data = r.json()
    assert data["latitude"] == 48.8566
    assert data["longitude"] == 2.3522
    assert data["status"] == "found"
    assert data["reporter_name"] == "Bob"
    assert data["notes"] == "Under the roof"
    assert data["photo_url"] == "https://blob.example.com/nest.jpg"
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data


def test_report_nest_missing_latitude(client):
    r = client.post("/api/v1/hornets/nests", json={"longitude": 2.35})
    assert r.status_code == 422


def test_report_nest_missing_longitude(client):
    r = client.post("/api/v1/hornets/nests", json={"latitude": 48.85})
    assert r.status_code == 422


def test_report_nest_lat_out_of_range(client):
    r = client.post("/api/v1/hornets/nests", json={"latitude": 100.0, "longitude": 2.0})
    assert r.status_code == 422


def test_report_nest_lon_out_of_range(client):
    r = client.post("/api/v1/hornets/nests", json={"latitude": 48.0, "longitude": 200.0})
    assert r.status_code == 422


def test_report_nest_no_auth_required(client):
    r = client.post("/api/v1/hornets/nests", json={"latitude": 48.0, "longitude": 2.0})
    assert r.status_code == 201


def test_get_nests_geojson_empty(client):
    r = client.get("/api/v1/hornets/nests")
    assert r.status_code == 200
    data = r.json()
    assert data["type"] == "FeatureCollection"
    assert data["features"] == []


def test_get_nests_geojson_structure(client):
    client.post("/api/v1/hornets/nests", json={"latitude": 48.8566, "longitude": 2.3522})
    r = client.get("/api/v1/hornets/nests")
    assert r.status_code == 200
    data = r.json()
    assert len(data["features"]) == 1
    feature = data["features"][0]
    assert feature["type"] == "Feature"
    assert feature["geometry"]["type"] == "Point"
    # GeoJSON order: [longitude, latitude] — fuzzed to 3 decimals (~111m), see below
    assert feature["geometry"]["coordinates"] == [2.352, 48.857]
    props = feature["properties"]
    assert props["status"] == "found"
    assert "id" in props
    assert "created_at" in props


def test_get_nests_geojson_fuzzes_coordinates(client):
    client.post("/api/v1/hornets/nests", json={"latitude": 48.856612345, "longitude": 2.352212345})
    data = client.get("/api/v1/hornets/nests").json()
    lon, lat = data["features"][0]["geometry"]["coordinates"]
    assert lon == round(2.352212345, 3)
    assert lat == round(48.856612345, 3)


def test_get_nests_geojson_omits_reporter_name(client):
    # reporter_name is never rendered by the map UI — public GeoJSON shouldn't
    # publish a reporter's name alongside their (fuzzed) home coordinates.
    client.post("/api/v1/hornets/nests", json={
        "latitude": 48.0, "longitude": 2.0, "reporter_name": "Bob",
    })
    data = client.get("/api/v1/hornets/nests").json()
    assert "reporter_name" not in data["features"][0]["properties"]


def test_get_nests_no_auth_required(client):
    assert client.get("/api/v1/hornets/nests").status_code == 200


def test_report_nest_rate_limited_after_threshold(client):
    for i in range(20):
        r = client.post("/api/v1/hornets/nests", json={"latitude": 48.0, "longitude": 2.0})
        assert r.status_code == 201
    r = client.post("/api/v1/hornets/nests", json={"latitude": 48.0, "longitude": 2.0})
    assert r.status_code == 429


# ---------------------------------------------------------------------------
# Sightings
# ---------------------------------------------------------------------------


def test_submit_sighting_success(client):
    r = client.post("/api/v1/hornets/sightings", json={
        "photo_url": "https://blob.example.com/s1.jpg",
        "description": "Spotted near flowers",
        "reporter_name": "Carol",
        "latitude": 48.0,
        "longitude": 2.0,
    })
    assert r.status_code == 201
    data = r.json()
    assert data["photo_url"] == "https://blob.example.com/s1.jpg"
    assert data["status"] == "pending"
    assert data["yes_votes"] == 0
    assert data["no_votes"] == 0
    assert data["description"] == "Spotted near flowers"
    assert "id" in data
    assert "created_at" in data


def test_submit_sighting_missing_photo_url(client):
    r = client.post("/api/v1/hornets/sightings", json={"description": "No photo"})
    assert r.status_code == 422


def test_submit_sighting_no_auth_required(client):
    r = client.post("/api/v1/hornets/sightings", json={"photo_url": "https://blob.example.com/x.jpg"})
    assert r.status_code == 201


def test_list_sightings_empty(client):
    r = client.get("/api/v1/hornets/sightings")
    assert r.status_code == 200
    data = r.json()
    assert data["items"] == []
    assert data["total"] == 0
    assert data["page"] == 1


def test_list_sightings_pagination(client):
    for i in range(5):
        client.post("/api/v1/hornets/sightings", json={"photo_url": f"https://blob.example.com/{i}.jpg"})
    r = client.get("/api/v1/hornets/sightings?page=1&per_page=3")
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 5
    assert data["pages"] == 2
    assert len(data["items"]) == 3


def test_list_sightings_no_auth_required(client):
    assert client.get("/api/v1/hornets/sightings").status_code == 200


def test_list_sightings_fuzzes_coordinates(client):
    client.post("/api/v1/hornets/sightings", json={
        "photo_url": "https://blob.example.com/x.jpg",
        "latitude": 48.856612345,
        "longitude": 2.352212345,
    })
    item = client.get("/api/v1/hornets/sightings").json()["items"][0]
    assert item["latitude"] == round(48.856612345, 3)
    assert item["longitude"] == round(2.352212345, 3)


def test_list_sightings_keeps_reporter_name(client):
    # Unlike nests, reporter_name on a sighting is an intentional, user-opted-in
    # attribution the community page displays — it must not be fuzzed away.
    client.post("/api/v1/hornets/sightings", json={
        "photo_url": "https://blob.example.com/x.jpg",
        "reporter_name": "Carol",
    })
    item = client.get("/api/v1/hornets/sightings").json()["items"][0]
    assert item["reporter_name"] == "Carol"


# ---------------------------------------------------------------------------
# Voting
# ---------------------------------------------------------------------------


def _create_sighting(client, photo_url="https://blob.example.com/v.jpg"):
    return client.post("/api/v1/hornets/sightings", json={"photo_url": photo_url}).json()["id"]


def test_vote_yes(client):
    sid = _create_sighting(client)
    r = client.post(f"/api/v1/hornets/sightings/{sid}/vote", json={"vote": "yes"})
    assert r.status_code == 204
    items = client.get("/api/v1/hornets/sightings").json()["items"]
    assert items[0]["yes_votes"] == 1
    assert items[0]["no_votes"] == 0


def test_vote_no(client):
    sid = _create_sighting(client)
    client.post(f"/api/v1/hornets/sightings/{sid}/vote", json={"vote": "no"})
    items = client.get("/api/v1/hornets/sightings").json()["items"]
    assert items[0]["no_votes"] == 1


def test_vote_invalid_value(client):
    sid = _create_sighting(client)
    r = client.post(f"/api/v1/hornets/sightings/{sid}/vote", json={"vote": "maybe"})
    assert r.status_code == 422


def test_vote_not_found(client):
    r = client.post("/api/v1/hornets/sightings/does-not-exist/vote", json={"vote": "yes"})
    assert r.status_code == 404


def test_vote_auto_confirm(client):
    """yes > 2× no AND total ≥ 5 triggers automatic confirmation."""
    sid = _create_sighting(client)
    # 2 no votes first
    for _ in range(2):
        client.post(f"/api/v1/hornets/sightings/{sid}/vote", json={"vote": "no"})
    # 3 yes votes — total=5, yes(3) < no*2(4), not yet confirmed
    for _ in range(3):
        client.post(f"/api/v1/hornets/sightings/{sid}/vote", json={"vote": "yes"})
    items = client.get("/api/v1/hornets/sightings").json()["items"]
    assert items[0]["status"] == "pending"

    # 2 more yes votes → total=7, yes(5) > no*2(4), confirmed
    for _ in range(2):
        client.post(f"/api/v1/hornets/sightings/{sid}/vote", json={"vote": "yes"})
    items = client.get("/api/v1/hornets/sightings").json()["items"]
    assert items[0]["status"] == "confirmed"


def test_vote_no_auth_required(client):
    sid = _create_sighting(client)
    r = client.post(f"/api/v1/hornets/sightings/{sid}/vote", json={"vote": "yes"})
    assert r.status_code == 204


# ---------------------------------------------------------------------------
# Admin override
# ---------------------------------------------------------------------------


def test_admin_set_status_confirmed(admin_client):
    sid = _create_sighting(admin_client)
    r = admin_client.put(f"/api/v1/admin/hornets/sightings/{sid}/status", json={"status": "confirmed"})
    assert r.status_code == 204
    items = admin_client.get("/api/v1/hornets/sightings").json()["items"]
    assert items[0]["status"] == "confirmed"


def test_admin_set_status_rejected(admin_client):
    sid = _create_sighting(admin_client)
    r = admin_client.put(f"/api/v1/admin/hornets/sightings/{sid}/status", json={"status": "rejected"})
    assert r.status_code == 204
    items = admin_client.get("/api/v1/hornets/sightings").json()["items"]
    assert items[0]["status"] == "rejected"


def test_admin_set_status_invalid(admin_client):
    sid = _create_sighting(admin_client)
    r = admin_client.put(f"/api/v1/admin/hornets/sightings/{sid}/status", json={"status": "pending"})
    assert r.status_code == 422


def test_admin_set_status_not_found(admin_client):
    r = admin_client.put("/api/v1/admin/hornets/sightings/does-not-exist/status", json={"status": "confirmed"})
    assert r.status_code == 404


def test_admin_set_status_requires_admin(client):
    """Unauthenticated request: missing Authorization header → 422 (required header).
    This matches the existing backend behaviour for all protected endpoints."""
    sid = _create_sighting(client)
    r = client.put(f"/api/v1/admin/hornets/sightings/{sid}/status", json={"status": "confirmed"})
    # Missing Authorization header → FastAPI header-validation error (422)
    assert r.status_code == 422


# ---------------------------------------------------------------------------
# Traps (issue #134)
# ---------------------------------------------------------------------------

_TRAP_PAYLOAD = {
    "name": "Garten Falle A",
    "latitude": 48.2,
    "longitude": 16.3,
    "notes": "Neben dem Apfelbaum",
    "owner_name": "Max Mustermann",
}


def _create_trap(client, payload=None) -> dict:
    r = client.post("/api/v1/hornets/traps", json=payload or _TRAP_PAYLOAD)
    assert r.status_code == 201, r.text
    return r.json()


def test_create_trap_returns_access_code(client):
    data = _create_trap(client)
    assert "access_code" in data
    assert len(data["access_code"]) == 8
    assert data["name"] == _TRAP_PAYLOAD["name"]
    assert data["total_caught"] == 0
    assert data["catches"] == []


def test_create_trap_no_auth_required(client):
    r = client.post("/api/v1/hornets/traps", json=_TRAP_PAYLOAD)
    assert r.status_code == 201


def test_create_trap_validates_name(client):
    payload = {**_TRAP_PAYLOAD, "name": ""}
    r = client.post("/api/v1/hornets/traps", json=payload)
    assert r.status_code == 422


def test_get_trap_by_access_code(client):
    created = _create_trap(client)
    code = created["access_code"]
    r = client.get(f"/api/v1/hornets/traps/{code}")
    assert r.status_code == 200
    data = r.json()
    assert data["access_code"] == code
    assert data["name"] == _TRAP_PAYLOAD["name"]


def test_get_trap_case_insensitive(client):
    created = _create_trap(client)
    code = created["access_code"].lower()
    r = client.get(f"/api/v1/hornets/traps/{code}")
    assert r.status_code == 200


def test_get_trap_not_found(client):
    r = client.get("/api/v1/hornets/traps/NOTEXIST")
    assert r.status_code == 404


def test_add_catch_to_trap(client):
    created = _create_trap(client)
    code = created["access_code"]
    r = client.post(
        f"/api/v1/hornets/traps/{code}/catches",
        json={"count": 7, "caught_on": "2026-05-21"},
    )
    assert r.status_code == 201
    data = r.json()
    assert data["count"] == 7
    assert data["caught_on"] == "2026-05-21"


def test_add_catch_upserts_same_day(client):
    """Two POSTs for the same (trap, date) should upsert, not duplicate."""
    created = _create_trap(client)
    code = created["access_code"]
    client.post(f"/api/v1/hornets/traps/{code}/catches", json={"count": 3, "caught_on": "2026-05-21"})
    client.post(f"/api/v1/hornets/traps/{code}/catches", json={"count": 9, "caught_on": "2026-05-21"})

    trap = client.get(f"/api/v1/hornets/traps/{code}").json()
    # Only one entry, count updated to 9
    assert len(trap["catches"]) == 1
    assert trap["catches"][0]["count"] == 9
    assert trap["total_caught"] == 9


def test_add_catch_validates_count(client):
    created = _create_trap(client)
    code = created["access_code"]
    r = client.post(
        f"/api/v1/hornets/traps/{code}/catches",
        json={"count": 0, "caught_on": "2026-05-21"},
    )
    assert r.status_code == 422


def test_add_catch_trap_not_found(client):
    r = client.post(
        "/api/v1/hornets/traps/NOTEXIST/catches",
        json={"count": 1, "caught_on": "2026-05-21"},
    )
    assert r.status_code == 404


def test_nearby_returns_close_trap(client):
    # Create trap at known location
    _create_trap(client, {**_TRAP_PAYLOAD, "latitude": 48.2000, "longitude": 16.3000})
    # Query from ~10 m away (same lat, tiny lon offset ≈ 8 m)
    r = client.get("/api/v1/hornets/traps/nearby?lat=48.2000&lon=16.3001&radius_m=50")
    assert r.status_code == 200
    data = r.json()
    assert len(data) >= 1
    assert data[0]["name"] == _TRAP_PAYLOAD["name"]
    assert data[0]["distance_m"] <= 50


def test_nearby_excludes_distant_trap(client):
    _create_trap(client, {**_TRAP_PAYLOAD, "latitude": 48.2, "longitude": 16.3})
    # Query from >50 m away (different city)
    r = client.get("/api/v1/hornets/traps/nearby?lat=47.0&lon=15.0&radius_m=50")
    assert r.status_code == 200
    assert r.json() == []


def test_nearby_sorted_by_distance(client):
    _create_trap(client, {**_TRAP_PAYLOAD, "name": "Far", "latitude": 48.2002, "longitude": 16.3000})
    _create_trap(client, {**_TRAP_PAYLOAD, "name": "Close", "latitude": 48.2001, "longitude": 16.3000})
    r = client.get("/api/v1/hornets/traps/nearby?lat=48.2000&lon=16.3000&radius_m=500")
    data = r.json()
    names = [d["name"] for d in data]
    assert names.index("Close") < names.index("Far")


def test_traps_geojson(client):
    _create_trap(client)
    r = client.get("/api/v1/hornets/traps/geojson")
    assert r.status_code == 200
    data = r.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) >= 1
    feat = data["features"][0]
    assert feat["geometry"]["type"] == "Point"
    assert "access_code" in feat["properties"]
    assert "total_caught" in feat["properties"]


def test_traps_geojson_fuzzes_coordinates(client):
    _create_trap(client, {**_TRAP_PAYLOAD, "latitude": 48.200612345, "longitude": 16.300212345})
    feat = client.get("/api/v1/hornets/traps/geojson").json()["features"][0]
    lon, lat = feat["geometry"]["coordinates"]
    assert lon == round(16.300212345, 3)
    assert lat == round(48.200612345, 3)


def test_create_trap_rate_limited_after_threshold(client):
    for i in range(20):
        r = client.post("/api/v1/hornets/traps", json={**_TRAP_PAYLOAD, "name": f"Trap {i}"})
        assert r.status_code == 201
    r = client.post("/api/v1/hornets/traps", json=_TRAP_PAYLOAD)
    assert r.status_code == 429


def test_stats_includes_total_traps(client):
    _create_trap(client)
    _create_trap(client, {**_TRAP_PAYLOAD, "name": "Zweite Falle"})
    data = client.get("/api/v1/hornets/stats").json()
    assert data["total_traps"] >= 2


# ---------------------------------------------------------------------------
# Authenticated trap management (issue #135)
# ---------------------------------------------------------------------------


def test_create_trap_links_user_when_authenticated(auth_client):
    """Trap created while authenticated should be linked to the user."""
    r = auth_client.post("/api/v1/hornets/traps", json=_TRAP_PAYLOAD)
    assert r.status_code == 201
    trap = r.json()

    # The trap should appear in the user's list
    r2 = auth_client.get("/api/v1/hornets/traps")
    assert r2.status_code == 200
    codes = [t["access_code"] for t in r2.json()]
    assert trap["access_code"] in codes


def test_list_my_traps_requires_auth(client):
    """GET /hornets/traps without auth should return 401/422."""
    r = client.get("/api/v1/hornets/traps")
    assert r.status_code in (401, 422)


def test_list_my_traps_empty(auth_client):
    """Returns empty list when the user has no traps."""
    r = auth_client.get("/api/v1/hornets/traps")
    assert r.status_code == 200
    assert r.json() == []


def test_list_my_traps_excludes_other_users_traps(auth_client, auth_client2):
    """Traps created by another user are not returned."""
    auth_client.post("/api/v1/hornets/traps", json=_TRAP_PAYLOAD)

    r = auth_client2.get("/api/v1/hornets/traps")
    assert r.status_code == 200
    assert r.json() == []


def test_create_trap_anonymous_not_linked(client):
    """Anonymous trap creation should still work but have no user_id."""
    r = client.post("/api/v1/hornets/traps", json=_TRAP_PAYLOAD)
    assert r.status_code == 201
