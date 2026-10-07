"""Moving hives between apiaries: the journey of a migratory beekeeper.

Real accounts and the real routes. Only the address lookup is replaced, because it asks a public service.
"""
from datetime import date, timedelta
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app.models import Apiary, Hive, HiveMove
from app.routers import moves as moves_router
from app.utils.geocoding import CityLocation
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


@pytest.fixture
def world(client, monkeypatch):
    """Alice has "Home" (48.1, 8.0) with three hives; Bob and Carol have accounts."""
    looked_up = []

    def fake_lookup(address):
        looked_up.append(address)
        return CityLocation(name=address, latitude=47.95, longitude=8.15) if address == "Titisee" else None

    monkeypatch.setattr(moves_router, "forward_geocode", fake_lookup)
    alice = _beekeeper(client, "alice@example.com", "Alice")
    bob = _beekeeper(client, "bob@example.com", "Bob")
    carol = _beekeeper(client, "carol@example.com", "Carol")
    home = alice.post(f"{API}/apiaries", json={"name": "Home", "latitude": 48.1, "longitude": 8.0}).json()
    hives = [
        alice.post(f"{API}/apiaries/{home['id']}/hives", json={"name": f"Hive {n}", "hive_type": "langstroth"}).json()
        for n in (1, 2, 3)
    ]
    return SimpleNamespace(alice=alice, bob=bob, carol=carol, home=home, hives=hives, looked_up=looked_up)


def _move(client, hive_ids, **body):
    return client.post(f"{API}/hives/move", json={"hive_ids": hive_ids, **body})


def _ids(hives):
    return [h["id"] for h in hives]


# -- moving to an apiary that exists ----------------------------------------------------------

def test_hives_move_together_to_an_existing_apiary(world):
    heath = world.alice.post(f"{API}/apiaries", json={"name": "Heath", "latitude": 48.5, "longitude": 9.0}).json()

    r = _move(world.alice, _ids(world.hives[:2]), to_apiary_id=heath["id"], moved_on="2026-05-12", forage="acacia")

    assert r.status_code == 201
    body = r.json()
    assert body["moved"] == 2
    assert body["apiary"]["id"] == heath["id"] and body["apiary"]["hive_count"] == 2
    for hive in world.hives[:2]:
        assert world.alice.get(f"{API}/hives/{hive['id']}").json()["apiary_id"] == heath["id"]
    assert world.alice.get(f"{API}/hives/{world.hives[2]['id']}").json()["apiary_id"] == world.home["id"]
    first = body["moves"][0]
    assert (first["moved_on"], first["forage"]) == ("2026-05-12", "acacia")
    assert first["from"] == {"apiary_id": world.home["id"], "name": "Home", "latitude": 48.1, "longitude": 8.0}
    assert first["to"]["name"] == "Heath" and first["to"]["latitude"] == 48.5


def test_the_home_apiary_counts_what_is_left(world):
    heath = world.alice.post(f"{API}/apiaries", json={"name": "Heath"}).json()

    _move(world.alice, _ids(world.hives[:2]), to_apiary_id=heath["id"])

    home = world.alice.get(f"{API}/apiaries/{world.home['id']}").json()
    assert home["hive_count"] == 1


def test_the_date_defaults_to_today_and_the_note_is_kept(world):
    heath = world.alice.post(f"{API}/apiaries", json={"name": "Heath"}).json()

    move = _move(world.alice, [world.hives[0]["id"]], to_apiary_id=heath["id"], note="  early bloom  ").json()["moves"][0]

    assert move["moved_on"] == date.today().isoformat()
    assert move["note"] == "early bloom"
    assert move["forage"] is None
    assert move["created_by_name"] == "Alice"


def test_hives_already_in_the_target_are_left_alone(world):
    heath = world.alice.post(f"{API}/apiaries", json={"name": "Heath"}).json()
    _move(world.alice, [world.hives[0]["id"]], to_apiary_id=heath["id"])

    r = _move(world.alice, [world.hives[0]["id"], world.hives[1]["id"]], to_apiary_id=heath["id"])

    assert r.json()["moved"] == 1
    assert [m["hive_name"] for m in r.json()["moves"]] == ["Hive 2"]


def test_moving_hives_that_are_all_there_already_is_refused(world):
    r = _move(world.alice, _ids(world.hives), to_apiary_id=world.home["id"])

    assert r.status_code == 400
    assert r.json()["detail"]["code"] == "NOTHING_TO_MOVE"
    assert world.alice.get(f"{API}/hives/{world.hives[0]['id']}/moves").json() == []


