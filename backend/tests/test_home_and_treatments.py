"""The home summary and the planned treatments.

Real accounts and the real routes; inspections are made through the API with the dates a beekeeper would
type, so "due in three days" is tested as the beekeeper would meet it.
"""
from datetime import date, timedelta
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.models import Hive, PlannedTreatment
from main import app

API = "/api/v1"


def _beekeeper(client, email, name):
    client.post(f"{API}/auth/register", json={
        "email": email, "password": "password123", "name": name, "locale": "en",
    })
    token = client.post(f"{API}/auth/login", json={"email": email, "password": "password123"}).json()["access_token"]
    c = TestClient(app)
    c.headers.update({"Authorization": f"Bearer {token}"})
    return c


def _day(offset: int) -> str:
    return (date.today() + timedelta(days=offset)).isoformat()


@pytest.fixture
def world(client):
    """Alice has the apiary "Garden" with Hive 1 and Hive 2. Bob and Carol have accounts."""
    alice = _beekeeper(client, "alice@example.com", "Alice")
    bob = _beekeeper(client, "bob@example.com", "Bob")
    carol = _beekeeper(client, "carol@example.com", "Carol")
    apiary = alice.post(f"{API}/apiaries", json={"name": "Garden"}).json()
    h1 = alice.post(f"{API}/apiaries/{apiary['id']}/hives", json={"name": "Hive 1", "hive_type": "langstroth"}).json()
    h2 = alice.post(f"{API}/apiaries/{apiary['id']}/hives", json={"name": "Hive 2", "hive_type": "langstroth"}).json()
    return SimpleNamespace(alice=alice, bob=bob, carol=carol, apiary=apiary, h1=h1, h2=h2)


def _inspect(client, hive, on, **fields):
    r = client.post(f"{API}/hives/{hive['id']}/inspections", json={"date": on, **fields})
    assert r.status_code == 201, r.text
    return r.json()


def _share_apiary(w, grantee):
    w.alice.post(f"{API}/shares", json={"email": "bob@example.com", "apiary_id": w.apiary["id"]})
    for invitation in grantee.get(f"{API}/shares/incoming").json():
        grantee.post(f"{API}/shares/{invitation['id']}/accept")


def _share_hive(w, grantee, hive):
    w.alice.post(f"{API}/shares", json={"email": "bob@example.com", "hive_id": hive["id"]})
    for invitation in grantee.get(f"{API}/shares/incoming").json():
        grantee.post(f"{API}/shares/{invitation['id']}/accept")


def _plan(client, **body):
    return client.post(f"{API}/treatments", json=body)


def _home(client):
    r = client.get(f"{API}/home")
    assert r.status_code == 200, r.text
    return r.json()


# -- planning a treatment ---------------------------------------------------------------------------

def test_a_treatment_for_a_hive_is_planned_and_listed(world):
    r = _plan(world.alice, hive_id=world.h1["id"], product=" Formic acid 60% ", due_on=_day(10), note=" evening ")

    assert r.status_code == 201
    body = r.json()
    assert body["product"] == "Formic acid 60%" and body["note"] == "evening"
    assert body["target"] == {"type": "hive", "id": world.h1["id"], "name": "Hive 1"}
    assert body["apiary_name"] == "Garden"
    assert body["done_on"] is None and body["overdue"] is False and body["created_by_name"] == "Alice"
    assert [t["id"] for t in world.alice.get(f"{API}/treatments").json()] == [body["id"]]


def test_a_treatment_can_be_planned_for_a_whole_apiary(world):
    r = _plan(world.alice, apiary_id=world.apiary["id"], product="Oxalic acid", due_on=_day(30))

    assert r.json()["target"]["type"] == "apiary"
    assert r.json()["apiary_name"] is None


def test_exactly_one_target_and_a_product_are_required(world):
    assert _plan(world.alice, product="x", due_on=_day(1)).status_code == 422
    assert _plan(world.alice, hive_id=world.h1["id"], apiary_id=world.apiary["id"], product="x", due_on=_day(1)).status_code == 422
    assert _plan(world.alice, hive_id=world.h1["id"], product="   ", due_on=_day(1)).status_code == 422
    assert _plan(world.alice, hive_id=world.h1["id"], product="x").status_code == 422


