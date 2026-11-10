"""Implausible values are refused, and the refusal is a sentence the user can act on.

Measured before any of this existed (#446): an inspection dated in the year 3000 was stored, so
was one dated 1026, so were 5000 varroa mites, −40 kg, and an apiary at 999° north — which the
*public* community map then drew. Meanwhile the bounds that did exist answered in pydantic's
English, and `lib/api.ts` shows that text to the user, so a German beekeeper who mistyped the
frame count read "Input should be less than or equal to 10".

Every bound here is tested from both sides. A bound tested only from the rejecting side is how a
range ends up one too tight, and the first person to find out is somebody with ten brood frames
who is told they cannot have them.
"""
import re
from datetime import date, timedelta

import pytest

from app.clock import today_utc
from app.i18n import MESSAGES
from app.validation import field_label, message_for

LOCALES = ("en", "de", "fr", "es", "pl")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _hive(client):
    apiary = client.post("/api/v1/apiaries", json={"name": "Garden"}).json()
    batch = client.post("/api/v1/qr-batches", json={"count": 1}).json()
    client.post("/api/v1/hives/initialize", json={
        "qr_token": batch["tokens"][0]["token"], "apiary_id": apiary["id"], "name": "H1",
    })
    return client.get(f"/api/v1/apiaries/{apiary['id']}/hives").json()["items"][0]


def _messages(resp):
    detail = resp.json()["detail"]
    assert isinstance(detail, list), f"expected pydantic's array shape, got {detail!r}"
    return [item["msg"] for item in detail]


# ---------------------------------------------------------------------------
# The message a user reads
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("locale,expected", [
    ("en", "Brood frames: at most 10."),
    ("de", "Brutwaben: höchstens 10."),
    ("fr", "Cadres de couvain : au maximum 10."),
    ("es", "Cuadros de cría: como máximo 10."),
    ("pl", "Ramki z czerwiem: najwyżej 10."),
])
def test_the_same_mistake_is_explained_in_the_callers_language(auth_client, locale, expected):
    hive = _hive(auth_client)
    auth_client.headers.update({"Accept-Language": locale})

    resp = auth_client.post(f"/api/v1/hives/{hive['id']}/inspections",
                            json={"date": "2026-06-01", "brood_frames": 12})

    assert resp.status_code == 422
    assert _messages(resp) == [expected]


def test_no_message_is_pydantics_own_english(auth_client):
    """The exact sentence this whole module exists to get rid of."""
    hive = _hive(auth_client)
    auth_client.headers.update({"Accept-Language": "de"})

    resp = auth_client.post(f"/api/v1/hives/{hive['id']}/inspections",
                            json={"date": "2026-06-01", "brood_frames": 12, "varroa_count": 99999})

    for msg in _messages(resp):
        assert "Input should be" not in msg, msg
        assert "Value error" not in msg, msg


def test_an_unsupported_language_falls_back_to_english(auth_client):
    hive = _hive(auth_client)
    auth_client.headers.update({"Accept-Language": "it-IT,it;q=0.9"})

    resp = auth_client.post(f"/api/v1/hives/{hive['id']}/inspections",
                            json={"date": "2026-06-01", "brood_frames": 12})

    assert _messages(resp) == ["Brood frames: at most 10."]


def test_pydantics_own_fields_survive_so_a_client_can_still_mark_the_input(auth_client):
    """Only `msg` is rewritten. The clients read this shape already; `loc` is how a form knows
    which box to outline, and `type`/`ctx` are how a client could word it itself."""
    hive = _hive(auth_client)

    resp = auth_client.post(f"/api/v1/hives/{hive['id']}/inspections",
                            json={"date": "2026-06-01", "brood_frames": 12})

    item = resp.json()["detail"][0]
    assert item["loc"] == ["body", "brood_frames"]
    assert item["type"] == "less_than_equal"
    assert item["ctx"] == {"le": 10}
    assert item["input"] == 12