def test_a_hive_listed_twice_moves_once(world):
    heath = world.alice.post(f"{API}/apiaries", json={"name": "Heath"}).json()
    hive_id = world.hives[0]["id"]

    r = _move(world.alice, [hive_id, hive_id], to_apiary_id=heath["id"])

    assert r.json()["moved"] == 1


# -- moving to a new apiary ---------------------------------------------------------------------

def test_a_new_apiary_is_made_for_the_move(world):
    r = _move(world.alice, _ids(world.hives), new_apiary={"name": " Black Forest ", "latitude": 47.9, "longitude": 8.1},
              forage="fir")

    assert r.status_code == 201
    apiary = r.json()["apiary"]
    assert apiary["name"] == "Black Forest" and apiary["hive_count"] == 3 and apiary["access"] == "owner"
    assert world.alice.get(f"{API}/apiaries/{apiary['id']}").status_code == 200


def test_an_address_without_coordinates_is_looked_up(world):
    r = _move(world.alice, [world.hives[0]["id"]], new_apiary={"name": "Lake", "address": "Titisee"})

    move = r.json()["moves"][0]
    assert world.looked_up == ["Titisee"]
    assert (move["to"]["latitude"], move["to"]["longitude"]) == (47.95, 8.15)
    assert r.json()["apiary"]["latitude"] == 47.95


def test_given_coordinates_are_not_looked_up(world):
    _move(world.alice, [world.hives[0]["id"]],
          new_apiary={"name": "Lake", "address": "Titisee", "latitude": 47.0, "longitude": 8.0})

    assert world.looked_up == []


def test_a_failed_lookup_still_moves_the_hive_just_without_a_position(world):
    r = _move(world.alice, [world.hives[0]["id"]], new_apiary={"name": "Nowhere", "address": "Unknown road"})

    assert r.status_code == 201
    assert r.json()["moves"][0]["to"]["latitude"] is None


def test_an_existing_apiary_with_only_an_address_gets_its_position_when_it_is_the_target(world):
    lake = world.alice.post(f"{API}/apiaries", json={"name": "Lake", "address": "Titisee"}).json()

    move = _move(world.alice, [world.hives[0]["id"]], to_apiary_id=lake["id"]).json()["moves"][0]

    assert move["to"]["latitude"] == 47.95


# -- what has to be sent --------------------------------------------------------------------------

def test_exactly_one_target_is_required(world):
    heath = world.alice.post(f"{API}/apiaries", json={"name": "Heath"}).json()
    ids = _ids(world.hives)

    assert _move(world.alice, ids).status_code == 422
    assert _move(world.alice, ids, to_apiary_id=heath["id"], new_apiary={"name": "X"}).status_code == 422


def test_at_least_one_hive_is_required(world):
    assert _move(world.alice, [], new_apiary={"name": "X"}).status_code == 422


def test_a_move_cannot_lie_in_the_future(world):
    tomorrow_plus = (date.today() + timedelta(days=3)).isoformat()

    assert _move(world.alice, [world.hives[0]["id"]], new_apiary={"name": "X"}, moved_on=tomorrow_plus).status_code == 422
    # A day of slack for time zones.
    soon = (date.today() + timedelta(days=1)).isoformat()
    assert _move(world.alice, [world.hives[0]["id"]], new_apiary={"name": "X"}, moved_on=soon).status_code == 201


def test_a_move_in_the_past_is_fine(world):
    r = _move(world.alice, [world.hives[0]["id"]], new_apiary={"name": "X"}, moved_on="2025-05-01")

    assert r.status_code == 201


# -- all or nothing, and only the owner -------------------------------------------------------------

def test_a_hive_that_does_not_exist_stops_the_whole_move(world):
    heath = world.alice.post(f"{API}/apiaries", json={"name": "Heath"}).json()

    r = _move(world.alice, [world.hives[0]["id"], "no-such-hive"], to_apiary_id=heath["id"])

    assert r.status_code == 404
    assert world.alice.get(f"{API}/hives/{world.hives[0]['id']}").json()["apiary_id"] == world.home["id"]


def test_a_stranger_cannot_move_somebody_elses_hives(world):
    r = _move(world.carol, [world.hives[0]["id"]], new_apiary={"name": "X"})

    assert r.status_code == 404
    assert world.alice.get(f"{API}/hives/{world.hives[0]['id']}").json()["apiary_id"] == world.home["id"]


def test_a_collaborator_cannot_move_hives_they_can_only_work_on(world):
    world.alice.post(f"{API}/shares", json={"email": "bob@example.com", "apiary_id": world.home["id"]})
    for invitation in world.bob.get(f"{API}/shares/incoming").json():
        world.bob.post(f"{API}/shares/{invitation['id']}/accept")

    r = _move(world.bob, [world.hives[0]["id"]], new_apiary={"name": "X"})

    assert r.status_code == 403
    assert r.json()["detail"]["code"] == "OWNER_ONLY"