def test_open_treatments_are_ordered_by_the_day_they_are_due(world):
    _plan(world.alice, hive_id=world.h1["id"], product="late", due_on=_day(20))
    _plan(world.alice, hive_id=world.h2["id"], product="early", due_on=_day(2))

    assert [t["product"] for t in world.alice.get(f"{API}/treatments").json()] == ["early", "late"]


def test_the_list_can_be_limited_to_a_hive_or_an_apiary(world):
    _plan(world.alice, hive_id=world.h1["id"], product="one", due_on=_day(5))
    _plan(world.alice, hive_id=world.h2["id"], product="two", due_on=_day(5))
    _plan(world.alice, apiary_id=world.apiary["id"], product="all", due_on=_day(5))

    assert [t["product"] for t in world.alice.get(f"{API}/treatments?hive_id={world.h1['id']}").json()] == ["one"]
    assert [t["product"] for t in world.alice.get(f"{API}/treatments?apiary_id={world.apiary['id']}").json()] == ["all"]


def test_an_open_treatment_in_the_past_is_overdue(world):
    r = _plan(world.alice, hive_id=world.h1["id"], product="late", due_on=_day(-3))

    assert r.json()["overdue"] is True


# -- doing it, undoing it, changing it ---------------------------------------------------------------

def test_a_treatment_is_marked_done_today_with_no_body(world):
    t = _plan(world.alice, hive_id=world.h1["id"], product="x", due_on=_day(-3)).json()

    r = world.alice.post(f"{API}/treatments/{t['id']}/done")

    assert r.status_code == 200
    assert r.json()["done_on"] == _day(0) and r.json()["overdue"] is False
    assert world.alice.get(f"{API}/treatments").json() == []
    assert [x["id"] for x in world.alice.get(f"{API}/treatments?status=done").json()] == [t["id"]]


def test_it_can_be_done_on_another_day_but_not_in_the_future(world):
    t = _plan(world.alice, hive_id=world.h1["id"], product="x", due_on=_day(-3)).json()

    assert world.alice.post(f"{API}/treatments/{t['id']}/done", json={"done_on": _day(-2)}).json()["done_on"] == _day(-2)
    assert world.alice.post(f"{API}/treatments/{t['id']}/done", json={"done_on": _day(5)}).status_code == 422


def test_a_done_treatment_can_be_reopened(world):
    t = _plan(world.alice, hive_id=world.h1["id"], product="x", due_on=_day(4)).json()
    world.alice.post(f"{API}/treatments/{t['id']}/done")

    r = world.alice.post(f"{API}/treatments/{t['id']}/reopen")

    assert r.json()["done_on"] is None
    assert len(world.alice.get(f"{API}/treatments").json()) == 1


def test_the_product_the_day_and_the_note_can_be_changed(world):
    t = _plan(world.alice, hive_id=world.h1["id"], product="x", due_on=_day(4), note="n").json()

    r = world.alice.put(f"{API}/treatments/{t['id']}", json={"product": " Thymol ", "due_on": _day(9), "note": ""})

    assert (r.json()["product"], r.json()["due_on"], r.json()["note"]) == ("Thymol", _day(9), None)
    assert world.alice.put(f"{API}/treatments/{t['id']}", json={"product": "  "}).status_code in (422,)


def test_a_treatment_can_be_deleted(world):
    t = _plan(world.alice, hive_id=world.h1["id"], product="x", due_on=_day(4)).json()

    assert world.alice.delete(f"{API}/treatments/{t['id']}").status_code == 204
    assert world.alice.get(f"{API}/treatments").json() == []
    assert world.alice.delete(f"{API}/treatments/{t['id']}").status_code == 404


def test_a_treatment_of_somebody_else_is_not_there(world):
    t = _plan(world.alice, hive_id=world.h1["id"], product="x", due_on=_day(4)).json()

    assert world.carol.get(f"{API}/treatments").json() == []
    assert world.carol.put(f"{API}/treatments/{t['id']}", json={"product": "y"}).status_code == 404
    assert world.carol.post(f"{API}/treatments/{t['id']}/done").status_code == 404
    assert world.carol.delete(f"{API}/treatments/{t['id']}").status_code == 404
    assert _plan(world.carol, hive_id=world.h1["id"], product="x", due_on=_day(1)).status_code == 404