def test_every_rejected_field_gets_its_own_sentence(auth_client):
    hive = _hive(auth_client)
    auth_client.headers.update({"Accept-Language": "de"})

    resp = auth_client.post(f"/api/v1/hives/{hive['id']}/inspections",
                            json={"date": "2026-06-01", "brood_frames": 12, "weight_kg": -40})

    messages = _messages(resp)
    assert len(messages) == 2
    assert any("Brutwaben" in m for m in messages), messages
    assert any("Gewicht" in m for m in messages), messages


def test_a_whole_number_bound_is_not_written_as_a_decimal(auth_client):
    """"Gewicht: mindestens 0.0." reads like a bug in the app rather than a limit."""
    hive = _hive(auth_client)
    auth_client.headers.update({"Accept-Language": "de"})

    resp = auth_client.post(f"/api/v1/hives/{hive['id']}/inspections",
                            json={"date": "2026-06-01", "weight_kg": -1})

    assert _messages(resp) == ["Gewicht: mindestens 0."]


# ---------------------------------------------------------------------------
# Dates
# ---------------------------------------------------------------------------

def test_a_visit_cannot_be_recorded_in_the_future(auth_client):
    hive = _hive(auth_client)

    resp = auth_client.post(f"/api/v1/hives/{hive['id']}/inspections",
                            json={"date": "3000-06-01"})

    assert resp.status_code == 422
    assert _messages(resp) == ["Date cannot be in the future."]


def test_tomorrow_is_allowed_because_a_caller_east_of_utc_is_already_on_it(auth_client):
    """The slack is the point, not an oversight: the server counts days in UTC and has no
    timezone for the account, so a beekeeper in Auckland is legitimately on tomorrow (#443)."""
    hive = _hive(auth_client)
    tomorrow = (today_utc() + timedelta(days=1)).isoformat()

    resp = auth_client.post(f"/api/v1/hives/{hive['id']}/inspections", json={"date": tomorrow})

    assert resp.status_code == 201, resp.json()


def test_the_day_after_tomorrow_is_not(auth_client):
    hive = _hive(auth_client)
    later = (today_utc() + timedelta(days=2)).isoformat()

    resp = auth_client.post(f"/api/v1/hives/{hive['id']}/inspections", json={"date": later})

    assert resp.status_code == 422


def test_a_mistyped_year_is_refused(auth_client):
    hive = _hive(auth_client)

    resp = auth_client.post(f"/api/v1/hives/{hive['id']}/inspections",
                            json={"date": "1026-06-01"})

    assert resp.status_code == 422
    assert _messages(resp) == ["Date cannot be before 1900-01-01."]


def test_an_old_record_somebody_is_migrating_still_goes_in(auth_client):
    """The floor catches a typo, and must not have an opinion about how old a log may be."""
    hive = _hive(auth_client)

    resp = auth_client.post(f"/api/v1/hives/{hive['id']}/inspections",
                            json={"date": "1950-06-01"})

    assert resp.status_code == 201, resp.json()


def test_a_trap_catch_cannot_be_dated_in_the_future(auth_client):
    """This one is not a wrong label: a catch is one row per trap per day and the server
    overwrites that day's row, so a future date writes a reading onto a day that has not
    happened."""
    trap = auth_client.post("/api/v1/hornets/traps", json={
        "name": "Shed", "latitude": 48.1, "longitude": 11.6,
    }).json()
    auth_client.headers.update({"Accept-Language": "de"})

    resp = auth_client.post(f"/api/v1/hornets/traps/{trap['id']}/catches",
                            json={"count": 3, "caught_on": "3000-01-01"})

    assert resp.status_code == 422
    assert _messages(resp) == ["Fangdatum kann nicht in der Zukunft liegen."]