def test_one_hive_the_caller_cannot_move_stops_the_whole_move(world):
    elsewhere = world.carol.post(f"{API}/apiaries", json={"name": "Carol's"}).json()
    theirs = world.carol.post(f"{API}/apiaries/{elsewhere['id']}/hives", json={"name": "C1", "hive_type": "dadant"}).json()

    r = _move(world.alice, [world.hives[0]["id"], theirs["id"]], new_apiary={"name": "X"})

    assert r.status_code == 404
    assert world.alice.get(f"{API}/hives/{world.hives[0]['id']}").json()["apiary_id"] == world.home["id"]


def test_the_target_must_be_the_callers_own(world):
    carols = world.carol.post(f"{API}/apiaries", json={"name": "Carol's"}).json()

    r = _move(world.alice, [world.hives[0]["id"]], to_apiary_id=carols["id"])

    assert r.status_code == 404


def test_a_shared_apiary_is_not_a_target_for_a_collaborator_who_does_not_own_it(world):
    world.alice.post(f"{API}/shares", json={"email": "bob@example.com", "apiary_id": world.home["id"]})
    for invitation in world.bob.get(f"{API}/shares/incoming").json():
        world.bob.post(f"{API}/shares/{invitation['id']}/accept")
    bobs = world.bob.post(f"{API}/apiaries", json={"name": "Bob's"}).json()
    bobs_hive = world.bob.post(f"{API}/apiaries/{bobs['id']}/hives", json={"name": "B1", "hive_type": "dadant"}).json()

    r = _move(world.bob, [bobs_hive["id"]], to_apiary_id=world.home["id"])

    assert r.status_code == 403


# -- the history ------------------------------------------------------------------------------------

def test_a_hive_remembers_every_move_newest_first(world):
    heath = world.alice.post(f"{API}/apiaries", json={"name": "Heath", "latitude": 48.5, "longitude": 9.0}).json()
    hive_id = world.hives[0]["id"]
    _move(world.alice, [hive_id], to_apiary_id=heath["id"], moved_on="2026-05-12", forage="acacia")
    _move(world.alice, [hive_id], new_apiary={"name": "Forest", "latitude": 47.9, "longitude": 8.1},
          moved_on="2026-06-14", forage="fir")
    _move(world.alice, [hive_id], to_apiary_id=world.home["id"], moved_on="2026-08-01")

    history = world.alice.get(f"{API}/hives/{hive_id}/moves").json()

    assert [(m["moved_on"], m["from"]["name"], m["to"]["name"]) for m in history] == [
        ("2026-08-01", "Forest", "Home"),
        ("2026-06-14", "Heath", "Forest"),
        ("2026-05-12", "Home", "Heath"),
    ]
    assert history[1]["forage"] == "fir"


def test_a_hive_that_never_moved_has_no_history(world):
    assert world.alice.get(f"{API}/hives/{world.hives[0]['id']}/moves").json() == []


def test_the_history_survives_renaming_and_moving_an_apiary(world):
    heath = world.alice.post(f"{API}/apiaries", json={"name": "Heath", "latitude": 48.5, "longitude": 9.0}).json()
    _move(world.alice, [world.hives[0]["id"]], to_apiary_id=heath["id"])

    world.alice.put(f"{API}/apiaries/{heath['id']}", json={"name": "Renamed", "latitude": 10.0, "longitude": 10.0})

    move = world.alice.get(f"{API}/hives/{world.hives[0]['id']}/moves").json()[0]
    assert move["to"]["name"] == "Heath" and move["to"]["latitude"] == 48.5


def test_the_history_survives_deleting_an_apiary(world, db_session):
    forest = _move(world.alice, [world.hives[0]["id"]], new_apiary={"name": "Forest", "latitude": 47.9, "longitude": 8.1}).json()
    _move(world.alice, [world.hives[0]["id"]], to_apiary_id=world.home["id"])

    assert world.alice.delete(f"{API}/apiaries/{forest['apiary']['id']}").status_code == 204

    older = world.alice.get(f"{API}/hives/{world.hives[0]['id']}/moves").json()[-1]
    assert older["to"]["apiary_id"] is None and older["to"]["name"] == "Forest"
    assert older["to"]["latitude"] == 47.9


def test_deleting_a_hive_deletes_its_history(world, db_session):
    _move(world.alice, [world.hives[0]["id"]], new_apiary={"name": "Forest"})

    world.alice.delete(f"{API}/hives/{world.hives[0]['id']}")

    assert db_session.query(HiveMove).count() == 0