# -- together with another beekeeper ------------------------------------------------------------------

def test_a_collaborator_plans_and_does_treatments_on_a_shared_apiary(world):
    _share_apiary(world, world.bob)

    planned = _plan(world.bob, apiary_id=world.apiary["id"], product="Oxalic acid", due_on=_day(5))
    assert planned.status_code == 201
    assert world.alice.get(f"{API}/treatments").json()[0]["created_by_name"] == "Bob"
    assert world.bob.post(f"{API}/treatments/{planned.json()['id']}/done").status_code == 200


def test_somebody_with_one_hive_plans_for_that_hive_only(world):
    _share_hive(world, world.bob, world.h1)

    assert _plan(world.bob, hive_id=world.h1["id"], product="x", due_on=_day(3)).status_code == 201
    assert _plan(world.bob, hive_id=world.h2["id"], product="x", due_on=_day(3)).status_code == 404
    refused = _plan(world.bob, apiary_id=world.apiary["id"], product="x", due_on=_day(3))
    assert refused.status_code == 403 and refused.json()["detail"]["code"] == "OWNER_ONLY"


def test_somebody_with_one_hive_does_not_see_the_plans_of_the_whole_apiary(world):
    _plan(world.alice, apiary_id=world.apiary["id"], product="for all", due_on=_day(3))
    _plan(world.alice, hive_id=world.h1["id"], product="for one", due_on=_day(3))
    _plan(world.alice, hive_id=world.h2["id"], product="for two", due_on=_day(3))
    _share_hive(world, world.bob, world.h1)

    assert [t["product"] for t in world.bob.get(f"{API}/treatments").json()] == ["for one"]


def test_a_treatment_goes_with_its_hive_when_the_hive_moves(world):
    t = _plan(world.alice, hive_id=world.h1["id"], product="x", due_on=_day(3)).json()

    world.alice.post(f"{API}/hives/move", json={"hive_ids": [world.h1["id"]], "new_apiary": {"name": "Forest"}})

    assert world.alice.get(f"{API}/treatments").json()[0]["apiary_name"] == "Forest"
    assert world.alice.get(f"{API}/treatments").json()[0]["id"] == t["id"]


def test_deleting_a_hive_or_an_apiary_deletes_its_treatments(world, db_session):
    _plan(world.alice, hive_id=world.h1["id"], product="x", due_on=_day(3))
    empty = world.alice.post(f"{API}/apiaries", json={"name": "Empty"}).json()
    _plan(world.alice, apiary_id=empty["id"], product="y", due_on=_day(3))

    world.alice.delete(f"{API}/hives/{world.h1['id']}")
    world.alice.delete(f"{API}/apiaries/{empty['id']}")

    assert db_session.query(PlannedTreatment).count() == 0


def test_the_treatments_of_what_an_owner_hands_over_stay(world):
    _share_apiary(world, world.bob)
    _plan(world.alice, hive_id=world.h1["id"], product="x", due_on=_day(3))

    world.alice.delete(f"{API}/users/me")

    assert [t["product"] for t in world.bob.get(f"{API}/treatments").json()] == ["x"]


# -- the home summary: inspections -----------------------------------------------------------------------

def test_a_beekeeper_with_nothing_gets_an_empty_summary(client):
    nobody = _beekeeper(client, "new@example.com", "New")

    home = _home(nobody)

    assert (home["apiary_count"], home["hive_count"]) == (0, 0)
    assert home["inspections"]["next"] == [] and home["health"]["attention"] == []
    assert home["treatments"]["upcoming"] == [] and home["ad"] is None


def test_a_hive_is_due_the_reminder_interval_after_its_last_inspection(world):
    _inspect(world.alice, world.h1, _day(-10))     # default interval is 7 days: due 3 days ago
    _inspect(world.alice, world.h2, _day(-2))      # due in 5 days

    inspections = _home(world.alice)["inspections"]

    assert inspections["interval_days"] == 7
    assert [(n["hive_name"], n["due_on"], n["overdue_days"]) for n in inspections["next"]] == [
        ("Hive 1", _day(-3), 3), ("Hive 2", _day(5), 0),
    ]
    assert inspections["next"][0]["last_inspection_on"] == _day(-10)
    assert inspections["overdue_count"] == 1