# ---------------------------------------------------------------------------
# Numbers, from both sides
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("field,allowed,refused", [
    ("brood_frames", 10, 11),
    ("brood_frames", 0, -1),
    ("honey_frames", 10, 11),
    ("population_strength", 3, 4),
    ("population_strength", 1, 0),
    ("varroa_level", 3, 4),
    ("varroa_count", 1000, 1001),
    ("varroa_count", 0, -1),
    ("weight_kg", 500, 501),
    ("weight_kg", 0, -0.5),
])
def test_the_edge_is_allowed_and_one_step_past_it_is_not(auth_client, field, allowed, refused):
    hive = _hive(auth_client)
    url = f"/api/v1/hives/{hive['id']}/inspections"

    ok = auth_client.post(url, json={"date": "2026-06-01", field: allowed})
    assert ok.status_code == 201, f"{field}={allowed} should be allowed: {ok.json()}"

    bad = auth_client.post(url, json={"date": "2026-06-02", field: refused})
    assert bad.status_code == 422, f"{field}={refused} should be refused"


# ---------------------------------------------------------------------------
# Coordinates — these reach the public map
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("latitude,longitude,ok", [
    (48.1, 11.6, True),
    (90, 180, True),
    (-90, -180, True),
    (91, 11.6, False),
    (48.1, 181, False),
    (999, 500, False),
    (-91, 11.6, False),
])
def test_an_apiary_must_be_somewhere_on_earth(auth_client, latitude, longitude, ok):
    resp = auth_client.post("/api/v1/apiaries", json={
        "name": "Somewhere", "latitude": latitude, "longitude": longitude,
    })

    if ok:
        assert resp.status_code == 201, resp.json()
    else:
        assert resp.status_code == 422, f"{latitude}/{longitude} was accepted"


def test_a_hornet_sighting_must_be_somewhere_on_earth(auth_client):
    resp = auth_client.post("/api/v1/hornets/sightings", json={
        "latitude": 999, "longitude": 500,
    })

    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# The parts, on their own
# ---------------------------------------------------------------------------

def test_a_field_without_a_label_falls_back_to_readable_english():
    # Better than a sentence with a hole in it, and adding the key is all it takes.
    assert field_label("some_new_field") == "Some new field"
    assert field_label("brood_frames", "de") == "Brutwaben"


def test_an_error_type_nobody_mapped_keeps_pydantics_wording():
    """None means "leave it alone". Flattening an unmapped rule into "This is not valid" would
    hide which rule broke, which is worse than a technical sentence that at least says."""
    assert message_for({"type": "some_future_pydantic_rule", "loc": ["body", "x"]}) is None


def test_a_validator_that_raises_plain_english_is_left_alone():
    # MoveCreate's cross-field check still raises a sentence; it has no single field to name.
    error = {
        "type": "value_error",
        "loc": ["body"],
        "ctx": {"error": ValueError("give exactly one of to_apiary_id and new_apiary")},
    }
    assert message_for(error) is None


def test_a_validator_that_raises_a_code_is_translated():
    error = {
        "type": "value_error",
        "loc": ["body", "caught_on"],
        "ctx": {"error": ValueError("VALIDATION_DATE_IN_FUTURE")},
    }
    assert message_for(error, "de") == "Fangdatum kann nicht in der Zukunft liegen."


def test_a_nested_field_is_named_by_its_own_name_not_its_position():
    error = {
        "type": "less_than_equal",
        "loc": ["body", "ratings", 0, "weight_kg"],
        "ctx": {"le": 500},
    }
    assert message_for(error, "de") == "Gewicht: höchstens 500."


# ---------------------------------------------------------------------------
# Guards: the next schema must not quietly omit a bound
# ---------------------------------------------------------------------------

SCHEMAS = __import__("pathlib").Path(__file__).resolve().parents[1] / "app" / "schemas.py"


# Response schemas whose name does not say so. A response must be able to carry a row that was
# stored before these bounds existed, so a bound here would make the API refuse to *read* its own
# data. Named individually rather than matched by a pattern: adding one is then a decision
# somebody writes down, and a new request schema cannot slip in by being named conveniently.
RESPONSES_NOT_CALLED_OUT = {
    "MovePlace": "nested inside HiveMoveOut — the two ends of a hive move",
    "TrendPoint": "a point on a statistics trend line, built by the server",
}


