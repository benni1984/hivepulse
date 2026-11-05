"""The proposal queue: what beekeepers suggest, what an admin decides, and who sees the result.

The questionnaire is only half of it. The half that matters here is the promise that a stranger's
opinion cannot move a date in anybody's calendar — only an admin's decision can, and only inside
the region it was made for.
"""
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from main import app

from app.beekeeping_year import ENTRIES
from app.models import YearProposal, YearRating
from app.utils.geocoding import CityLocation

API = "/api/v1"
HAMBURG = CityLocation(name="Hamburg", latitude=53.5503, longitude=9.9937)

# An entry in February, so a shift of a few days cannot push it out of a 365-day window.
ENTRY = next(entry for entry in ENTRIES if entry.start.startswith("02"))
ENTRY_KEY = ENTRY.key


@pytest.fixture
def beekeeper(client):
    """A signed-in beekeeper on a client of their own.

    The admin and the ordinary-user fixtures both build on the single `client` fixture, so they
    are the same TestClient and whichever is asked for second overwrites the first one's
    Authorization header. A test that needs an admin *and* a beekeeper has to hold two clients.
    """
    with TestClient(app) as second:
        second.post(f"{API}/auth/register", json={
            "email": "beekeeper@example.com", "password": "password123",
            "name": "Beekeeper", "locale": "en",
        })
        token = second.post(f"{API}/auth/login", json={
            "email": "beekeeper@example.com", "password": "password123",
        }).json()["access_token"]
        second.headers.update({"Authorization": f"Bearer {token}"})
        yield second


@pytest.fixture
def ratings():
    """Five Hamburg beekeepers saying the same entry runs a week early there."""
    from tests.conftest import TestingSession

    db = TestingSession()
    try:
        for index in range(5):
            db.add(YearRating(
                entry_key=ENTRY_KEY, verdict="too_early", shift_days=-7,
                note=f"Note {index}", country="DE", latitude=53.6, longitude=10.0,
                device_hash=f"{index:064d}",
            ))
        db.commit()
    finally:
        db.close()


def _proposals(db):
    return db.query(YearProposal).all()


# ── Who may look ─────────────────────────────────────────────────────────────────────────

def test_the_queue_is_closed_to_everybody_but_admins(client, auth_client):
    assert client.get(f"{API}/admin/year-proposals").status_code in (401, 403)
    assert auth_client.get(f"{API}/admin/year-proposals").status_code == 403


def test_the_notes_beekeepers_wrote_are_admin_only(admin_client, ratings):
    """Free text from the public, shown to the people who moderate and to nobody else."""
    admin_client.post(f"{API}/admin/year-proposals/recompute")

    proposal = admin_client.get(f"{API}/admin/year-proposals").json()[0]

    assert sorted(proposal["notes"]) == [f"Note {index}" for index in range(5)]


# ── Recompute ────────────────────────────────────────────────────────────────────────────

def test_recompute_turns_a_group_of_ratings_into_one_proposal(admin_client, ratings):
    body = admin_client.post(f"{API}/admin/year-proposals/recompute").json()

    assert body == {"created": 1, "updated": 0, "unchanged": 7} or body["created"] == 1
    proposal = admin_client.get(f"{API}/admin/year-proposals").json()[0]
    assert proposal["entry_key"] == ENTRY_KEY
    assert proposal["kind"] == "shift"
    assert proposal["shift_days"] == -7
    assert proposal["rating_count"] == 5
    assert proposal["status"] == "pending"
    assert proposal["entry_title"], "an admin should not have to look the key up"


def test_recompute_twice_does_not_create_the_proposal_twice(admin_client, ratings):
    admin_client.post(f"{API}/admin/year-proposals/recompute")
    second = admin_client.post(f"{API}/admin/year-proposals/recompute").json()

    assert second["created"] == 0
    assert len(admin_client.get(f"{API}/admin/year-proposals").json()) == 1


