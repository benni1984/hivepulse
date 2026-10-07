"""The beekeeper's year: the content, the move to the beekeeper's place, and the endpoints.

The geocoder is replaced, so no test reaches the network.
"""
from datetime import date

import pytest
from fastapi.testclient import TestClient

from app import beekeeping_year, season
from app.utils.geocoding import CityLocation
from main import app

API = "/api/v1"


# ── The content ──────────────────────────────────────────────────────────────────────────

def test_every_entry_is_written_in_all_four_languages():
    for entry in beekeeping_year.ENTRIES:
        for language in beekeeping_year.LANGUAGES:
            assert entry.title[language].strip(), f"{entry.key} has no {language} title"
            assert entry.body[language].strip(), f"{entry.key} has no {language} text"


def test_the_translations_are_not_copies_of_the_english_text():
    for entry in beekeeping_year.ENTRIES:
        for language in ("de", "fr", "es"):
            assert entry.body[language] != entry.body["en"], f"{entry.key}: {language} is the English text"


def test_keys_are_unique_and_categories_known():
    keys = [e.key for e in beekeeping_year.ENTRIES]
    assert len(keys) == len(set(keys))
    assert {e.category for e in beekeeping_year.ENTRIES} <= set(beekeeping_year.CATEGORIES)


def test_every_date_is_a_real_day():
    for entry in beekeeping_year.ENTRIES:
        for text in (entry.start, entry.end):
            month, day = (int(part) for part in text.split("-"))
            date(2027, month, day)  # raises for a day that does not exist


def test_the_year_covers_what_a_beekeeper_has_to_do():
    keys = {e.key for e in beekeeping_year.ENTRIES}
    for needed in (
        "candy-feeding",        # February
        "first-inspection",     # start of the inspections
        "swarm-control",        # every week, at the latest every 9 days
        "drone-frame-insert", "drone-brood-cutting",
        "migrate-rapeseed", "harvest-rapeseed", "migrate-acacia", "harvest-acacia",
        "migrate-linden", "harvest-linden", "migrate-fir", "harvest-forest", "migrate-heather", "harvest-heather",
        "varroa-summer", "winter-feeding", "winter-prep", "oxalic-acid",
    ):
        assert needed in keys, f"the year has no {needed}"


def test_the_feeding_in_february_and_the_swarm_control_are_as_asked():
    candy = beekeeping_year.entry_by_key("candy-feeding")
    swarm = beekeeping_year.entry_by_key("swarm-control")

    assert candy.start.startswith("02-")
    assert swarm.interval_days == 9
    assert swarm.start < swarm.end and swarm.start.startswith(("04-", "05-"))


def test_honey_entries_use_the_forage_keys_of_the_moves():
    forage = {"acacia", "rapeseed", "orchard", "dandelion", "linden", "chestnut", "fir", "heather",
              "sunflower", "lavender", "other"}
    for entry in beekeeping_year.ENTRIES:
        if entry.honey:
            assert entry.honey in forage, f"{entry.key}: {entry.honey} is not a forage key"


def test_the_texts_use_the_words_of_the_apps():
    german = " ".join(e.title["de"] + " " + e.body["de"] for e in beekeeping_year.ENTRIES)
    french = " ".join(e.title["fr"] + " " + e.body["fr"] for e in beekeeping_year.ENTRIES)
    spanish = " ".join(e.title["es"] + " " + e.body["es"] for e in beekeeping_year.ENTRIES)

    assert "Begehung" not in german and "Inspektion" not in german
    assert "inspection" not in french.lower()
    assert "inspecci" not in spanish.lower()


# ── The move to the beekeeper's place ─────────────────────────────────────────────────────

def test_the_reference_region_has_no_shift():
    assert season.shift_days(season.REFERENCE_LATITUDE, season.REFERENCE_LONGITUDE) == 0


def test_the_north_is_later_the_south_is_earlier():
    hamburg = season.shift_days(53.55, 9.99)
    munich = season.shift_days(48.14, 11.58)

    assert hamburg > 0 > munich or hamburg > 10
    assert 10 <= hamburg <= 20
    assert -10 <= munich <= 0


