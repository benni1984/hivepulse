"""The beekeeping-year questionnaire: the grouping, the public endpoints, and what is not stored.

The dates in the timeline were written once for central Germany and moved elsewhere by a formula.
These tests cover the machinery that lets beekeepers say the formula is wrong where they live —
and, just as importantly, that saying so changes nothing until an admin agrees.

The geocoder is replaced throughout, so no test reaches the network.
"""
import re
from pathlib import Path
from unittest.mock import patch

import pytest

from app import year_feedback
from app.beekeeping_year import ENTRIES
from app.models import YearRating
from app.utils.geocoding import CityLocation

API = "/api/v1"
HAMBURG = CityLocation(name="Hamburg", latitude=53.5503, longitude=9.9937)
MUNICH = CityLocation(name="München", latitude=48.1374, longitude=11.5755)

SOME_KEY = ENTRIES[0].key
ANOTHER_KEY = ENTRIES[1].key


@pytest.fixture
def geocoder():
    """Every postal code resolves to Hamburg unless a test says otherwise."""
    with patch("app.routers.public_year.forward_geocode_postal", return_value=HAMBURG) as mock:
        yield mock


def _rating(key=SOME_KEY, verdict="too_late", shift=None, note=None, country="DE",
            latitude=53.5, longitude=10.0):
    return year_feedback.Rating(key, verdict, shift, note, country, latitude, longitude)


# ── What is stored, and what is not ──────────────────────────────────────────────────────

def test_a_position_is_only_ever_stored_about_eleven_kilometres_coarse():
    """A rating is about a region. A position good enough to find an apiary would be a different
    thing to collect, and this questionnaire has no account to attach it to anyway."""
    latitude, longitude = year_feedback.round_position(53.550341, 9.993682)

    assert (latitude, longitude) == (53.6, 10.0)
    # The precision is gone, not merely formatted away: every position inside a grid cell
    # collapses onto the same stored pair, so the row cannot point back at an apiary. (Two
    # positions either side of a cell boundary do land apart — that is true of any grid and is
    # not what protects the beekeeper; the lost precision is.)
    cell = {year_feedback.round_position(53.5503 + step / 10000, 9.9937) for step in range(0, 400, 7)}
    assert len(cell) == 1, f"a 4 km spread should store as one position, got {cell}"
    assert year_feedback.distance_km(53.5503, 9.9937, latitude, longitude) > 4


def test_the_device_string_is_hashed_and_the_original_is_not_recoverable_from_it():
    hashed = year_feedback.hash_device("browser-abc-123")

    assert hashed != "browser-abc-123"
    assert len(hashed) == 64
    assert year_feedback.hash_device("browser-abc-123") == hashed, "must be stable to replace a rating"
    assert year_feedback.hash_device("browser-abc-124") != hashed


def test_the_postal_code_is_looked_up_and_then_not_stored(client, geocoder):
    """The postal code is how the position is found, not something worth keeping afterwards."""
    response = client.post(f"{API}/public/calendar/feedback", json={
        "country": "DE", "postal_code": "20095", "device_id": "d" * 16,
        "ratings": [{"key": SOME_KEY, "verdict": "fits"}],
    })
    assert response.status_code == 201

    from tests.conftest import TestingSession
    db = TestingSession()
    try:
        row = db.query(YearRating).one()
        stored = {column.name for column in YearRating.__table__.columns}
        assert "postal_code" not in stored
        assert "user_id" not in stored and "email" not in stored
        assert (row.latitude, row.longitude) == (53.6, 10.0)
        assert row.device_hash != "d" * 16
    finally:
        db.close()


# ── The number of entries, wherever it is written down ───────────────────────────────────

def test_no_text_anywhere_claims_a_wrong_number_of_entries():
    """"The 38 entries of the beekeeping year" has to stay true, in five languages.

    It said 35 for months -- in this router's own docstring, in the API contract, and from there
    in the questionnaire's texts, its release notes, its News entry and five help pages. There
    are 38. A precise number that is wrong is worse than no number: a beekeeper who counts them
    finds 38 and learns that we do not check what we say.

    So the number is checked rather than trusted. Add an entry and this fails, naming every file
    whose sentence has to be rewritten -- including the four translations, which is the half
    somebody would otherwise forget.
    """
    root = Path(__file__).resolve().parents[2]
    files = [
        root / "docs" / "api-contract.md",
        root / "docs" / "features.md",
        root / "lib" / "api.ts",
        root / "lib" / "news.ts",
        root / "lib" / "releaseNotes.ts",
        root / "components" / "YearFeedback.tsx",
        root / "backend" / "app" / "routers" / "public_year.py",
    ]
    files += [root / "messages" / f"{lang}.json" for lang in ("en", "de", "fr", "es", "pl")]
    files += [
        root / "app" / "[locale]" / "help" / "[slug]" / "content" / name
        for name in ("beekeeping-year.tsx", "beekeeping-year.de.tsx", "beekeeping-year.fr.tsx",
                     "beekeeping-year.es.tsx", "beekeeping-year.pl.tsx")
    ]

    # The number, immediately followed by the word for "entries" in any of the five languages.
    counted = re.compile(
        r"\b(\d+)\s+(entries|Einträge|Einträgen|entrées|entradas|wpisów|wpisach)\b"
    )
    wrong: list[str] = []
    found = 0
    for path in files:
        assert path.exists(), f"{path.name} is gone; this test names the files it guards"
        for match in counted.finditer(path.read_text(encoding="utf-8")):
            found += 1
            if int(match.group(1)) != len(ENTRIES):
                wrong.append(f"{path.name}: \"{match.group(0)}\" but there are {len(ENTRIES)}")

    assert found >= 10, "the sentences that name the count have moved; this test now guards nothing"
    assert not wrong, "texts naming the wrong number of entries:\n" + "\n".join(wrong)