def test_a_collaborator_sees_the_history_of_a_hive_they_can_see(world):
    _move(world.alice, [world.hives[0]["id"]], new_apiary={"name": "Forest", "latitude": 47.9, "longitude": 8.1})
    world.alice.post(f"{API}/shares", json={"email": "bob@example.com", "hive_id": world.hives[0]["id"]})
    for invitation in world.bob.get(f"{API}/shares/incoming").json():
        world.bob.post(f"{API}/shares/{invitation['id']}/accept")

    assert len(world.bob.get(f"{API}/hives/{world.hives[0]['id']}/moves").json()) == 1
    assert world.carol.get(f"{API}/hives/{world.hives[0]['id']}/moves").status_code == 404


def test_a_hive_shared_on_its_own_stays_shared_after_it_moves(world):
    world.alice.post(f"{API}/shares", json={"email": "bob@example.com", "hive_id": world.hives[0]["id"]})
    for invitation in world.bob.get(f"{API}/shares/incoming").json():
        world.bob.post(f"{API}/shares/{invitation['id']}/accept")

    _move(world.alice, [world.hives[0]["id"]], new_apiary={"name": "Forest"})

    assert world.bob.get(f"{API}/hives/{world.hives[0]['id']}").status_code == 200


def test_a_hive_leaving_an_apiary_shared_as_a_whole_leaves_the_share_behind(world):
    world.alice.post(f"{API}/shares", json={"email": "bob@example.com", "apiary_id": world.home["id"]})
    for invitation in world.bob.get(f"{API}/shares/incoming").json():
        world.bob.post(f"{API}/shares/{invitation['id']}/accept")

    _move(world.alice, [world.hives[0]["id"]], new_apiary={"name": "Forest"})

    assert world.bob.get(f"{API}/hives/{world.hives[0]['id']}").status_code == 404
    assert world.bob.get(f"{API}/hives/{world.hives[1]['id']}").status_code == 200


# -- the overview for the map of all journeys ----------------------------------------------------------

def test_the_overview_has_every_move_of_every_owned_hive(world):
    _move(world.alice, [world.hives[0]["id"]], new_apiary={"name": "A", "latitude": 1, "longitude": 1}, moved_on="2026-05-01")
    _move(world.alice, [world.hives[1]["id"]], new_apiary={"name": "B", "latitude": 2, "longitude": 2}, moved_on="2026-06-01")

    overview = world.alice.get(f"{API}/hives/moves/overview").json()

    assert [(m["hive_name"], m["to"]["name"]) for m in overview] == [("Hive 2", "B"), ("Hive 1", "A")]


def test_the_overview_can_be_limited_by_date(world):
    _move(world.alice, [world.hives[0]["id"]], new_apiary={"name": "A"}, moved_on="2026-05-01")
    _move(world.alice, [world.hives[1]["id"]], new_apiary={"name": "B"}, moved_on="2026-06-01")
    _move(world.alice, [world.hives[2]["id"]], new_apiary={"name": "C"}, moved_on="2026-07-01")

    overview = world.alice.get(f"{API}/hives/moves/overview?from=2026-06-01&to=2026-06-30").json()

    assert [m["to"]["name"] for m in overview] == ["B"]


def test_the_overview_holds_only_the_callers_own_hives(world):
    _move(world.alice, [world.hives[0]["id"]], new_apiary={"name": "A"})
    world.alice.post(f"{API}/shares", json={"email": "bob@example.com", "apiary_id": world.home["id"]})
    for invitation in world.bob.get(f"{API}/shares/incoming").json():
        world.bob.post(f"{API}/shares/{invitation['id']}/accept")

    assert world.bob.get(f"{API}/hives/moves/overview").json() == []
    assert world.carol.get(f"{API}/hives/moves/overview").json() == []
    assert len(world.alice.get(f"{API}/hives/moves/overview").json()) == 1


# -- leaving ------------------------------------------------------------------------------------------

def test_what_an_owner_moved_is_handed_over_with_the_apiary(world):
    world.alice.post(f"{API}/shares", json={"email": "bob@example.com", "apiary_id": world.home["id"]})
    for invitation in world.bob.get(f"{API}/shares/incoming").json():
        world.bob.post(f"{API}/shares/{invitation['id']}/accept")
    spare = world.alice.post(f"{API}/apiaries", json={"name": "Spare"}).json()
    _move(world.alice, [world.hives[0]["id"]], to_apiary_id=spare["id"], moved_on="2026-08-01")
    _move(world.alice, [world.hives[0]["id"]], to_apiary_id=world.home["id"], moved_on="2026-09-01")

    world.alice.delete(f"{API}/users/me")

    history = world.bob.get(f"{API}/hives/{world.hives[0]['id']}/moves").json()
    assert len(history) == 2 and history[0]["created_by_name"] is None
