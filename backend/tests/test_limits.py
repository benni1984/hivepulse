"""Where the free line runs, and — more importantly — what it never does (#478).

The number is a product decision and will move. The rule underneath it must not:

    **Reaching a limit never closes what already exists.**

Half of this file is about that. A paywall that locks away work somebody already did is the one
thing this kind of product does not survive, and it would be a particularly poor thing to do to a
record of living animals. So every guard here sits in front of a *creation*; there is nothing in
`app/limits.py` that can take something away, and these tests are what keeps it that way.
"""
from datetime import timedelta

import pytest

from app.clock import today_utc

from app import limits
from app.models import User


def _hives(auth_client, apiary_id, count, start=1):
    made = []
    for i in range(start, start + count):
        resp = auth_client.post(f"/api/v1/apiaries/{apiary_id}/hives",
                                json={"name": f"Hive {i}", "hive_type": "langstroth"})
        made.append(resp)
    return made


@pytest.fixture
def apiary(auth_client):
    resp = auth_client.post("/api/v1/apiaries", json={"name": "Meadow", "address": "Somewhere"})
    return resp.json()["id"]


def _supporter(db_session, email="test@example.com"):
    user = db_session.query(User).filter(User.email == email).first()
    user.is_supporter = True
    db_session.commit()
    return user


# --------------------------------------------------------------------------------------------
# The limit itself
# --------------------------------------------------------------------------------------------

def test_ten_colonies_are_free(auth_client, apiary):
    """Ten covers the real hobbyist, who should never pay."""
    made = _hives(auth_client, apiary, limits.FREE_HIVE_LIMIT)

    assert [r.status_code for r in made] == [201] * limits.FREE_HIVE_LIMIT


def test_the_eleventh_is_refused_with_a_reason_of_its_own(auth_client, apiary):
    _hives(auth_client, apiary, limits.FREE_HIVE_LIMIT)

    resp = auth_client.post(f"/api/v1/apiaries/{apiary}/hives",
                            json={"name": "One too many", "hive_type": "langstroth"})

    assert resp.status_code == 403
    assert resp.json()["detail"]["code"] == "FREE_HIVE_LIMIT_REACHED"


def test_a_supporter_has_no_limit(auth_client, apiary, db_session):
    _supporter(db_session)

    made = _hives(auth_client, apiary, limits.FREE_HIVE_LIMIT + 3)

    assert all(r.status_code == 201 for r in made)


def test_apiaries_are_not_limited(auth_client):
    """Only colonies are counted. Somebody with four stands and six colonies is a hobbyist."""
    made = [auth_client.post("/api/v1/apiaries", json={"name": f"Stand {i}", "address": "X"})
            for i in range(6)]

    assert all(r.status_code == 201 for r in made)


# --------------------------------------------------------------------------------------------
# What reaching the limit must never do
# --------------------------------------------------------------------------------------------

def test_everything_already_kept_stays_readable(auth_client, apiary):
    """The rule this file exists for. At the limit the list is still the whole list."""
    _hives(auth_client, apiary, limits.FREE_HIVE_LIMIT)
    auth_client.post(f"/api/v1/apiaries/{apiary}/hives",
                     json={"name": "Refused", "hive_type": "langstroth"})

    listed = auth_client.get(f"/api/v1/apiaries/{apiary}/hives").json()["items"]

    assert len(listed) == limits.FREE_HIVE_LIMIT


def test_work_can_still_be_recorded_on_the_colonies_that_exist(auth_client, apiary):
    """A beekeeper at the limit is still a beekeeper. Inspections, edits and everything else go
    on exactly as before — the only thing that stops is adding the eleventh."""
    hives = _hives(auth_client, apiary, limits.FREE_HIVE_LIMIT)
    hive_id = hives[0].json()["id"]

    inspection = auth_client.post(f"/api/v1/hives/{hive_id}/inspections",
                                  json={"date": "2026-04-01", "mood": "calm",
                                        "notes": "still working"})
    edit = auth_client.put(f"/api/v1/hives/{hive_id}", json={"name": "Renamed"})

    assert inspection.status_code == 201
    assert edit.status_code == 200