# ── The direction belongs to the verdict ─────────────────────────────────────────────────

@pytest.mark.parametrize("verdict,sent,stored", [
    # "too early" means the calendar is too early, so the entry belongs later: positive, because
    # that is what `season.occurrences` adds to the date.
    ("too_early", 14, 14),
    ("too_early", -14, 14),
    ("too_late", 14, -14),
    ("too_late", -14, -14),
])
def test_the_verdict_decides_the_direction_and_the_number_is_only_how_far(
    client, geocoder, verdict, sent, stored
):
    """A signed number whose direction another field already fixes is a number that gets filled in
    backwards, and the correction is a median: five ratings that agree on "a fortnight later" plus
    one that typed -14 average out to nothing. So the sign is not trusted -- it is replaced."""
    response = client.post(f"{API}/public/calendar/feedback", json={
        "country": "DE", "postal_code": "20095", "device_id": f"sign{verdict}{sent}".ljust(16, "x"),
        "ratings": [{"key": SOME_KEY, "verdict": verdict, "shift_days": sent}],
    })
    assert response.status_code == 201

    from tests.conftest import TestingSession
    db = TestingSession()
    try:
        assert db.query(YearRating).one().shift_days == stored
    finally:
        db.close()


def test_a_backwards_client_cannot_cancel_out_a_region_that_agrees(client, geocoder):
    """The reason the sign is normalised rather than refused: this endpoint needs no account, so a
    third-party client with the sign the wrong way round would have every rating silently refused.
    Normalised, its ratings still count -- and still count the way its users meant."""
    for index in range(6):
        # The last one has it backwards; it must land with the other five, not against them.
        sent = -14 if index == 5 else 14
        client.post(f"{API}/public/calendar/feedback", json={
            "country": "DE", "postal_code": "20095", "device_id": f"agree{index}".ljust(16, "y"),
            "ratings": [{"key": SOME_KEY, "verdict": "too_early", "shift_days": sent}],
        })

    from tests.conftest import TestingSession
    db = TestingSession()
    try:
        ratings = [
            year_feedback.Rating(row.entry_key, row.verdict, row.shift_days, row.note,
                                 row.country, row.latitude, row.longitude)
            for row in db.query(YearRating).all()
        ]
    finally:
        db.close()

    proposal = year_feedback.propose(ratings)[0]
    assert proposal.shift_days == 14, "a backwards sign must not drag the median towards zero"


# ── The grouping: nothing moves on one loud opinion ──────────────────────────────────────

def test_a_group_under_five_ratings_is_not_offered_at_all():
    assert year_feedback.propose([_rating(shift=-7) for _ in range(4)]) == []
    assert len(year_feedback.propose([_rating(shift=-7) for _ in range(5)])) == 1


def test_one_extreme_rating_cannot_drag_the_group_because_the_median_decides():
    """Somebody typing -60 among four who say -7 is exactly the case the mean would get wrong."""
    group = [_rating(shift=-7) for _ in range(4)] + [_rating(shift=-60)]

    proposal = year_feedback.propose(group)[0]

    assert proposal.shift_days == -7
    # The disagreement is still shown, so an admin can see what they are approving.
    assert proposal.shift_days_range == (-60, -7)
    assert proposal.rating_count == 5


def test_a_contented_region_proposes_nothing():
    """The questionnaire has to be able to confirm the dates, or it only ever collects complaints."""
    assert year_feedback.propose([_rating(verdict="fits") for _ in range(8)]) == []


def test_a_direction_without_a_size_moves_nothing():
    """"Too early" with no number says something is off, not by how much."""
    assert year_feedback.propose([_rating(verdict="too_early") for _ in range(6)]) == []


