"""Moves the beekeeper's year to the beekeeper's place, and lays it out as a timeline.

The calendar in `beekeeping_year.py` is written for central Germany. Nature runs earlier in the south and
the west and later in the north and the east: phenologists put it at about four days per degree of
latitude and four days per five degrees of longitude (Hopkins' bioclimatic law, which also has about four
days per 120 m of altitude; the altitude is not known from a postal code, which is why the beekeeper can
add days by hand). That is a good guide for a week or two, not more, and the clients say so.
"""
from __future__ import annotations

from datetime import date, timedelta
from typing import Iterator, Optional

from app.beekeeping_year import ENTRIES, Entry, LANGUAGES

# Frankfurt am Main: the place the calendar's dates are written for.
REFERENCE_LATITUDE = 50.1
REFERENCE_LONGITUDE = 8.7

DAYS_PER_DEGREE_LATITUDE = 4.0
DAYS_PER_DEGREE_LONGITUDE = 0.8
# Beyond this the rule is guesswork (the Mediterranean, the far north); the beekeeper adjusts by hand.
MAX_SHIFT_DAYS = 30
MAX_ADJUST_DAYS = 28


def shift_days(latitude: Optional[float], longitude: Optional[float], adjust_days: int = 0) -> int:
    """Days to move the reference dates: positive is later. Without a position, only the adjustment."""
    adjust = max(-MAX_ADJUST_DAYS, min(MAX_ADJUST_DAYS, adjust_days or 0))
    if latitude is None or longitude is None:
        return adjust
    raw = (
        DAYS_PER_DEGREE_LATITUDE * (latitude - REFERENCE_LATITUDE)
        + DAYS_PER_DEGREE_LONGITUDE * (longitude - REFERENCE_LONGITUDE)
    )
    return round(max(-MAX_SHIFT_DAYS, min(MAX_SHIFT_DAYS, raw))) + adjust


def pick_language(*candidates: Optional[str]) -> str:
    """The first supported language among the candidates: `de`, `de-AT` or a whole Accept-Language header."""
    for candidate in candidates:
        for part in (candidate or "").split(","):
            tag = part.strip().split(";")[0].strip()[:2].lower()
            if tag in LANGUAGES:
                return tag
    return "en"


def _month_day(text: str) -> tuple[int, int]:
    month, day = text.split("-")
    return int(month), int(day)


def occurrences(entry: Entry, first: date, last: date, shift: int) -> Iterator[tuple[date, date]]:
    """Every run of the entry, moved by `shift` days, that touches the window [first, last]."""
    start_month, start_day = _month_day(entry.start)
    end_month, end_day = _month_day(entry.end)
    wraps = (end_month, end_day) < (start_month, start_day)
    delta = timedelta(days=shift)
    # One year before: a run over New Year or a large shift can reach into the window from the year before.
    for year in range(first.year - 1, last.year + 1):
        start = date(year, start_month, start_day) + delta
        end = date(year + (1 if wraps else 0), end_month, end_day) + delta
        if end >= first and start <= last:
            yield start, end


def timeline(first: date, last: date, shift: int, language: str, today: date) -> list[dict]:
    """The entries of the window, oldest first, in the language, with what is going on today marked."""
    items: list[dict] = []
    for entry in ENTRIES:
        for start, end in occurrences(entry, first, last, shift):
            items.append({
                "key": entry.key,
                "category": entry.category,
                "title": entry.title[language],
                "body": entry.body[language],
                "start": start,
                "end": end,
                "interval_days": entry.interval_days,
                "honey": entry.honey,
                "active": start <= today <= end,
            })
    items.sort(key=lambda item: (item["start"], item["key"]))
    return items