def _input_class_bodies():
    """Every schema a client sends, with its source."""
    text = SCHEMAS.read_text(encoding="utf-8")
    blocks = re.split(r"^class ", text, flags=re.MULTILINE)[1:]
    for block in blocks:
        name = block.split("(")[0].strip()
        if name.endswith(("Out", "Summary", "Response")) or name in RESPONSES_NOT_CALLED_OUT:
            continue
        yield name, block


def test_the_list_of_exempt_response_schemas_is_still_accurate():
    """An exemption that outlives its class is an exemption nobody notices covering something
    new with the same name."""
    text = SCHEMAS.read_text(encoding="utf-8")
    for name in RESPONSES_NOT_CALLED_OUT:
        assert re.search(rf"^class {name}\(", text, re.MULTILINE), (
            f"{name} is exempt from the bound guards but no longer exists — drop the exemption"
        )


def test_every_position_a_client_sends_is_bounded():
    loose = []
    for name, block in _input_class_bodies():
        for line in block.splitlines():
            if re.match(r"\s*(latitude|longitude)\s*:", line) and "Latitude" not in line and "Longitude" not in line:
                loose.append(f"{name}: {line.strip()}")
    assert not loose, (
        "a coordinate a client sends that is not Latitude/Longitude — 999 would be stored and "
        "drawn on the public map:\n  " + "\n  ".join(loose)
    )


# Days in a request schema that are deliberately unbounded, each with the reason.
#
# This list is the whole point of the guard below. The first version of it knew four field names
# by heart — date, caught_on, done_on, moved_on — and passed while `acquisition_date` sat
# unbounded in three schemas, because nobody had thought to add it to the list. A guard that only
# checks what somebody remembered to enumerate guards nothing. So the rule is inverted: every
# date in a request schema must be `Day` or `PlannedDay`, and an exception has to be written
# down here with why.
DAYS_DELIBERATELY_UNBOUNDED = {
    ("StatsPeriod", "from_date"): "a filter on a query, not a stored value; a silly year gives an empty result",
    ("StatsPeriod", "to_date"): "same",
    ("CalendarEntry", "start"): "built by the server from the regional calendar, not sent by a client",
    ("CalendarEntry", "end"): "same",
    ("PublicCalendarEntry", "start"): "same",
    ("PublicCalendarEntry", "end"): "same",
    ("HomeInspection", "due_on"): "part of the home summary the server builds",
    ("HomeInspection", "last_inspection_on"): "same",
}


def test_every_day_a_client_sends_is_bounded():
    loose = []
    for name, block in _input_class_bodies():
        for line in block.splitlines():
            match = re.match(r"\s*(\w+)\s*:\s*(Optional\[)?date\b", line)
            if not match:
                continue
            field = match.group(1)
            if (name, field) in DAYS_DELIBERATELY_UNBOUNDED:
                continue
            loose.append(f"{name}.{field}: {line.strip()}")
    assert not loose, (
        "a day in a request schema typed as plain `date`, so the year 3000 goes through. Use "
        "`Day` for a day that is recorded, `PlannedDay` for one that is planned, or add it to "
        "DAYS_DELIBERATELY_UNBOUNDED with the reason:\n  " + "\n  ".join(loose)
    )


def test_the_unbounded_day_exemptions_still_exist():
    """An exemption whose field was renamed stops covering anything and starts hiding the next
    field that takes its name."""
    text = SCHEMAS.read_text(encoding="utf-8")
    for (cls, field), reason in DAYS_DELIBERATELY_UNBOUNDED.items():
        match = re.search(rf"^class {cls}\(", text, re.MULTILINE)
        assert match, f"{cls} is exempt but no longer exists — drop the exemption"
        nxt = re.search(r"^class ", text[match.end():], re.MULTILINE)
        end = match.end() + nxt.start() if nxt else len(text)
        assert re.search(rf"^\s+{field}\s*:", text[match.start():end], re.MULTILINE), (
            f"{cls}.{field} is exempt but no longer exists — drop the exemption ({reason})"
        )


