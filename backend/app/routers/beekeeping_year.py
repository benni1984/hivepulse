"""The beekeeper's year: a timeline of what to do when, moved to the beekeeper's place.

See "Beekeeping Year" in the API contract. The content is `app/beekeeping_year.py`, the arithmetic
`app/season.py`; this file only reads and stores the region and serves the window the client asks for.
"""
from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Header, Query

from app import season, year_feedback
from app.deps import CurrentUser, DB
from app.models import Apiary, User, YearProposal
from app.schemas import CalendarEntry, CalendarOut, RegionOut, RegionUpdate
from app.utils.geocoding import forward_geocode_postal

router = APIRouter(tags=["beekeeping-year"])

MAX_WINDOW_DAYS = 800


def region_of(user: User, db) -> RegionOut:
    """Where the user keeps bees: the looked-up postal code, else the first apiary with a position, else nowhere."""
    latitude, longitude, source = user.region_latitude, user.region_longitude, "postal_code"
    if latitude is None or longitude is None:
        apiary = (
            db.query(Apiary)
            .filter(Apiary.user_id == user.id, Apiary.latitude.isnot(None), Apiary.longitude.isnot(None))
            .order_by(Apiary.created_at)
            .first()
        )
        if apiary is not None:
            latitude, longitude, source = apiary.latitude, apiary.longitude, "apiary"
        else:
            latitude = longitude = None
            source = "default"
    adjust = user.region_adjust_days or 0
    asked_for_a_place = bool(user.country and user.postal_code)
    return RegionOut(
        country=user.country,
        postal_code=user.postal_code,
        latitude=latitude,
        longitude=longitude,
        adjust_days=adjust,
        shift_days=season.shift_days(latitude, longitude, adjust),
        source=source,
        located=not asked_for_a_place or (user.region_latitude is not None and user.region_longitude is not None),
    )


@router.get("/users/me/region", response_model=RegionOut)
def get_region(current_user: CurrentUser, db: DB) -> RegionOut:
    return region_of(current_user, db)


@router.put("/users/me/region", response_model=RegionOut)
def update_region(body: RegionUpdate, current_user: CurrentUser, db: DB) -> RegionOut:
    changed_place = False
    if body.country is not None:
        current_user.country = body.country or None
        changed_place = True
    if body.postal_code is not None:
        current_user.postal_code = body.postal_code or None
        changed_place = True
    if body.adjust_days is not None:
        current_user.region_adjust_days = body.adjust_days

    if changed_place:
        # The postal code is looked up once and only the position kept; a code that cannot be found
        # leaves the beekeeper on the first apiary's position (or none) and the answer says so.
        current_user.region_latitude = current_user.region_longitude = None
        if current_user.country and current_user.postal_code:
            found = forward_geocode_postal(current_user.country, current_user.postal_code)
            if found is not None:
                current_user.region_latitude = found.latitude
                current_user.region_longitude = found.longitude
    db.commit()
    db.refresh(current_user)
    return region_of(current_user, db)


def _approved_corrections(db, latitude: Optional[float], longitude: Optional[float]) -> dict:
    """What beekeepers of this place said the formula gets wrong here, after an admin agreed.

    Only `approved` rows are read: a proposal nobody has looked at, and one that was turned down,
    must not reach a single calendar. Without a position nothing applies — a correction is a
    statement about somewhere.
    """
    if latitude is None or longitude is None:
        return {}
    rows = db.query(YearProposal).filter(YearProposal.status == "approved").all()
    return year_feedback.corrections_for(
        (
            year_feedback.ApprovedCorrection(
                entry_key=row.entry_key, kind=row.kind, shift_days=row.shift_days,
                rating_count=row.rating_count, latitude=row.latitude, longitude=row.longitude,
                radius_km=row.radius_km,
            )
            for row in rows
        ),
        latitude,
        longitude,
    )


@router.get("/calendar", response_model=CalendarOut)
def get_calendar(
    current_user: CurrentUser,
    db: DB,
    start: Optional[date] = Query(default=None, alias="from", description="First day; default: the first of this month"),
    days: int = Query(default=120, ge=1, le=MAX_WINDOW_DAYS),
    lang: Optional[str] = Query(default=None, description="Language of the texts; default: Accept-Language, then the account's"),
    accept_language: Optional[str] = Header(default=None),
) -> CalendarOut:
    today = date.today()
    first = start or today.replace(day=1)
    last = first + timedelta(days=days - 1)
    region = region_of(current_user, db)
    language = season.pick_language(lang, accept_language, current_user.locale)
    items = season.timeline(
        first, last, region.shift_days, language, today,
        corrections=_approved_corrections(db, region.latitude, region.longitude),
    )
    return CalendarOut(
        region=region,
        today=today,
        start=first,
        end=last,
        entries=[CalendarEntry(**item) for item in items],
    )
