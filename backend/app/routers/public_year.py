"""The beekeeping-year questionnaire: open to anybody, no account.

The 38 entries were written for central Germany and moved elsewhere by the formula in
`app/season.py`. That formula is a guess, and nobody has checked it against what beekeepers in
those places actually do. This is how they say so — without registering first, because asking
somebody to open an account before they may correct your calendar is how you get no corrections.

Nothing posted here changes a date. `app/year_feedback.py` groups the ratings, `routers/admin.py`
offers the groups, and only an admin's decision reaches a calendar.

Privacy is the shape of the data, not a notice: the country and a position rounded to about 11 km
are stored, the postal code is looked up once and dropped, and nothing links a rating to an
account. See "The questionnaire" in the API contract.
"""
from datetime import date
from typing import Optional

from fastapi import APIRouter, Header, HTTPException, Query, Request, status

from app import season, year_feedback
from app.beekeeping_year import ENTRIES
from app.deps import DB
from app.i18n import error
from app.models import YearRating
from app.rate_limit import enforce_rate_limit
from app.schemas import (
    PublicCalendarEntry, PublicCalendarOut, YearFeedbackIn, YearFeedbackOut,
)
from app.utils.geocoding import forward_geocode_postal

router = APIRouter(prefix="/public/calendar", tags=["beekeeping-year"])

# The questionnaire rates the year, not a window of it, so one whole year is returned. A
# non-leap year, because 02-29 is not a date the calendar's content ever means.
REFERENCE_YEAR = 2026

# Five an hour is plenty for somebody filling in a questionnaire, and little use to anybody
# trying to manufacture a region's opinion.
SUBMISSIONS_PER_HOUR = 5


def _entry_keys() -> set[str]:
    return {entry.key for entry in ENTRIES}


def _locate(country: Optional[str], postal_code: Optional[str]) -> tuple[Optional[float], Optional[float], bool]:
    """The position of a postal code, and whether asking for one worked.

    `located` is only false when a place was asked for and not found — giving no place at all is
    not a failure on `GET`, it just means the dates stay where they were written.
    """
    if not (country and postal_code):
        return None, None, True
    found = forward_geocode_postal(country, postal_code)
    if found is None:
        return None, None, False
    return found.latitude, found.longitude, True


@router.get("", response_model=PublicCalendarOut)
def public_calendar(
    db: DB,
    lang: Optional[str] = Query(default=None, description="Language of the texts; default: Accept-Language"),
    country: Optional[str] = Query(default=None, max_length=8),
    postal_code: Optional[str] = Query(default=None, max_length=20),
    accept_language: Optional[str] = Header(default=None),
) -> PublicCalendarOut:
    country = (country or "").strip().upper() or None
    postal_code = " ".join((postal_code or "").split()) or None
    latitude, longitude, located = _locate(country, postal_code)
    shift = season.shift_days(latitude, longitude)
    language = season.pick_language(lang, accept_language)

    first = date(REFERENCE_YEAR, 1, 1)
    last = date(REFERENCE_YEAR, 12, 31)
    # `today` outside the window: the questionnaire has no "happening now", and a reference year
    # that is not this one would mark the wrong entries anyway.
    items = season.timeline(first, last, shift, language, date(REFERENCE_YEAR - 1, 1, 1))

    entries = [
        PublicCalendarEntry(
            key=item["key"], category=item["category"], title=item["title"], body=item["body"],
            start=item["start"], end=item["end"], interval_days=item["interval_days"],
            honey=item["honey"],
        )
        for item in items
    ]
    # One run per entry: a window of exactly one year can still catch two runs of an entry that
    # crosses New Year, and a questionnaire must not ask the same question twice.
    seen: set[str] = set()
    unique = [entry for entry in entries if not (entry.key in seen or seen.add(entry.key))]

    return PublicCalendarOut(shift_days=shift, located=located, entries=unique)


@router.post("/feedback", response_model=YearFeedbackOut, status_code=status.HTTP_201_CREATED)
def submit_feedback(
    body: YearFeedbackIn,
    request: Request,
    db: DB,
    accept_language: Optional[str] = Header(default=None),
) -> YearFeedbackOut:
    enforce_rate_limit(db, request, "year-feedback", limit=SUBMISSIONS_PER_HOUR, window_minutes=60)

    known = _entry_keys()
    unknown = [rating.key for rating in body.ratings if rating.key not in known]
    if unknown:
        # Named, not silently dropped: a client sending a stale key should find out, not have its
        # ratings quietly vanish into a success response.
        detail = error("UNKNOWN_CALENDAR_ENTRY", accept_language)
        detail["keys"] = sorted(unknown)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)

    latitude, longitude, located = _locate(body.country, body.postal_code)
    if not located or latitude is None or longitude is None:
        # The one thing this endpoint cannot use. Refusing is kinder than storing something
        # unusable and reporting success.
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error("POSTAL_CODE_NOT_FOUND", accept_language),
        )

    latitude, longitude = year_feedback.round_position(latitude, longitude)
    device_hash = year_feedback.hash_device(body.device_id)

    existing = {
        row.entry_key: row
        for row in db.query(YearRating).filter(YearRating.device_hash == device_hash).all()
    }
    replaced = 0
    for rating in body.ratings:
        row = existing.get(rating.key)
        if row is None:
            db.add(YearRating(
                entry_key=rating.key, verdict=rating.verdict, shift_days=rating.shift_days,
                note=rating.note, country=body.country, latitude=latitude, longitude=longitude,
                years_keeping=body.years_keeping, device_hash=device_hash,
            ))
            continue
        # The same browser changing its mind: one beekeeper, one voice per entry.
        row.verdict = rating.verdict
        row.shift_days = rating.shift_days
        row.note = rating.note
        row.country = body.country
        row.latitude = latitude
        row.longitude = longitude
        row.years_keeping = body.years_keeping
        replaced += 1
    db.commit()

    return YearFeedbackOut(accepted=len(body.ratings), replaced=replaced, located=True)