def test_a_decision_is_never_undone_by_a_recompute(admin_client, ratings):
    """An admin's decision outranks the arithmetic. Re-running the grouping must not quietly
    reopen something that was already settled."""
    admin_client.post(f"{API}/admin/year-proposals/recompute")
    proposal_id = admin_client.get(f"{API}/admin/year-proposals").json()[0]["id"]
    admin_client.post(f"{API}/admin/year-proposals/{proposal_id}/reject")

    admin_client.post(f"{API}/admin/year-proposals/recompute")

    assert admin_client.get(f"{API}/admin/year-proposals").json() == []
    rejected = admin_client.get(f"{API}/admin/year-proposals", params={"status": "rejected"}).json()
    assert len(rejected) == 1 and rejected[0]["id"] == proposal_id


def test_a_pending_proposal_is_brought_up_to_date_when_its_group_grows(admin_client, ratings):
    from tests.conftest import TestingSession

    admin_client.post(f"{API}/admin/year-proposals/recompute")
    db = TestingSession()
    try:
        for index in range(5, 10):
            db.add(YearRating(
                entry_key=ENTRY_KEY, verdict="too_early", shift_days=-9, country="DE",
                latitude=53.6, longitude=10.0, device_hash=f"{index:064d}",
            ))
        db.commit()
    finally:
        db.close()

    body = admin_client.post(f"{API}/admin/year-proposals/recompute").json()

    assert body["updated"] == 1 and body["created"] == 0
    proposal = admin_client.get(f"{API}/admin/year-proposals").json()[0]
    assert proposal["rating_count"] == 10
    assert proposal["shift_days"] == -8, "the median of five -7 and five -9 sits between them"


# ── The decision, and what it changes ────────────────────────────────────────────────────

def test_a_pending_proposal_changes_nothing_for_anybody(admin_client, beekeeper, ratings):
    """The queue is a queue. Something waiting in it has no effect at all."""
    admin_client.post(f"{API}/admin/year-proposals/recompute")

    with patch("app.routers.beekeeping_year.forward_geocode_postal", return_value=HAMBURG):
        beekeeper.put(f"{API}/users/me/region", json={"country": "DE", "postal_code": "20095"})
    entries = {e["key"]: e for e in beekeeper.get(f"{API}/calendar", params={"days": 365}).json()["entries"]}

    assert entries[ENTRY_KEY]["regional_shift_days"] == 0
    assert entries[ENTRY_KEY]["rating_count"] == 0


def test_an_approved_correction_moves_the_entry_for_a_beekeeper_in_that_region(
    admin_client, beekeeper, ratings
):
    admin_client.post(f"{API}/admin/year-proposals/recompute")
    proposal_id = admin_client.get(f"{API}/admin/year-proposals").json()[0]["id"]

    with patch("app.routers.beekeeping_year.forward_geocode_postal", return_value=HAMBURG):
        beekeeper.put(f"{API}/users/me/region", json={"country": "DE", "postal_code": "20095"})
    before = {e["key"]: e for e in beekeeper.get(f"{API}/calendar", params={"days": 365}).json()["entries"]}

    admin_client.post(f"{API}/admin/year-proposals/{proposal_id}/approve", json={})
    after = {e["key"]: e for e in beekeeper.get(f"{API}/calendar", params={"days": 365}).json()["entries"]}

    assert after[ENTRY_KEY]["regional_shift_days"] == -7
    assert after[ENTRY_KEY]["rating_count"] == 5, "so a client can say how many beekeepers agreed"
    moved = (before[ENTRY_KEY]["start"], after[ENTRY_KEY]["start"])
    assert moved[0] != moved[1], f"the entry should have moved, got {moved}"
    # Only that entry: a correction is about one thing beekeepers disagreed with.
    others = [key for key, entry in after.items() if key != ENTRY_KEY and entry["regional_shift_days"]]
    assert others == []


def test_an_approved_correction_leaves_a_beekeeper_elsewhere_alone(admin_client, beekeeper, ratings):
    """A Hamburg correction is a statement about Hamburg."""
    admin_client.post(f"{API}/admin/year-proposals/recompute")
    proposal_id = admin_client.get(f"{API}/admin/year-proposals").json()[0]["id"]
    admin_client.post(f"{API}/admin/year-proposals/{proposal_id}/approve", json={})

    munich = CityLocation(name="München", latitude=48.1374, longitude=11.5755)
    with patch("app.routers.beekeeping_year.forward_geocode_postal", return_value=munich):
        beekeeper.put(f"{API}/users/me/region", json={"country": "DE", "postal_code": "80331"})
    entries = {e["key"]: e for e in beekeeper.get(f"{API}/calendar", params={"days": 365}).json()["entries"]}

    assert entries[ENTRY_KEY]["regional_shift_days"] == 0