def test_a_majority_saying_it_does_not_apply_proposes_hiding_rather_than_moving():
    group = [_rating(verdict="wrong") for _ in range(5)] + [_rating(verdict="fits")]

    proposal = year_feedback.propose(group)[0]

    assert proposal.kind == "hide"
    assert proposal.shift_days is None


def test_two_distant_regions_are_not_one_group():
    """Hamburg and Munich are 600 km apart and have different springs; three ratings each is two
    regions of three, not one of six."""
    group = [_rating(shift=-7) for _ in range(3)] + [
        _rating(shift=-7, latitude=48.1, longitude=11.6) for _ in range(3)
    ]

    assert year_feedback.propose(group) == []


def test_ratings_of_different_entries_never_share_a_group():
    group = [_rating(key=SOME_KEY, shift=-7) for _ in range(3)] + [
        _rating(key=ANOTHER_KEY, shift=-7) for _ in range(3)
    ]

    assert year_feedback.propose(group) == []


def test_a_group_keeps_the_notes_for_the_admin_to_read():
    group = [_rating(shift=-7, note="Mid-February here.") for _ in range(5)]

    proposal = year_feedback.propose(group)[0]

    assert proposal.notes == ("Mid-February here.",) * 5
    assert proposal.verdict_counts == {"fits": 0, "too_early": 0, "too_late": 5, "wrong": 0}


# ── An approved correction reaches only the region it was made for ───────────────────────

def test_an_approved_correction_applies_inside_its_radius_and_not_outside():
    correction = year_feedback.ApprovedCorrection(SOME_KEY, "shift", -7, 11, 53.5, 10.0, 150)

    assert SOME_KEY in year_feedback.corrections_for([correction], 53.0, 10.2)
    assert year_feedback.corrections_for([correction], 48.1, 11.6) == {}
    # No position means no statement about anywhere.
    assert year_feedback.corrections_for([correction], None, None) == {}


def test_the_nearer_of_two_overlapping_corrections_wins():
    """The closer correction is the more specific statement about that place."""
    near = year_feedback.ApprovedCorrection(SOME_KEY, "shift", -3, 6, 53.5, 10.0, 150)
    far = year_feedback.ApprovedCorrection(SOME_KEY, "shift", -10, 20, 52.5, 10.0, 150)

    picked = year_feedback.corrections_for([far, near], 53.4, 10.0)[SOME_KEY]

    assert picked.shift_days == -3


# ── GET /public/calendar ─────────────────────────────────────────────────────────────────

def test_the_questionnaire_needs_no_token(client):
    response = client.get(f"{API}/public/calendar")

    assert response.status_code == 200
    assert len(response.json()["entries"]) == len(ENTRIES)


def test_it_asks_about_every_entry_exactly_once(client):
    """An entry that runs over New Year has two runs inside one calendar year, and a
    questionnaire must not ask the same question twice."""
    keys = [entry["key"] for entry in client.get(f"{API}/public/calendar").json()["entries"]]

    assert len(keys) == len(set(keys))
    assert set(keys) == {entry.key for entry in ENTRIES}


def test_no_entry_is_marked_as_happening_now(client):
    """There is no "now" in a questionnaire: it rates a year, not today."""
    entry = client.get(f"{API}/public/calendar").json()["entries"][0]

    assert "active" not in entry


def test_a_place_moves_the_dates_so_the_beekeeper_rates_what_they_would_see(client, geocoder):
    unshifted = client.get(f"{API}/public/calendar").json()
    hamburg = client.get(f"{API}/public/calendar", params={"country": "DE", "postal_code": "20095"}).json()

    assert unshifted["shift_days"] == 0
    assert hamburg["shift_days"] > 0, "Hamburg is north of Frankfurt, so its season runs later"
    assert hamburg["entries"][0]["start"] != unshifted["entries"][0]["start"]


def test_a_postal_code_that_cannot_be_found_says_so_instead_of_pretending(client):
    with patch("app.routers.public_year.forward_geocode_postal", return_value=None):
        body = client.get(f"{API}/public/calendar",
                          params={"country": "DE", "postal_code": "nonsense"}).json()

    assert body["located"] is False
    assert body["shift_days"] == 0, "the dates stay where they were written"
    assert body["entries"], "the questionnaire still works without a place"


def test_the_texts_come_in_the_language_that_was_asked_for(client):
    german = client.get(f"{API}/public/calendar", params={"lang": "de"}).json()
    polish = client.get(f"{API}/public/calendar", params={"lang": "pl"}).json()

    assert german["entries"][0]["title"] != polish["entries"][0]["title"]


# ── POST /public/calendar/feedback ───────────────────────────────────────────────────────

