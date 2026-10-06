"""Two beekeepers working on the same apiary, or on single hives.

These go through the real routes with three real accounts, because the point of sharing is who
gets in and who does not: a mock of the access check would test nothing. Sending the email is
the one thing replaced, so the token in the invitation link can be read back.
"""
import re
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app.models import Apiary, Hive, Inspection, QrToken, Share, User
from app.routers import notifications, shares as shares_router
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
    """Alice owns the apiary "Garden" with two hives; Bob and Carol have accounts."""
    mails = []
    monkeypatch.setattr(shares_router, "send_email",
                        lambda to, subject, html: mails.append(SimpleNamespace(to=to, subject=subject, html=html)))
    alice = _beekeeper(client, "alice@example.com", "Alice")
    bob = _beekeeper(client, "bob@example.com", "Bob")
    carol = _beekeeper(client, "carol@example.com", "Carol")

    apiary = alice.post(f"{API}/apiaries", json={"name": "Garden"}).json()
    h1 = alice.post(f"{API}/apiaries/{apiary['id']}/hives", json={"name": "Hive 1", "hive_type": "langstroth"}).json()
    h2 = alice.post(f"{API}/apiaries/{apiary['id']}/hives", json={"name": "Hive 2", "hive_type": "langstroth"}).json()
    return SimpleNamespace(alice=alice, bob=bob, carol=carol, apiary=apiary, h1=h1, h2=h2, mails=mails)


def _invite(owner, email, **target):
    return owner.post(f"{API}/shares", json={"email": email, **target})


def _accept_all(grantee):
    for incoming in grantee.get(f"{API}/shares/incoming").json():
        assert grantee.post(f"{API}/shares/{incoming['id']}/accept").status_code == 204


def _share_apiary(w, grantee=None, email="bob@example.com"):
    assert _invite(w.alice, email, apiary_id=w.apiary["id"]).status_code == 201
    _accept_all(grantee or w.bob)


def _share_hive(w, hive, grantee=None, email="bob@example.com"):
    assert _invite(w.alice, email, hive_id=hive["id"]).status_code == 201
    _accept_all(grantee or w.bob)


def _inspect(client, hive, **fields):
    body = {"date": "2026-05-01", **fields}
    return client.post(f"{API}/hives/{hive['id']}/inspections", json=body)


def _token_from(mail):
    return re.search(r"token=([\w-]+)", mail.html).group(1)


# -- inviting ---------------------------------------------------------------------------------

def test_an_invitation_to_an_existing_account_waits_for_them(world):
    r = _invite(world.alice, "bob@example.com", apiary_id=world.apiary["id"])

    assert r.status_code == 201
    assert r.json()["status"] == "pending"
    assert r.json()["target"] == {"type": "apiary", "id": world.apiary["id"], "name": "Garden"}
    incoming = world.bob.get(f"{API}/shares/incoming").json()
    assert [(i["owner_name"], i["target"]["name"]) for i in incoming] == [("Alice", "Garden")]


def test_nothing_is_visible_until_the_invitation_is_accepted(world):
    _invite(world.alice, "bob@example.com", apiary_id=world.apiary["id"])

    assert world.bob.get(f"{API}/apiaries/{world.apiary['id']}").status_code == 404
    assert world.bob.get(f"{API}/apiaries").json()["total"] == 0
    assert world.bob.get(f"{API}/hives/{world.h1['id']}").status_code == 404


def test_the_answer_does_not_say_whether_an_account_exists(world):
    known = _invite(world.alice, "bob@example.com", apiary_id=world.apiary["id"])
    unknown = _invite(world.alice, "nobody@example.com", apiary_id=world.apiary["id"])

    assert known.status_code == unknown.status_code == 201
    assert set(known.json()) == set(unknown.json())
    assert known.json()["collaborator_name"] is None and unknown.json()["collaborator_name"] is None
    # Both addresses got the same kind of mail.
    assert sorted(m.to for m in world.mails) == ["bob@example.com", "nobody@example.com"]


def test_the_token_is_in_the_mail_and_never_in_a_response_or_the_table(world, db_session):
    r = _invite(world.alice, "nobody@example.com", apiary_id=world.apiary["id"])

    token = _token_from(world.mails[0])
    assert token not in r.text
    assert token not in world.alice.get(f"{API}/shares?apiary_id={world.apiary['id']}").text
    share = db_session.query(Share).one()
    assert token != share.token_hash and len(share.token_hash) == 64