def test_the_shift_is_capped_and_the_hand_adjustment_comes_on_top():
    assert season.shift_days(40.4, -3.7) == -season.MAX_SHIFT_DAYS      # Madrid: capped
    assert season.shift_days(69.0, 25.0) == season.MAX_SHIFT_DAYS       # the far north: capped
    assert season.shift_days(50.1, 8.7, adjust_days=14) == 14
    assert season.shift_days(None, None, adjust_days=-7) == -7
    assert season.shift_days(None, None, adjust_days=500) == season.MAX_ADJUST_DAYS


def test_the_language_is_the_first_supported_one():
    assert season.pick_language("de") == "de"
    assert season.pick_language(None, "fr-CH,fr;q=0.9,en;q=0.8") == "fr"
    assert season.pick_language("pl", "xx", "es") == "es"
    assert season.pick_language(None, None, None) == "en"


def test_a_run_over_new_year_shows_up_on_both_sides_of_it():
    entry = beekeeping_year.Entry("test", "care", "12-01", "01-15", {}, {})

    december = list(season.occurrences(entry, date(2026, 12, 10), date(2026, 12, 20), 0))
    january = list(season.occurrences(entry, date(2027, 1, 5), date(2027, 1, 10), 0))

    assert december == january == [(date(2026, 12, 1), date(2027, 1, 15))]


def test_a_shift_moves_every_date_of_the_run():
    entry = beekeeping_year.entry_by_key("swarm-control")

    plain = list(season.occurrences(entry, date(2026, 1, 1), date(2026, 12, 31), 0))
    later = list(season.occurrences(entry, date(2026, 1, 1), date(2026, 12, 31), 10))

    assert plain == [(date(2026, 4, 20), date(2026, 6, 30))]
    assert later == [(date(2026, 4, 30), date(2026, 7, 10))]


def test_the_timeline_is_in_order_and_marks_what_is_going_on_today():
    items = season.timeline(date(2026, 4, 1), date(2026, 6, 30), 0, "en", date(2026, 5, 20))

    assert [i["start"] for i in items] == sorted(i["start"] for i in items)
    active = {i["key"] for i in items if i["active"]}
    assert "swarm-control" in active and "harvest-rapeseed" in active
    assert "candy-feeding" not in {i["key"] for i in items}


# ── The endpoints ────────────────────────────────────────────────────────────────────────

@pytest.fixture
def me(client):
    client.post(f"{API}/auth/register", json={
        "email": "bee@example.com", "password": "password123", "name": "Bee", "locale": "de",
    })
    token = client.post(f"{API}/auth/login", json={"email": "bee@example.com", "password": "password123"}).json()["access_token"]
    c = TestClient(app)
    c.headers.update({"Authorization": f"Bearer {token}"})
    return c


@pytest.fixture
def geocoder(monkeypatch):
    """What the postal code lookup answers; set `found` to a CityLocation or None."""
    state = {"found": CityLocation("Hamburg", 53.55, 9.99), "calls": []}

    def fake(country, postal_code):
        state["calls"].append((country, postal_code))
        return state["found"]

    monkeypatch.setattr("app.routers.beekeeping_year.forward_geocode_postal", fake)
    return state


def test_the_calendar_needs_a_login(client):
    assert client.get(f"{API}/calendar").status_code in (401, 403, 422)
    assert client.get(f"{API}/users/me/region").status_code in (401, 403, 422)


def test_a_new_account_has_no_region(me):
    region = me.get(f"{API}/users/me/region").json()

    assert region["country"] is None and region["source"] == "default"
    assert region["shift_days"] == 0 and region["located"] is True


def test_a_postal_code_is_looked_up_once_and_moves_the_year(me, geocoder):
    region = me.put(f"{API}/users/me/region", json={"country": "de", "postal_code": "20095"}).json()

    assert geocoder["calls"] == [("DE", "20095")]
    assert region["country"] == "DE" and region["postal_code"] == "20095"
    assert region["source"] == "postal_code" and region["shift_days"] > 10
    # Reading it again does not look it up again.
    me.get(f"{API}/users/me/region")
    assert len(geocoder["calls"]) == 1


def test_an_unknown_postal_code_is_said_so_and_does_not_move_the_year(me, geocoder):
    geocoder["found"] = None

    region = me.put(f"{API}/users/me/region", json={"country": "DE", "postal_code": "00000"}).json()

    assert region["located"] is False and region["shift_days"] == 0 and region["source"] == "default"