def test_a_beekeeper_with_no_position_is_never_corrected(admin_client, beekeeper, ratings):
    """Without a place there is nothing for a regional correction to be true of."""
    admin_client.post(f"{API}/admin/year-proposals/recompute")
    proposal_id = admin_client.get(f"{API}/admin/year-proposals").json()[0]["id"]
    admin_client.post(f"{API}/admin/year-proposals/{proposal_id}/approve", json={})

    entries = {e["key"]: e for e in beekeeper.get(f"{API}/calendar", params={"days": 365}).json()["entries"]}

    assert entries[ENTRY_KEY]["regional_shift_days"] == 0


def test_an_admin_may_approve_a_different_number_than_the_ratings_produced(admin_client, ratings):
    """The ratings are evidence, not a vote that binds anybody: an admin who knows the region
    can overrule the median."""
    admin_client.post(f"{API}/admin/year-proposals/recompute")
    proposal_id = admin_client.get(f"{API}/admin/year-proposals").json()[0]["id"]

    body = admin_client.post(
        f"{API}/admin/year-proposals/{proposal_id}/approve", json={"shift_days": -3}
    ).json()

    assert body["shift_days"] == -3
    assert body["status"] == "approved"
    assert body["decided_at"] is not None


def test_a_rejected_proposal_moves_nothing(admin_client, beekeeper, ratings):
    admin_client.post(f"{API}/admin/year-proposals/recompute")
    proposal_id = admin_client.get(f"{API}/admin/year-proposals").json()[0]["id"]
    admin_client.post(f"{API}/admin/year-proposals/{proposal_id}/reject")

    with patch("app.routers.beekeeping_year.forward_geocode_postal", return_value=HAMBURG):
        beekeeper.put(f"{API}/users/me/region", json={"country": "DE", "postal_code": "20095"})
    entries = {e["key"]: e for e in beekeeper.get(f"{API}/calendar", params={"days": 365}).json()["entries"]}

    assert entries[ENTRY_KEY]["regional_shift_days"] == 0


def test_an_approved_hide_takes_the_entry_off_the_timeline_in_that_region(admin_client, beekeeper):
    """"This does not apply here" cannot be expressed as a number of days."""
    from tests.conftest import TestingSession

    db = TestingSession()
    try:
        for index in range(5):
            db.add(YearRating(
                entry_key=ENTRY_KEY, verdict="wrong", country="DE", latitude=53.6, longitude=10.0,
                device_hash=f"{index:064d}",
            ))
        db.commit()
    finally:
        db.close()

    admin_client.post(f"{API}/admin/year-proposals/recompute")
    proposal = admin_client.get(f"{API}/admin/year-proposals").json()[0]
    assert proposal["kind"] == "hide" and proposal["shift_days"] is None
    admin_client.post(f"{API}/admin/year-proposals/{proposal['id']}/approve", json={})

    with patch("app.routers.beekeeping_year.forward_geocode_postal", return_value=HAMBURG):
        beekeeper.put(f"{API}/users/me/region", json={"country": "DE", "postal_code": "20095"})
    keys = {e["key"] for e in beekeeper.get(f"{API}/calendar", params={"days": 365}).json()["entries"]}

    assert ENTRY_KEY not in keys
    assert keys, "the rest of the year is still there"


def test_a_day_count_cannot_be_approved_for_a_proposal_to_hide(admin_client):
    from tests.conftest import TestingSession

    db = TestingSession()
    try:
        row = YearProposal(entry_key=ENTRY_KEY, kind="hide", rating_count=5, latitude=53.6,
                           longitude=10.0, radius_km=150, status="pending")
        db.add(row)
        db.commit()
        proposal_id = row.id
    finally:
        db.close()

    response = admin_client.post(
        f"{API}/admin/year-proposals/{proposal_id}/approve", json={"shift_days": -5}
    )

    assert response.status_code == 400


def test_deciding_on_a_proposal_that_does_not_exist_says_so(admin_client):
    assert admin_client.post(f"{API}/admin/year-proposals/nope/approve", json={}).status_code == 404
    assert admin_client.post(f"{API}/admin/year-proposals/nope/reject").status_code == 404