def test_inviting_yourself_is_refused(world):
    r = _invite(world.alice, "ALICE@example.com", apiary_id=world.apiary["id"])

    assert r.status_code == 400
    assert r.json()["detail"]["code"] == "SHARE_WITH_SELF"


def test_the_same_address_cannot_be_invited_twice_for_the_same_thing(world):
    _invite(world.alice, "bob@example.com", apiary_id=world.apiary["id"])

    r = _invite(world.alice, "Bob@Example.com", apiary_id=world.apiary["id"])

    assert r.status_code == 409
    assert r.json()["detail"]["code"] == "SHARE_ALREADY_EXISTS"


def test_a_target_is_required_and_only_one(world):
    assert _invite(world.alice, "bob@example.com").status_code == 422
    assert _invite(world.alice, "bob@example.com", apiary_id=world.apiary["id"],
                   hive_id=world.h1["id"]).status_code == 422


def test_a_stranger_cannot_invite_to_somebody_elses_apiary(world):
    r = _invite(world.carol, "bob@example.com", apiary_id=world.apiary["id"])

    assert r.status_code == 404


def test_the_owner_sees_who_was_invited_and_who_accepted(world):
    _invite(world.alice, "bob@example.com", apiary_id=world.apiary["id"])
    _invite(world.alice, "carol@example.com", apiary_id=world.apiary["id"])
    _accept_all(world.bob)

    shares = world.alice.get(f"{API}/shares?apiary_id={world.apiary['id']}").json()

    by_email = {s["email"]: s for s in shares}
    assert by_email["bob@example.com"]["status"] == "accepted"
    assert by_email["bob@example.com"]["collaborator_name"] == "Bob"
    assert by_email["carol@example.com"]["status"] == "pending"
    assert by_email["carol@example.com"]["collaborator_name"] is None


def test_only_the_owner_can_list_the_collaborators(world):
    _share_apiary(world)

    assert world.bob.get(f"{API}/shares?apiary_id={world.apiary['id']}").status_code == 403
    assert world.carol.get(f"{API}/shares?apiary_id={world.apiary['id']}").status_code == 404


def test_accepted_shares_are_not_listed_as_incoming(world):
    _share_apiary(world)

    assert world.bob.get(f"{API}/shares/incoming").json() == []


def test_declining_removes_the_invitation(world):
    _invite(world.alice, "bob@example.com", apiary_id=world.apiary["id"])
    share_id = world.bob.get(f"{API}/shares/incoming").json()[0]["id"]

    assert world.bob.post(f"{API}/shares/{share_id}/decline").status_code == 204

    assert world.bob.get(f"{API}/shares/incoming").json() == []
    assert world.bob.get(f"{API}/apiaries/{world.apiary['id']}").status_code == 404


def test_nobody_else_can_accept_an_invitation(world):
    _invite(world.alice, "bob@example.com", apiary_id=world.apiary["id"])
    share_id = world.bob.get(f"{API}/shares/incoming").json()[0]["id"]

    assert world.carol.post(f"{API}/shares/{share_id}/accept").status_code == 404
    assert world.carol.post(f"{API}/shares/{share_id}/decline").status_code == 404


# -- the token route, for addresses without an account ----------------------------------------

def test_an_invitation_to_an_unknown_address_is_taken_with_the_token(world):
    _invite(world.alice, "nobody@example.com", apiary_id=world.apiary["id"])
    token = _token_from(world.mails[0])

    r = world.carol.post(f"{API}/shares/accept-by-token", json={"token": token})

    assert r.status_code == 200
    assert r.json()["target"]["name"] == "Garden"
    assert world.carol.get(f"{API}/apiaries/{world.apiary['id']}").json()["access"] == "shared"


def test_a_token_works_once(world):
    _invite(world.alice, "nobody@example.com", apiary_id=world.apiary["id"])
    token = _token_from(world.mails[0])
    world.carol.post(f"{API}/shares/accept-by-token", json={"token": token})

    r = world.bob.post(f"{API}/shares/accept-by-token", json={"token": token})

    assert r.status_code == 404
    assert r.json()["detail"]["code"] == "SHARE_TOKEN_INVALID"
    assert world.bob.get(f"{API}/apiaries/{world.apiary['id']}").status_code == 404


def test_an_invitation_made_out_to_an_account_is_not_for_anybody_else(world):
    _invite(world.alice, "bob@example.com", apiary_id=world.apiary["id"])
    token = _token_from(world.mails[0])

    assert world.carol.post(f"{API}/shares/accept-by-token", json={"token": token}).status_code == 404
    assert world.bob.post(f"{API}/shares/accept-by-token", json={"token": token}).status_code == 200


