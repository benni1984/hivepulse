"""The treatment record (#477).

A beekeeper may hand this to an authority. So the tests here are less about PDF bytes than about
the two ways a record can be *wrong*: a number that was true once and is not any more, and a
language whose letters the font cannot draw.
"""
from datetime import date, timedelta

import pytest

from app.clock import today_utc
from app.models import User
from app.utils import treatment_record
from tests.conftest import make_supporter

API = "/api/v1"


@pytest.fixture
def stand(auth_client, db_session):
    """An apiary with three colonies, owned by a supporter."""
    make_supporter("test@example.com")
    apiary = auth_client.post(f"{API}/apiaries",
                              json={"name": "Hausgarten", "address": "Freiburg"}).json()
    hives = [auth_client.post(f"{API}/apiaries/{apiary['id']}/hives",
                              json={"name": f"Volk {i}", "hive_type": "langstroth"}).json()
             for i in (1, 2, 3)]
    return apiary, hives


def _plan(auth_client, **body):
    return auth_client.post(f"{API}/treatments", json=body)


# ------------------------------------------------------------------------------------------------
# The font, because a missing glyph does not raise — it draws a blank
# ------------------------------------------------------------------------------------------------

@pytest.mark.parametrize("font", ["DMSans-Regular.ttf", "DMSans-Bold.ttf"])
def test_the_font_can_draw_every_language(font):
    """ReportLab's own fonts cannot draw ą ę ż ś ń ź, and the one TrueType font it ships is
    missing exactly those twelve. Four languages would look perfect while Polish quietly fell
    apart, in a document somebody shows an authority. So the font is asked, not assumed."""
    assert treatment_record.missing_glyphs(font) == []


@pytest.mark.parametrize("lang", ["en", "de", "fr", "es", "pl"])
def test_every_language_has_every_label(lang):
    """A missing label would print as a KeyError at best and an empty column heading at worst."""
    assert set(treatment_record.LABELS[lang]) == set(treatment_record.LABELS["en"])


def test_the_labels_are_the_terms_an_authority_uses():
    """Not a style choice: a German record is a Bestandsbuch and the waiting time is the
    Wartezeit. Pinned so nobody "improves" them into something a vet would not recognise."""
    de = treatment_record.LABELS["de"]
    assert "Bestandsbuch" in de["title"]
    assert de["withdrawal"] == "Wartezeit"
    assert de["colonies"] == "Völker"
    assert "leczenia" in treatment_record.LABELS["pl"]["title"]


# ------------------------------------------------------------------------------------------------
# The number that must not drift
# ------------------------------------------------------------------------------------------------

def test_finishing_a_treatment_freezes_how_many_colonies_it_covered(auth_client, stand):
    apiary, _ = stand
    t = _plan(auth_client, apiary_id=apiary["id"], product="Ameisensäure 60%",
              due_on=str(today_utc())).json()

    done = auth_client.post(f"{API}/treatments/{t['id']}/done").json()

    assert done["hive_count_treated"] == 3


def test_the_count_does_not_follow_the_apiary_afterwards(auth_client, stand):
    """The test this whole feature turns on. Treat three colonies, then give one away: the record
    must still say three, because three is what was treated. A document assembled from today's
    hive list would say two, and that is a false statement about a veterinary medicine."""
    apiary, hives = stand
    t = _plan(auth_client, apiary_id=apiary["id"], product="Ameisensäure 60%",
              due_on=str(today_utc())).json()
    auth_client.post(f"{API}/treatments/{t['id']}/done")

    auth_client.delete(f"{API}/hives/{hives[0]['id']}")

    still = auth_client.get(f"{API}/treatments?status=done").json()
    assert still[0]["hive_count_treated"] == 3


def test_reopening_clears_the_count(auth_client, stand):
    """A count without a date it belongs to is a number from a day that, as far as the record is
    concerned, did not happen."""
    apiary, _ = stand
    t = _plan(auth_client, apiary_id=apiary["id"], product="X", due_on=str(today_utc())).json()
    auth_client.post(f"{API}/treatments/{t['id']}/done")

    reopened = auth_client.post(f"{API}/treatments/{t['id']}/reopen").json()

    assert reopened["hive_count_treated"] is None
    assert reopened["done_on"] is None


def test_a_single_hive_treatment_counts_one(auth_client, stand):
    _, hives = stand
    t = _plan(auth_client, hive_id=hives[0]["id"], product="X", due_on=str(today_utc())).json()

    done = auth_client.post(f"{API}/treatments/{t['id']}/done").json()

    assert done["hive_count_treated"] == 1


# ------------------------------------------------------------------------------------------------
# The new fields
# ------------------------------------------------------------------------------------------------

def test_amount_and_withdrawal_are_kept_as_given(auth_client, stand):
    apiary, _ = stand
    t = _plan(auth_client, apiary_id=apiary["id"], product="Ameisensäure 60%",
              due_on=str(today_utc()), amount="2 × 15 ml je Volk", withdrawal_days=0).json()

    assert t["amount"] == "2 × 15 ml je Volk"
    assert t["withdrawal_days"] == 0


def test_a_treatment_recorded_before_these_existed_still_works(auth_client, stand):
    """They are optional on purpose. Everything already recorded stays usable."""
    apiary, _ = stand
    t = _plan(auth_client, apiary_id=apiary["id"], product="X", due_on=str(today_utc())).json()

    assert t["amount"] is None and t["withdrawal_days"] is None