def test_a_lapsed_supporter_keeps_every_colony_they_had(auth_client, apiary, db_session):
    """The case that decides whether this is honest. Somebody over the limit who stops paying
    keeps all of it and simply cannot add more."""
    _supporter(db_session)
    _hives(auth_client, apiary, limits.FREE_HIVE_LIMIT + 5)

    user = db_session.query(User).filter(User.email == "test@example.com").first()
    user.is_supporter = False
    db_session.commit()

    listed = auth_client.get(f"/api/v1/apiaries/{apiary}/hives").json()["items"]
    refused = auth_client.post(f"/api/v1/apiaries/{apiary}/hives",
                               json={"name": "No more", "hive_type": "langstroth"})

    assert len(listed) == limits.FREE_HIVE_LIMIT + 5, "nothing taken away"
    assert refused.status_code == 403, "but nothing added either"


def test_a_refused_colony_leaves_no_half_made_qr_code_behind(auth_client, apiary, db_session):
    """The guard runs before the batch is written. Otherwise every refused attempt would litter
    the account with a QR code attached to nothing."""
    from app.models import QrBatch
    _hives(auth_client, apiary, limits.FREE_HIVE_LIMIT)
    before = db_session.query(QrBatch).count()

    auth_client.post(f"/api/v1/apiaries/{apiary}/hives",
                     json={"name": "Refused", "hive_type": "langstroth"})

    db_session.expire_all()
    assert db_session.query(QrBatch).count() == before


# --------------------------------------------------------------------------------------------
# What the subscription is, rather than how much of it
# --------------------------------------------------------------------------------------------

def test_inviting_somebody_needs_the_subscription(auth_client, apiary):
    resp = auth_client.post("/api/v1/shares",
                            json={"apiary_id": apiary, "email": "friend@example.com"})

    assert resp.status_code == 403
    assert resp.json()["detail"]["code"] == "SUPPORTER_REQUIRED"


def test_a_supporter_may_invite(auth_client, apiary, db_session):
    _supporter(db_session)

    resp = auth_client.post("/api/v1/shares",
                            json={"apiary_id": apiary, "email": "friend@example.com"})

    assert resp.status_code == 201


def test_custom_fields_need_it_too(auth_client):
    resp = auth_client.post("/api/v1/field-definitions",
                            json={"target": "inspection", "name": "Mood of the queen",
                                  "type": "text", "options": [], "required": False,
                                  "sort_order": 0})

    assert resp.status_code == 403
    assert resp.json()["detail"]["code"] == "SUPPORTER_REQUIRED"


# --------------------------------------------------------------------------------------------
# Statistics are narrowed, not refused
# --------------------------------------------------------------------------------------------

def test_the_whole_history_is_narrowed_to_a_year_rather_than_refused(auth_client):
    """A statistics page answering 403 teaches somebody the app is broken. One showing a year
    instead of everything teaches them what the subscription is for."""
    body = auth_client.get("/api/v1/stats/overview?preset=all").json()

    assert body["period"]["preset"] == "365d", "the response says which window was really used"
    assert body["period"]["from"] == str(today_utc() - timedelta(days=365))


def test_the_seasons_a_beekeeper_actually_looks_at_are_untouched(auth_client):
    for preset in ("30d", "90d", "365d"):
        body = auth_client.get(f"/api/v1/stats/overview?preset={preset}").json()

        assert body["period"]["preset"] == preset


def test_a_supporter_gets_the_whole_history(auth_client, db_session):
    _supporter(db_session)

    body = auth_client.get("/api/v1/stats/overview?preset=all").json()

    assert body["period"]["preset"] == "all"
    assert body["period"]["from"] == "2000-01-01"


# Three ways of asking walked past the first version of this gate, because it asked whether the
# *preset* was allowed instead of where the window began. Each of them gets a test of its own.

def test_asking_for_nothing_at_all_is_narrowed_too(auth_client):
    """The important one: no parameters means "everything", and it is what the clients send."""
    body = auth_client.get("/api/v1/stats/overview").json()

    assert body["period"]["from"] == str(today_utc() - timedelta(days=365))


def test_an_explicit_date_range_cannot_reach_further_back(auth_client):
    """`from=2000-01-01` is the spelling somebody would find."""
    body = auth_client.get("/api/v1/stats/overview?from=2000-01-01").json()

    assert body["period"]["from"] == str(today_utc() - timedelta(days=365))
    assert body["period"]["preset"] == "custom", "a range the caller chose keeps its name"


def test_a_preset_nobody_recognises_never_reaches_the_window_at_all(auth_client):
    """This one the route already closes a layer earlier, with a pattern on the query parameter.
    Kept as a test because that pattern is now load-bearing: without it the value would fall
    through to "everything", and only the narrowing below would stand in the way."""
    resp = auth_client.get("/api/v1/stats/overview?preset=since-the-beginning")

    assert resp.status_code == 422