def test_the_owner_cannot_accept_their_own_invitation(world):
    _invite(world.alice, "nobody@example.com", apiary_id=world.apiary["id"])

    r = world.alice.post(f"{API}/shares/accept-by-token", json={"token": _token_from(world.mails[0])})

    assert r.status_code == 404


def test_a_made_up_token_is_refused(world):
    assert world.bob.post(f"{API}/shares/accept-by-token", json={"token": "nope"}).status_code == 404


# -- working together on a whole apiary -------------------------------------------------------

def test_a_collaborator_sees_the_apiary_and_all_its_hives(world):
    _share_apiary(world)

    apiary = world.bob.get(f"{API}/apiaries").json()["items"][0]
    hives = world.bob.get(f"{API}/apiaries/{world.apiary['id']}/hives").json()["items"]

    assert (apiary["access"], apiary["owner_name"], apiary["hive_count"]) == ("shared", "Alice", 2)
    assert sorted(h["name"] for h in hives) == ["Hive 1", "Hive 2"]
    assert {h["access"] for h in hives} == {"shared"}


def test_the_owner_sees_their_own_apiary_as_theirs(world):
    _share_apiary(world)

    apiary = world.alice.get(f"{API}/apiaries/{world.apiary['id']}").json()

    assert (apiary["access"], apiary["owner_name"]) == ("owner", None)


def test_hives_added_later_are_shared_too(world):
    _share_apiary(world)

    world.alice.post(f"{API}/apiaries/{world.apiary['id']}/hives", json={"name": "Hive 3", "hive_type": "dadant"})

    names = [h["name"] for h in world.bob.get(f"{API}/apiaries/{world.apiary['id']}/hives").json()["items"]]
    assert "Hive 3" in names


def test_a_collaborator_records_inspections_and_both_names_show(world):
    _share_apiary(world)

    assert _inspect(world.bob, world.h1, brood_frames=6).status_code == 201
    _inspect(world.alice, world.h1, brood_frames=4)

    listed = world.alice.get(f"{API}/hives/{world.h1['id']}/inspections").json()["items"]
    assert sorted(i["created_by_name"] for i in listed) == ["Alice", "Bob"]


def test_a_collaborator_can_edit_and_delete_inspections_whoever_made_them(world):
    _share_apiary(world)
    inspection = _inspect(world.alice, world.h1, brood_frames=4).json()

    assert world.bob.put(f"{API}/inspections/{inspection['id']}", json={"brood_frames": 7}).status_code == 200
    assert world.bob.delete(f"{API}/inspections/{inspection['id']}").status_code == 204


def test_a_collaborator_edits_hives_and_the_apiary_and_adds_hives(world):
    _share_apiary(world)

    assert world.bob.put(f"{API}/hives/{world.h1['id']}", json={"name": "Renamed"}).status_code == 200
    assert world.bob.put(f"{API}/apiaries/{world.apiary['id']}", json={"name": "Garden 2"}).status_code == 200
    added = world.bob.post(f"{API}/apiaries/{world.apiary['id']}/hives",
                           json={"name": "Bob's hive", "hive_type": "langstroth"})
    assert added.status_code == 201
    # The apiary's owner owns every hive in it, including one a collaborator made.
    assert world.alice.get(f"{API}/hives/{added.json()['id']}").json()["access"] == "owner"


def test_a_collaborator_cannot_delete_the_apiary_or_a_hive(world):
    _share_apiary(world)

    for url in (f"{API}/hives/{world.h1['id']}", f"{API}/apiaries/{world.apiary['id']}"):
        r = world.bob.delete(url)
        assert r.status_code == 403
        assert r.json()["detail"]["code"] == "OWNER_ONLY"
    assert world.alice.get(f"{API}/hives/{world.h1['id']}").status_code == 200


def test_a_collaborator_cannot_put_the_apiary_on_the_public_map(world):
    _share_apiary(world)

    r = world.bob.put(f"{API}/apiaries/{world.apiary['id']}", json={"is_public": True})

    assert r.status_code == 403
    assert world.alice.get(f"{API}/apiaries/{world.apiary['id']}").json()["is_public"] is False


def test_saving_the_apiary_unchanged_is_not_mistaken_for_a_privacy_change(world):
    _share_apiary(world)

    r = world.bob.put(f"{API}/apiaries/{world.apiary['id']}", json={"name": "Garden", "is_public": False})

    assert r.status_code == 200