# ------------------------------------------------------------------------------------------------
# The document
# ------------------------------------------------------------------------------------------------

def test_the_record_is_a_pdf(auth_client, stand):
    apiary, _ = stand
    t = _plan(auth_client, apiary_id=apiary["id"], product="Ameisensäure 60%",
              due_on=str(today_utc()), amount="60 g").json()
    auth_client.post(f"{API}/treatments/{t['id']}/done")

    resp = auth_client.get(f"{API}/apiaries/{apiary['id']}/treatment-record")

    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/pdf"
    assert resp.content.startswith(b"%PDF-")
    assert "attachment" in resp.headers["content-disposition"]


def test_a_year_with_nothing_treated_still_answers_with_a_document(auth_client, stand):
    """"Nothing was treated here in 2026" is exactly what somebody may need to show. An empty
    record is an answer; a 404 is not."""
    apiary, _ = stand

    resp = auth_client.get(f"{API}/apiaries/{apiary['id']}/treatment-record?year=2024")

    assert resp.status_code == 200
    assert resp.content.startswith(b"%PDF-")


def test_the_record_renders_in_every_language(auth_client, stand):
    """Polish is the one that would fail, and it would fail silently."""
    apiary, _ = stand
    t = _plan(auth_client, apiary_id=apiary["id"], product="Kwas mrówkowy",
              due_on=str(today_utc()), amount="2 × 15 ml").json()
    auth_client.post(f"{API}/treatments/{t['id']}/done")

    for lang in ("en", "de", "fr", "es", "pl"):
        resp = auth_client.get(f"{API}/apiaries/{apiary['id']}/treatment-record",
                               headers={"Accept-Language": lang})
        assert resp.status_code == 200, lang
        assert len(resp.content) > 1000, lang


def test_only_the_asked_year_is_in_it(auth_client, stand, db_session):
    """A record is per year. A treatment from another one belongs in that year's document."""
    from app.models import PlannedTreatment
    apiary, _ = stand
    t = _plan(auth_client, apiary_id=apiary["id"], product="Oxalsäure",
              due_on=str(today_utc())).json()
    auth_client.post(f"{API}/treatments/{t['id']}/done")
    row = db_session.get(PlannedTreatment, t["id"])
    row.done_on = date(2021, 5, 4)
    db_session.commit()

    this_year = auth_client.get(f"{API}/apiaries/{apiary['id']}/treatment-record").content
    that_year = auth_client.get(f"{API}/apiaries/{apiary['id']}/treatment-record?year=2021").content

    assert len(that_year) > len(this_year), "the year it happened in carries the row"


def test_an_impossible_year_is_refused(auth_client, stand):
    apiary, _ = stand

    assert auth_client.get(
        f"{API}/apiaries/{apiary['id']}/treatment-record?year=1700").status_code == 422


# ------------------------------------------------------------------------------------------------
# Who may print it
# ------------------------------------------------------------------------------------------------

def test_the_record_is_part_of_the_subscription(auth_client, db_session):
    user = db_session.query(User).filter(User.email == "test@example.com").first()
    user.is_supporter = False
    db_session.commit()
    apiary = auth_client.post(f"{API}/apiaries", json={"name": "Frei", "address": "X"}).json()

    resp = auth_client.get(f"{API}/apiaries/{apiary['id']}/treatment-record")

    assert resp.status_code == 403
    assert resp.json()["detail"]["code"] == "SUPPORTER_REQUIRED"


def test_a_stranger_is_told_it_does_not_exist(auth_client, client, stand):
    """404 and not 403: pointing at somebody else's apiary must not reveal that it is there."""
    apiary, _ = stand
    client.post(f"{API}/auth/register", json={"email": "nosy@example.com",
                                              "password": "password123",
                                              "name": "Nosy", "locale": "en"})
    token = client.post(f"{API}/auth/login", json={"email": "nosy@example.com",
                                                   "password": "password123"}).json()["access_token"]

    resp = client.get(f"{API}/apiaries/{apiary['id']}/treatment-record",
                      headers={"Authorization": f"Bearer {token}"})

    assert resp.status_code == 404


def test_a_collaborator_prints_the_record_of_the_person_who_pays(auth_client, client, stand):
    """The owner subscribes; whoever was invited onto the apiary does the work. Making them buy
    their own subscription to produce the paperwork for it would be charging twice for one
    apiary — the same rule as the apiary's custom fields (#478)."""
    apiary, _ = stand
    client.post(f"{API}/auth/register", json={"email": "helper@example.com",
                                              "password": "password123",
                                              "name": "Helper", "locale": "en"})
    auth_client.post(f"{API}/shares", json={"apiary_id": apiary["id"],
                                            "email": "helper@example.com"})
    token = client.post(f"{API}/auth/login", json={"email": "helper@example.com",
                                                   "password": "password123"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    incoming = client.get(f"{API}/shares/incoming", headers=headers).json()
    client.post(f"{API}/shares/{incoming[0]['id']}/accept", headers=headers)

    resp = client.get(f"{API}/apiaries/{apiary['id']}/treatment-record", headers=headers)

    assert resp.status_code == 200
    assert resp.content.startswith(b"%PDF-")