def test_without_a_postal_code_the_first_apiary_with_a_position_is_used(me):
    me.put(f"{API}/users/me/region", json={"adjust_days": 0})
    me.post(f"{API}/apiaries", json={"name": "Nowhere"})
    me.post(f"{API}/apiaries", json={"name": "Hamburg", "latitude": 53.55, "longitude": 9.99})

    region = me.get(f"{API}/users/me/region").json()

    assert region["source"] == "apiary" and region["shift_days"] > 10


def test_the_hand_adjustment_is_added_and_bounded(me):
    assert me.put(f"{API}/users/me/region", json={"adjust_days": 14}).json()["shift_days"] == 14
    assert me.put(f"{API}/users/me/region", json={"adjust_days": 29}).status_code == 422
    assert me.put(f"{API}/users/me/region", json={"adjust_days": -29}).status_code == 422


def test_a_bad_country_is_refused_and_an_empty_one_clears(me, geocoder):
    assert me.put(f"{API}/users/me/region", json={"country": "Germany"}).status_code == 422
    assert me.put(f"{API}/users/me/region", json={"country": "D1"}).status_code == 422
    me.put(f"{API}/users/me/region", json={"country": "DE", "postal_code": "20095"})

    cleared = me.put(f"{API}/users/me/region", json={"country": "", "postal_code": ""}).json()

    assert cleared["country"] is None and cleared["postal_code"] is None
    assert cleared["source"] == "default" and cleared["shift_days"] == 0


def test_the_calendar_answers_in_the_language_asked_for(me):
    german = me.get(f"{API}/calendar", params={"from": "2026-02-01", "days": 30}).json()
    french = me.get(f"{API}/calendar", params={"from": "2026-02-01", "days": 30, "lang": "fr"}).json()
    spanish = me.get(f"{API}/calendar", params={"from": "2026-02-01", "days": 30},
                     headers={"Accept-Language": "es-ES,es;q=0.9"}).json()

    titles = {entry["key"]: entry["title"] for entry in german["entries"]}
    assert titles["candy-feeding"].startswith("Mit Futterteig")        # the account's own language
    assert {e["key"]: e["title"] for e in french["entries"]}["candy-feeding"].startswith("Donner du candi")
    assert {e["key"]: e["title"] for e in spanish["entries"]}["candy-feeding"].startswith("Dar candy")


def test_the_window_decides_what_is_returned(me):
    february = me.get(f"{API}/calendar", params={"from": "2026-02-01", "days": 28}).json()
    october = me.get(f"{API}/calendar", params={"from": "2026-10-01", "days": 31}).json()

    assert february["start"] == "2026-02-01" and february["end"] == "2026-02-28"
    assert "candy-feeding" in {e["key"] for e in february["entries"]}
    assert "candy-feeding" not in {e["key"] for e in october["entries"]}
    assert "winter-prep" in {e["key"] for e in october["entries"]}


def test_a_window_can_reach_across_years_for_the_endless_timeline(me):
    window = me.get(f"{API}/calendar", params={"from": "2026-12-01", "days": 400}).json()

    candy = [e for e in window["entries"] if e["key"] == "candy-feeding"]
    assert [e["start"][:4] for e in candy] == ["2027"]
    swarm = [e["start"] for e in window["entries"] if e["key"] == "swarm-control"]
    assert swarm == ["2027-04-20"]


def test_the_region_moves_the_dates_in_the_calendar(me, geocoder):
    plain = me.get(f"{API}/calendar", params={"from": "2026-01-01", "days": 365}).json()
    me.put(f"{API}/users/me/region", json={"country": "DE", "postal_code": "20095"})
    moved = me.get(f"{API}/calendar", params={"from": "2026-01-01", "days": 365}).json()

    plain_start = next(e["start"] for e in plain["entries"] if e["key"] == "swarm-control")
    moved_start = next(e["start"] for e in moved["entries"] if e["key"] == "swarm-control")
    assert moved["region"]["shift_days"] > 10
    assert moved_start > plain_start


def test_the_window_is_bounded(me):
    assert me.get(f"{API}/calendar", params={"days": 0}).status_code == 422
    assert me.get(f"{API}/calendar", params={"days": 801}).status_code == 422


def test_each_entry_says_whether_it_is_going_on_today(me):
    today = date.today()
    window = me.get(f"{API}/calendar", params={"from": today.replace(day=1).isoformat(), "days": 90}).json()

    for entry in window["entries"]:
        assert entry["active"] == (entry["start"] <= today.isoformat() <= entry["end"])