def test_a_collaborator_cannot_invite_anyone(world):
    _share_apiary(world)

    r = _invite(world.bob, "carol@example.com", apiary_id=world.apiary["id"])

    assert r.status_code == 403


def test_a_collaborator_cannot_move_a_hive_out_of_the_apiary(world):
    _share_apiary(world)
    elsewhere = world.bob.post(f"{API}/apiaries", json={"name": "Bob's own"}).json()

    r = world.bob.put(f"{API}/hives/{world.h1['id']}", json={"apiary_id": elsewhere["id"]})

    assert r.status_code == 403
    assert world.alice.get(f"{API}/hives/{world.h1['id']}").json()["apiary_id"] == world.apiary["id"]


def test_the_owners_scanned_sticker_opens_the_hive_for_a_collaborator(world):
    _share_apiary(world)

    r = world.bob.get(f"{API}/hives/by-qr/{world.h1['qr_token']}")

    assert r.status_code == 200
    assert r.json()["id"] == world.h1["id"]


def test_an_unused_sticker_of_somebody_else_stays_unusable(world):
    _share_apiary(world)
    batch = world.alice.post(f"{API}/qr-batches", json={"count": 1}).json()

    r = world.bob.get(f"{API}/hives/by-qr/{batch['tokens'][0]['token']}")

    assert r.status_code == 404


def test_a_collaborator_sees_the_apiarys_custom_fields_but_not_the_owners_personal_ones(world):
    _share_apiary(world)
    world.alice.post(f"{API}/apiaries/{world.apiary['id']}/field-definitions",
                     json={"name": "Race", "target": "hive", "type": "text"})
    world.alice.post(f"{API}/field-definitions", json={"name": "Personal", "target": "hive", "type": "text"})

    apiary_fields = world.bob.get(f"{API}/apiaries/{world.apiary['id']}/field-definitions").json()
    personal = world.bob.get(f"{API}/field-definitions").json()

    assert [f["name"] for f in apiary_fields] == ["Race"]
    assert personal == []


def test_a_collaborator_can_add_and_remove_an_apiary_field(world):
    _share_apiary(world)

    created = world.bob.post(f"{API}/apiaries/{world.apiary['id']}/field-definitions",
                             json={"name": "Queen line", "target": "hive", "type": "text"})
    assert created.status_code == 201
    fid = created.json()["id"]

    assert world.alice.put(f"{API}/apiaries/{world.apiary['id']}/field-definitions/{fid}",
                           json={"name": "Line"}).status_code == 200
    assert world.bob.delete(f"{API}/apiaries/{world.apiary['id']}/field-definitions/{fid}").status_code == 204


def test_stats_overview_and_export_cover_what_was_shared(world):
    _share_apiary(world)
    _inspect(world.alice, world.h1, brood_frames=5)

    overview = world.bob.get(f"{API}/stats/overview?preset=all").json()
    apiary_stats = world.bob.get(f"{API}/apiaries/{world.apiary['id']}/stats?preset=all").json()
    export = world.bob.get(f"{API}/apiaries/{world.apiary['id']}/inspections/export?format=json")

    assert (overview["apiary_count"], overview["hive_count"], overview["inspections_total"]) == (1, 2, 1)
    assert apiary_stats["hive_count"] == 2
    assert export.status_code == 200 and len(export.json()) == 1


def test_a_collaborator_gets_the_reminder_for_shared_hives(world, db_session):
    _share_apiary(world)
    bob = db_session.query(User).filter_by(email="bob@example.com").one()

    # Neither hive has ever been inspected.
    assert notifications._get_overdue_hive_count(bob, 7, db_session) == 2


# -- working together on single hives ---------------------------------------------------------

def test_a_single_shared_hive_shows_its_apiary_but_not_the_other_hives(world):
    _share_hive(world, world.h1)

    apiary = world.bob.get(f"{API}/apiaries").json()["items"][0]
    hives = world.bob.get(f"{API}/apiaries/{world.apiary['id']}/hives").json()["items"]

    assert (apiary["access"], apiary["hive_count"], apiary["name"]) == ("partial", 1, "Garden")
    assert [h["name"] for h in hives] == ["Hive 1"]
    assert world.bob.get(f"{API}/hives/{world.h2['id']}").status_code == 404
    assert world.bob.get(f"{API}/hives/by-qr/{world.h2['qr_token']}").status_code == 404