def test_a_range_inside_the_year_is_left_exactly_as_asked(auth_client):
    """Narrowing only ever pulls the start forward. A window that already fits is not touched."""
    asked = str(today_utc() - timedelta(days=30))

    body = auth_client.get(f"/api/v1/stats/overview?from={asked}").json()

    assert body["period"]["from"] == asked


def test_the_colonies_themselves_are_never_hidden_by_the_narrower_window(auth_client, apiary):
    """The window shortens the history, not the holding. Every colony still counts."""
    _hives(auth_client, apiary, 4)

    body = auth_client.get("/api/v1/stats/overview").json()

    assert body["hive_count"] == 4


# --------------------------------------------------------------------------------------------
# The message carries the number, so it has to be the number
# --------------------------------------------------------------------------------------------

@pytest.mark.parametrize("locale", ["en", "de", "fr", "es", "pl"])
def test_every_language_names_the_real_limit(locale):
    """The message says "up to 10". A limit that moves without its sentence moving is worse than
    a vague one, because people believe it."""
    from app.i18n import get_message

    assert str(limits.FREE_HIVE_LIMIT) in get_message("FREE_HIVE_LIMIT_REACHED", locale)


# --------------------------------------------------------------------------------------------
# What a client needs in order to say "7 of 10" before anybody fills in a form
# --------------------------------------------------------------------------------------------

def test_the_account_reports_what_it_holds_against_its_allowance(auth_client, apiary):
    _hives(auth_client, apiary, 7)

    body = auth_client.get("/api/v1/subscriptions/me").json()

    assert body["hives_used"] == 7
    assert body["hive_limit"] == limits.FREE_HIVE_LIMIT


def test_an_account_that_never_bought_anything_still_reports_its_counters(auth_client, apiary):
    """The "none" case used to be a module constant with the counters at their defaults, which
    would have read 0 of nothing for every free account — a paywall that never appears."""
    _hives(auth_client, apiary, 3)

    body = auth_client.get("/api/v1/subscriptions/me").json()

    assert body["status"] == "none"
    assert body["hives_used"] == 3
    assert body["hive_limit"] == limits.FREE_HIVE_LIMIT


def test_a_supporter_has_no_limit_to_report(auth_client, apiary, db_session):
    _supporter(db_session)
    _hives(auth_client, apiary, 2)

    body = auth_client.get("/api/v1/subscriptions/me").json()

    assert body["hive_limit"] is None, "null, so a client says 'unlimited' and not a ratio"
    assert body["hives_used"] == 2


def test_a_lapsed_supporter_reports_more_than_the_limit_without_apology(auth_client, apiary,
                                                                       db_session):
    """"15 of 10" is a real state, because nothing is ever taken away. A client has to render it
    without clipping the number or scolding anybody for it."""
    _supporter(db_session)
    _hives(auth_client, apiary, limits.FREE_HIVE_LIMIT + 5)
    user = db_session.query(User).filter(User.email == "test@example.com").first()
    user.is_supporter = False
    db_session.commit()

    body = auth_client.get("/api/v1/subscriptions/me").json()

    assert body["hives_used"] == limits.FREE_HIVE_LIMIT + 5
    assert body["hive_limit"] == limits.FREE_HIVE_LIMIT


def test_colonies_shared_with_an_account_count_against_their_owner(auth_client, client,
                                                                  db_session):
    """A guest's allowance is not spent by the apiary they were invited onto. Otherwise accepting
    an invitation would quietly use up somebody's free ten."""
    from tests.conftest import make_supporter

    client.post("/api/v1/auth/register", json={
        "email": "owner@example.com", "password": "password123", "name": "Owner", "locale": "en"})
    make_supporter("owner@example.com")
    token = client.post("/api/v1/auth/login", json={
        "email": "owner@example.com", "password": "password123"}).json()["access_token"]
    owner = {"Authorization": f"Bearer {token}"}
    stand = client.post("/api/v1/apiaries", json={"name": "Theirs", "address": "X"},
                        headers=owner).json()["id"]
    for i in range(4):
        client.post(f"/api/v1/apiaries/{stand}/hives",
                    json={"name": f"H{i}", "hive_type": "langstroth"}, headers=owner)
    client.post("/api/v1/shares", json={"apiary_id": stand, "email": "test@example.com"},
                headers=owner)

    body = auth_client.get("/api/v1/subscriptions/me").json()

    assert body["hives_used"] == 0, "none of them are this account's"