def test_due_soon_means_within_three_days(world):
    _inspect(world.alice, world.h1, _day(-5))      # due in 2 days
    _inspect(world.alice, world.h2, _day(-1))      # due in 6 days

    assert _home(world.alice)["inspections"]["due_soon_count"] == 1


def test_the_users_own_interval_is_used(world):
    world.alice.put(f"{API}/users/me/reminder", json={"reminder_interval_days": 14})
    _inspect(world.alice, world.h1, _day(-10))

    inspections = _home(world.alice)["inspections"]

    assert inspections["interval_days"] == 14
    assert inspections["next"][0]["due_on"] == _day(4) and inspections["overdue_count"] == 0


def test_the_day_entered_counts_not_the_day_it_was_typed_in(world):
    _inspect(world.alice, world.h1, _day(-30))     # recorded today for a visit a month ago
    _inspect(world.alice, world.h1, _day(-1))

    assert _home(world.alice)["inspections"]["next"][0]["last_inspection_on"] == _day(-1)


def test_a_hive_never_inspected_is_due_the_interval_after_it_was_made(world):
    inspections = _home(world.alice)["inspections"]

    # Both hives were made just now, so they are due a week from today and not overdue.
    assert {n["due_on"] for n in inspections["next"]} == {_day(7)}
    assert inspections["overdue_count"] == 0
    assert all(n["last_inspection_on"] is None for n in inspections["next"])


def test_only_the_five_that_are_due_soonest_are_listed(world):
    for n in range(3, 9):
        world.alice.post(f"{API}/apiaries/{world.apiary['id']}/hives", json={"name": f"Hive {n}", "hive_type": "dadant"})

    home = _home(world.alice)

    assert home["hive_count"] == 8
    assert len(home["inspections"]["next"]) == 5


def test_the_season_flag_follows_the_users_reminder_season(world):
    month = date.today().month
    world.alice.put(f"{API}/users/me/reminder", json={"reminder_season_start": month, "reminder_season_end": month})
    assert _home(world.alice)["in_season"] is True

    other = month % 12 + 1
    world.alice.put(f"{API}/users/me/reminder", json={"reminder_season_start": other, "reminder_season_end": other})
    assert _home(world.alice)["in_season"] is False


# -- the home summary: health ------------------------------------------------------------------------------

def test_the_health_of_each_hive_is_read_from_its_latest_inspection(world):
    _inspect(world.alice, world.h1, _day(-1), varroa_level=3)
    _inspect(world.alice, world.h2, _day(-1), varroa_level=0, mood="calm", queen_seen=True)

    health = _home(world.alice)["health"]

    assert (health["ok"], health["watch"], health["alert"], health["unknown"]) == (1, 0, 1, 0)
    assert health["attention"] == [
        {"hive_id": world.h1["id"], "hive_name": "Hive 1", "apiary_name": "Garden",
         "status": "alert", "reasons": ["varroa_high"]},
    ]


@pytest.mark.parametrize("fields,status,reasons", [
    ({"varroa_level": 3}, "alert", ["varroa_high"]),
    ({"swarm_cells_seen": True}, "alert", ["swarm_cells"]),
    ({"mood": "aggressive"}, "alert", ["aggressive"]),
    ({"varroa_level": 2}, "watch", ["varroa_medium"]),
    ({"mood": "nervous"}, "watch", ["nervous"]),
    ({"queen_seen": False}, "watch", ["queen_not_seen"]),
    ({"varroa_level": 3, "mood": "nervous"}, "alert", ["varroa_high", "nervous"]),
    ({"varroa_level": 1, "mood": "calm", "queen_seen": True}, "ok", []),
    ({}, "ok", []),
])
def test_what_makes_a_hive_a_cause_for_concern(world, fields, status, reasons):
    _inspect(world.alice, world.h1, _day(-1), **fields)

    health = _home(world.alice)["health"]

    if status == "ok":
        assert health["attention"] == []
    else:
        assert (health["attention"][0]["status"], health["attention"][0]["reasons"]) == (status, reasons)