def test_a_hive_collaborator_works_on_that_hive(world):
    _share_hive(world, world.h1)

    assert world.bob.put(f"{API}/hives/{world.h1['id']}", json={"notes": "queen marked"}).status_code == 200
    assert _inspect(world.bob, world.h1, brood_frames=5).status_code == 201
    assert world.bob.get(f"{API}/hives/by-qr/{world.h1['qr_token']}").json()["access"] == "shared"
    assert _inspect(world.bob, world.h2, brood_frames=5).status_code == 404


def test_a_hive_collaborator_cannot_touch_the_apiary(world):
    _share_hive(world, world.h1)

    assert world.bob.put(f"{API}/apiaries/{world.apiary['id']}", json={"name": "Mine"}).status_code == 403
    assert world.bob.post(f"{API}/apiaries/{world.apiary['id']}/hives",
                          json={"name": "Extra", "hive_type": "langstroth"}).status_code == 403
    assert world.bob.post(f"{API}/apiaries/{world.apiary['id']}/field-definitions",
                          json={"name": "X", "target": "hive", "type": "text"}).status_code == 403
    assert world.bob.delete(f"{API}/hives/{world.h1['id']}").status_code == 403


def test_a_hive_collaborators_figures_cover_only_that_hive(world):
    _share_hive(world, world.h1)
    _inspect(world.alice, world.h1, brood_frames=5)
    _inspect(world.alice, world.h2, brood_frames=5)

    stats = world.bob.get(f"{API}/apiaries/{world.apiary['id']}/stats?preset=all").json()
    export = world.bob.get(f"{API}/apiaries/{world.apiary['id']}/inspections/export?format=json").json()
    overview = world.bob.get(f"{API}/stats/overview?preset=all").json()

    assert (stats["hive_count"], stats["inspections_total"]) == (1, 1)
    assert [row["hive_id"] for row in export] == [world.h1["id"]]
    assert (overview["hive_count"], overview["inspections_total"]) == (1, 1)


def test_the_hive_reminder_counts_only_the_shared_hive(world, db_session):
    _share_hive(world, world.h1)
    bob = db_session.query(User).filter_by(email="bob@example.com").one()

    assert notifications._get_overdue_hive_count(bob, 7, db_session) == 1


# -- taking it back ---------------------------------------------------------------------------

def test_revoking_a_collaborator_ends_their_access_and_keeps_their_records(world):
    _share_apiary(world)
    _inspect(world.bob, world.h1, brood_frames=6)
    share_id = world.alice.get(f"{API}/shares?apiary_id={world.apiary['id']}").json()[0]["id"]

    assert world.alice.delete(f"{API}/shares/{share_id}").status_code == 204

    assert world.bob.get(f"{API}/apiaries/{world.apiary['id']}").status_code == 404
    assert len(world.alice.get(f"{API}/hives/{world.h1['id']}/inspections").json()["items"]) == 1


def test_a_collaborator_can_leave(world):
    _share_apiary(world)
    share_id = world.alice.get(f"{API}/shares?apiary_id={world.apiary['id']}").json()[0]["id"]

    assert world.bob.delete(f"{API}/shares/{share_id}").status_code == 204

    assert world.bob.get(f"{API}/apiaries/{world.apiary['id']}").status_code == 404
    assert world.alice.get(f"{API}/apiaries/{world.apiary['id']}").status_code == 200


def test_a_stranger_cannot_delete_a_share(world):
    _share_apiary(world)
    share_id = world.alice.get(f"{API}/shares?apiary_id={world.apiary['id']}").json()[0]["id"]

    assert world.carol.delete(f"{API}/shares/{share_id}").status_code == 404


def test_deleting_what_was_shared_removes_the_share(world, db_session):
    empty = world.alice.post(f"{API}/apiaries", json={"name": "Empty"}).json()
    _invite(world.alice, "bob@example.com", apiary_id=empty["id"])
    _invite(world.alice, "bob@example.com", hive_id=world.h1["id"])

    assert world.alice.delete(f"{API}/apiaries/{empty['id']}").status_code == 204
    assert world.alice.delete(f"{API}/hives/{world.h1['id']}").status_code == 204

    assert db_session.query(Share).count() == 0


# -- deleting an account ----------------------------------------------------------------------