def test_a_submission_is_stored_and_counted(client, geocoder):
    response = client.post(f"{API}/public/calendar/feedback", json={
        "country": "DE", "postal_code": "20095", "device_id": "e" * 16, "years_keeping": 12,
        "ratings": [
            {"key": SOME_KEY, "verdict": "fits"},
            {"key": ANOTHER_KEY, "verdict": "too_early", "shift_days": 7, "note": "A week later here."},
        ],
    })

    assert response.status_code == 201
    assert response.json() == {"accepted": 2, "replaced": 0, "located": True}


def test_the_same_browser_changing_its_mind_replaces_rather_than_counts_twice(client, geocoder):
    """One beekeeper, one voice per entry — otherwise a region's opinion is whoever clicks most."""
    payload = {
        "country": "DE", "postal_code": "20095", "device_id": "f" * 16,
        "ratings": [{"key": SOME_KEY, "verdict": "fits"}],
    }
    client.post(f"{API}/public/calendar/feedback", json=payload)

    payload["ratings"] = [{"key": SOME_KEY, "verdict": "too_late", "shift_days": 5}]
    second = client.post(f"{API}/public/calendar/feedback", json=payload)

    assert second.json() == {"accepted": 1, "replaced": 1, "located": True}
    from tests.conftest import TestingSession
    db = TestingSession()
    try:
        row = db.query(YearRating).one()
        # -5, not the 5 that was posted: "too late" means the entry belongs earlier, and the
        # direction is the verdict's (see the direction tests above).
        assert (row.verdict, row.shift_days) == ("too_late", -5)
    finally:
        db.close()


def test_a_rating_that_cannot_be_placed_is_refused_not_quietly_kept(client):
    """A rating with no place cannot be weighted, so storing it and reporting success would be
    a lie told to the beekeeper who filled the form in."""
    with patch("app.routers.public_year.forward_geocode_postal", return_value=None):
        response = client.post(f"{API}/public/calendar/feedback", json={
            "country": "DE", "postal_code": "nonsense", "device_id": "g" * 16,
            "ratings": [{"key": SOME_KEY, "verdict": "fits"}],
        })

    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "POSTAL_CODE_NOT_FOUND"
    from tests.conftest import TestingSession
    db = TestingSession()
    try:
        assert db.query(YearRating).count() == 0
    finally:
        db.close()


def test_an_unknown_entry_key_is_named_rather_than_dropped(client, geocoder):
    response = client.post(f"{API}/public/calendar/feedback", json={
        "country": "DE", "postal_code": "20095", "device_id": "h" * 16,
        "ratings": [{"key": SOME_KEY, "verdict": "fits"}, {"key": "no-such-entry", "verdict": "fits"}],
    })

    assert response.status_code == 400
    assert response.json()["detail"]["keys"] == ["no-such-entry"]
    from tests.conftest import TestingSession
    db = TestingSession()
    try:
        assert db.query(YearRating).count() == 0, "a rejected submission stores nothing at all"
    finally:
        db.close()


def test_a_place_is_required(client, geocoder):
    for missing in ({"postal_code": "20095"}, {"country": "DE"}):
        body = {"device_id": "i" * 16, "ratings": [{"key": SOME_KEY, "verdict": "fits"}], **missing}
        assert client.post(f"{API}/public/calendar/feedback", json=body).status_code == 422


def test_submissions_are_rate_limited(client, geocoder):
    """Little use to somebody filling in a form, and a nuisance to anybody manufacturing a
    region's opinion."""
    from app.routers.public_year import SUBMISSIONS_PER_HOUR

    codes = []
    for index in range(SUBMISSIONS_PER_HOUR + 2):
        codes.append(client.post(f"{API}/public/calendar/feedback", json={
            "country": "DE", "postal_code": "20095", "device_id": f"{index:016d}",
            "ratings": [{"key": SOME_KEY, "verdict": "fits"}],
        }).status_code)

    assert codes.count(201) == SUBMISSIONS_PER_HOUR
    assert codes[-1] == 429


def test_the_rating_limit_per_submission_is_enforced(client, geocoder):
    too_many = [{"key": SOME_KEY, "verdict": "fits"} for _ in range(61)]
    response = client.post(f"{API}/public/calendar/feedback", json={
        "country": "DE", "postal_code": "20095", "device_id": "j" * 16, "ratings": too_many,
    })

    assert response.status_code == 422


def test_posting_ratings_changes_nobody_s_calendar(auth_client, geocoder):
    """The whole point: a beekeeper's opinion is a proposal, and until an admin approves it the
    dates everybody sees are exactly what they were."""
    before = auth_client.get(f"{API}/calendar").json()["entries"]

    auth_client.post(f"{API}/public/calendar/feedback", json={
        "country": "DE", "postal_code": "20095", "device_id": "k" * 16,
        "ratings": [{"key": SOME_KEY, "verdict": "too_early", "shift_days": 14}],
    })

    assert auth_client.get(f"{API}/calendar").json()["entries"] == before