def test_only_the_latest_inspection_counts_for_the_health(world):
    _inspect(world.alice, world.h1, _day(-9), varroa_level=3)
    _inspect(world.alice, world.h1, _day(-1), varroa_level=0)

    assert _home(world.alice)["health"]["attention"] == []


def test_a_hive_never_inspected_is_unknown_not_healthy(world):
    health = _home(world.alice)["health"]

    assert health["unknown"] == 2 and health["ok"] == 0


def test_alerts_come_before_watches(world):
    _inspect(world.alice, world.h1, _day(-1), mood="nervous")
    _inspect(world.alice, world.h2, _day(-1), varroa_level=3)

    attention = _home(world.alice)["health"]["attention"]

    assert [(a["hive_name"], a["status"]) for a in attention] == [("Hive 2", "alert"), ("Hive 1", "watch")]


# -- the home summary: treatments, sharing and the announcement ------------------------------------------------------

def test_the_summary_lists_what_is_open_and_what_is_overdue(world):
    _plan(world.alice, hive_id=world.h1["id"], product="late", due_on=_day(-2))
    _plan(world.alice, hive_id=world.h2["id"], product="soon", due_on=_day(10))
    _plan(world.alice, apiary_id=world.apiary["id"], product="far", due_on=_day(90))
    done = _plan(world.alice, hive_id=world.h1["id"], product="done", due_on=_day(-5)).json()
    world.alice.post(f"{API}/treatments/{done['id']}/done")

    treatments = _home(world.alice)["treatments"]

    assert (treatments["open_count"], treatments["overdue_count"]) == (3, 1)
    # Overdue first, then by day; the one 90 days away is open but not shown as upcoming.
    assert [t["product"] for t in treatments["upcoming"]] == ["late", "soon"]


def test_a_collaborator_sees_the_shared_hives_in_their_own_summary(world):
    _share_apiary(world, world.bob)
    _inspect(world.alice, world.h1, _day(-1), varroa_level=3)
    _plan(world.alice, hive_id=world.h1["id"], product="x", due_on=_day(3))

    home = _home(world.bob)

    assert (home["apiary_count"], home["hive_count"]) == (1, 2)
    assert home["health"]["alert"] == 1
    assert home["treatments"]["open_count"] == 1


def test_somebody_with_one_hive_sees_only_that_hive_in_the_summary(world):
    _inspect(world.alice, world.h1, _day(-1), varroa_level=3)
    _inspect(world.alice, world.h2, _day(-1), varroa_level=3)
    _share_hive(world, world.bob, world.h1)

    home = _home(world.bob)

    assert home["hive_count"] == 1
    assert [a["hive_name"] for a in home["health"]["attention"]] == ["Hive 1"]


def test_a_stranger_sees_nothing_of_it(world):
    _inspect(world.alice, world.h1, _day(-1), varroa_level=3)

    home = _home(world.carol)

    assert home["hive_count"] == 0 and home["health"]["attention"] == []


def test_there_is_no_announcement_unless_one_is_switched_on(world, monkeypatch):
    assert _home(world.alice)["ad"] is None

    monkeypatch.setattr(settings, "announcement_title", "Honey fair")
    monkeypatch.setattr(settings, "announcement_body", "Saturday in town.")
    monkeypatch.setattr(settings, "announcement_url", "https://example.com/fair")
    monkeypatch.setattr(settings, "announcement_id", "fair-2026")
    monkeypatch.setattr(settings, "announcement_label", "Ad")

    ad = _home(world.alice)["ad"]
    assert ad == {"id": "fair-2026", "label": "Ad", "title": "Honey fair", "body": "Saturday in town.",
                  "url": "https://example.com/fair"}


def test_an_announcement_without_a_link_carries_none(world, monkeypatch):
    monkeypatch.setattr(settings, "announcement_title", "Hello")
    monkeypatch.setattr(settings, "announcement_url", "")

    assert _home(world.alice)["ad"]["url"] is None


def test_the_summary_needs_a_signed_in_user(client):
    assert client.get(f"{API}/home").status_code in (401, 422)