def test_an_owner_who_leaves_hands_a_shared_apiary_to_the_collaborator(world, db_session):
    _share_apiary(world)
    _inspect(world.alice, world.h1, brood_frames=4)
    _inspect(world.bob, world.h1, brood_frames=6)

    assert world.alice.delete(f"{API}/users/me").status_code == 204

    apiary = world.bob.get(f"{API}/apiaries/{world.apiary['id']}").json()
    assert (apiary["access"], apiary["owner_name"], apiary["hive_count"]) == ("owner", None, 2)
    inspections = world.bob.get(f"{API}/hives/{world.h1['id']}/inspections").json()["items"]
    assert sorted(i["created_by_name"] or "-" for i in inspections) == ["-", "Bob"]
    # The stickers went along: they are Bob's now and the hive is still found by scanning it.
    assert world.bob.get(f"{API}/hives/by-qr/{world.h1['qr_token']}").status_code == 200
    # Bob owns it outright; there is no share to himself.
    assert db_session.query(Share).count() == 0
    assert world.bob.delete(f"{API}/hives/{world.h2['id']}").status_code == 204


def test_the_apiary_goes_to_whoever_accepted_first(world):
    _invite(world.alice, "bob@example.com", apiary_id=world.apiary["id"])
    _invite(world.alice, "carol@example.com", apiary_id=world.apiary["id"])
    _accept_all(world.carol)
    _accept_all(world.bob)

    world.alice.delete(f"{API}/users/me")

    assert world.carol.get(f"{API}/apiaries/{world.apiary['id']}").json()["access"] == "owner"
    # Bob stays a collaborator, now of Carol's.
    assert world.bob.get(f"{API}/apiaries/{world.apiary['id']}").json()["access"] == "shared"


def test_a_hive_shared_on_its_own_moves_to_a_new_apiary_of_the_collaborator(world):
    _share_hive(world, world.h1)
    _inspect(world.alice, world.h1, brood_frames=4)

    world.alice.delete(f"{API}/users/me")

    apiaries = world.bob.get(f"{API}/apiaries").json()["items"]
    assert [(a["name"], a["access"], a["hive_count"]) for a in apiaries] == [("Garden", "owner", 1)]
    hive = world.bob.get(f"{API}/hives/{world.h1['id']}").json()
    assert hive["access"] == "owner" and hive["apiary_id"] != world.apiary["id"]
    assert len(world.bob.get(f"{API}/hives/{world.h1['id']}/inspections").json()["items"]) == 1
    # What was not shared is gone with the account.
    assert world.bob.get(f"{API}/hives/{world.h2['id']}").status_code == 404


def test_what_was_not_shared_is_deleted_with_the_account(world, db_session):
    world.alice.delete(f"{API}/users/me")

    assert db_session.query(Apiary).count() == 0
    assert db_session.query(Hive).count() == 0
    assert db_session.query(QrToken).count() == 0


def test_pending_invitations_disappear_with_the_owner(world, db_session):
    _invite(world.alice, "bob@example.com", apiary_id=world.apiary["id"])

    world.alice.delete(f"{API}/users/me")

    assert db_session.query(Share).count() == 0
    assert world.bob.get(f"{API}/shares/incoming").json() == []


def test_a_collaborator_who_leaves_takes_only_their_name_from_the_records(world, db_session):
    _share_apiary(world)
    added = world.bob.post(f"{API}/apiaries/{world.apiary['id']}/hives",
                           json={"name": "Bob's hive", "hive_type": "langstroth"}).json()
    _inspect(world.bob, added, brood_frames=3)
    _inspect(world.bob, world.h1, brood_frames=6)

    assert world.bob.delete(f"{API}/users/me").status_code == 204

    # The hive Bob added stays with the apiary's owner, inspections included.
    assert world.alice.get(f"{API}/hives/{added['id']}").status_code == 200
    kept = world.alice.get(f"{API}/hives/{world.h1['id']}/inspections").json()["items"]
    assert len(kept) == 1 and kept[0]["created_by_name"] is None
    assert db_session.query(User).filter_by(email="bob@example.com").count() == 0


def test_an_admin_deleting_an_account_hands_over_shared_work_too(world, db_session):
    _share_apiary(world)
    admin = db_session.query(User).filter_by(email="carol@example.com").one()
    admin.is_admin = True
    db_session.commit()
    alice_id = db_session.query(User).filter_by(email="alice@example.com").one().id

    assert world.carol.delete(f"{API}/admin/users/{alice_id}").status_code == 204

    assert world.bob.get(f"{API}/apiaries/{world.apiary['id']}").json()["access"] == "owner"