def test_a_colony_cannot_have_been_acquired_in_the_future(auth_client):
    """This one got past the first version of the guard, which knew four field names by heart and
    had never heard of acquisition_date — in three schemas."""
    apiary = auth_client.post("/api/v1/apiaries", json={"name": "Garden"}).json()
    batch = auth_client.post("/api/v1/qr-batches", json={"count": 1}).json()
    auth_client.headers.update({"Accept-Language": "de"})

    resp = auth_client.post("/api/v1/hives/initialize", json={
        "qr_token": batch["tokens"][0]["token"], "apiary_id": apiary["id"],
        "name": "H1", "acquisition_date": "3000-04-01",
    })

    assert resp.status_code == 422
    # Worded as the label above the box words it, taken from messages/de.json.
    assert _messages(resp) == ["Anschaffungsdatum kann nicht in der Zukunft liegen."]


def test_a_colony_acquired_long_ago_still_goes_in(auth_client):
    apiary = auth_client.post("/api/v1/apiaries", json={"name": "Garden"}).json()
    batch = auth_client.post("/api/v1/qr-batches", json={"count": 1}).json()

    resp = auth_client.post("/api/v1/hives/initialize", json={
        "qr_token": batch["tokens"][0]["token"], "apiary_id": apiary["id"],
        "name": "H1", "acquisition_date": "1985-04-01",
    })

    assert resp.status_code == 201, resp.json()


def test_a_treatment_cannot_be_planned_for_the_year_3000(auth_client):
    """PlannedDay has no ceiling at today — it would make planning impossible — but a treatment
    due in a thousand years is the same typo in the other direction."""
    hive = _hive(auth_client)

    resp = auth_client.post("/api/v1/treatments", json={
        "hive_id": hive["id"], "product": "Formic acid", "due_on": "3000-07-20",
    })

    assert resp.status_code == 422
    assert "cannot be after" in _messages(resp)[0], _messages(resp)


def test_a_treatment_cannot_be_planned_for_the_year_1026(auth_client):
    hive = _hive(auth_client)

    resp = auth_client.post("/api/v1/treatments", json={
        "hive_id": hive["id"], "product": "Formic acid", "due_on": "1026-07-20",
    })

    assert resp.status_code == 422


def test_a_planned_treatment_may_still_be_due_in_the_future(auth_client):
    """The bound is on days that already happened. This is here because the obvious next move
    after this change is to put `Day` on every date field, and that would make it impossible to
    plan anything — a planned treatment is due precisely in the future."""
    hive = _hive(auth_client)
    next_year = date(today_utc().year + 1, 7, 20).isoformat()

    resp = auth_client.post("/api/v1/treatments", json={
        "hive_id": hive["id"], "product": "Formic acid", "due_on": next_year,
    })

    assert resp.status_code == 201, resp.json()


def test_every_validation_sentence_and_field_name_exists_in_five_languages():
    # test_i18n_completeness.py covers this for all of MESSAGES; this says out loud that the new
    # entries are inside it rather than in a module with no guard of its own.
    new = [code for code in MESSAGES if code.startswith(("VALIDATION_", "FIELD_"))]
    assert len(new) > 35, f"only {len(new)} found — did they move out of MESSAGES?"
    for code in new:
        missing = [loc for loc in LOCALES if not MESSAGES[code].get(loc, "").strip()]
        assert not missing, f"{code} has no text for {missing}"


def test_every_sentence_with_a_limit_keeps_the_placeholder_in_every_language():
    """A translation that drops {limit} produces "Brutwaben: höchstens ." and nobody notices
    until a user hits that exact bound in that exact language."""
    for code, texts in MESSAGES.items():
        if not code.startswith("VALIDATION_"):
            continue
        for locale, text in texts.items():
            if "{limit}" in texts["en"]:
                assert "{limit}" in text, f"{code}/{locale} lost {{limit}}"
            if "{field}" in texts["en"]:
                assert "{field}" in text, f"{code}/{locale} lost {{field}}"
