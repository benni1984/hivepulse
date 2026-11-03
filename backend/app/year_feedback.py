"""Turning what beekeepers say about the beekeeping year into corrections an admin can approve.

The dates in `beekeeping_year.py` are written for central Germany and moved elsewhere by the
formula in `season.py`. That formula is a guess. This module takes the ratings a questionnaire
collected and works out what the beekeepers of a place actually say — but only as a proposal:
nothing here writes to anybody's calendar. `routers/admin.py` offers the proposals and an admin
decides.

Why the numbers are what they are:

* **150 km** is a region in the sense that matters here. Hopkins' law puts four days on a degree
  of latitude, so 150 km north-south is worth about five days of season — small enough that the
  beekeepers inside one group are talking about the same spring.
* **5 ratings** is the smallest group worth showing an admin. Below that one opinionated beekeeper
  is the group.
* The **median**, not the mean, for the same reason: somebody who types -60 should not drag a
  group that otherwise says -7.
"""
from __future__ import annotations

import hashlib
import math
from collections import Counter
from dataclasses import dataclass
from typing import Iterable, Optional, Sequence

# Ratings this far apart are still talking about the same season.
GROUP_RADIUS_KM = 150
# Below this a group is one beekeeper's opinion, not a region's.
MIN_RATINGS = 5
# Positions are stored this coarse: one decimal is about 11 km of latitude. Enough to group a
# region, far too coarse to point at an apiary.
POSITION_DECIMALS = 1
EARTH_RADIUS_KM = 6371.0

SHIFT_VERDICTS = ("too_early", "too_late")


def round_position(latitude: float, longitude: float) -> tuple[float, float]:
    """The only position ever stored for a rating."""
    return round(latitude, POSITION_DECIMALS), round(longitude, POSITION_DECIMALS)


def hash_device(device_id: str) -> str:
    """What is stored instead of the client's own string.

    Not an identity and not meant to be reversible — it exists so a second submission from the
    same browser replaces the first instead of counting twice.
    """
    return hashlib.sha256(device_id.encode("utf-8")).hexdigest()


def distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance. Plain haversine: at these distances it is well under a kilometre out."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = phi2 - phi1
    d_lambda = math.radians(lon2 - lon1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return 2 * EARTH_RADIUS_KM * math.asin(min(1.0, math.sqrt(a)))


def median(values: Sequence[float]) -> Optional[float]:
    ordered = sorted(values)
    if not ordered:
        return None
    middle = len(ordered) // 2
    if len(ordered) % 2:
        return float(ordered[middle])
    return (ordered[middle - 1] + ordered[middle]) / 2


@dataclass(frozen=True)
class Rating:
    """What the grouping needs of a stored rating — not the database row."""

    entry_key: str
    verdict: str
    shift_days: Optional[int]
    note: Optional[str]
    country: Optional[str]
    latitude: float
    longitude: float


@dataclass(frozen=True)
class Proposal:
    entry_key: str
    kind: str  # "shift" or "hide"
    shift_days: Optional[int]
    rating_count: int
    latitude: float
    longitude: float
    radius_km: int
    country: Optional[str]
    verdict_counts: dict[str, int]
    shift_days_range: Optional[tuple[int, int]]
    notes: tuple[str, ...]


def _group(ratings: Sequence[Rating]) -> list[list[Rating]]:
    """Ratings of one entry into groups no wider than the radius.

    Greedy on purpose, seeded by the densest position first, so the biggest real cluster forms
    before the stragglers do. Proper clustering would be nicer and is not worth it: the positions
    are already rounded to an 11 km grid, so there are few distinct ones.
    """
    remaining = list(ratings)
    groups: list[list[Rating]] = []
    while remaining:
        # Seed with the position that has the most neighbours within the radius.
        seed = max(
            remaining,
            key=lambda candidate: sum(
                1
                for other in remaining
                if distance_km(candidate.latitude, candidate.longitude, other.latitude, other.longitude)
                <= GROUP_RADIUS_KM
            ),
        )
        near = [
            rating
            for rating in remaining
            if distance_km(seed.latitude, seed.longitude, rating.latitude, rating.longitude)
            <= GROUP_RADIUS_KM
        ]
        groups.append(near)
        remaining = [rating for rating in remaining if rating not in near]
    return groups


def _centre(group: Sequence[Rating]) -> tuple[float, float]:
    latitude = sum(rating.latitude for rating in group) / len(group)
    longitude = sum(rating.longitude for rating in group) / len(group)
    return round_position(latitude, longitude)


def _dominant_country(group: Sequence[Rating]) -> Optional[str]:
    counts = Counter(rating.country for rating in group if rating.country)
    return counts.most_common(1)[0][0] if counts else None


def propose(ratings: Iterable[Rating]) -> list[Proposal]:
    """Every correction the ratings support, one per entry and region.

    A group whose majority says the entry does not apply proposes hiding it; otherwise, if enough
    of the group gave a direction, it proposes the median correction. A group that mostly says
    "fits" proposes nothing, which is the point of asking.
    """
    by_entry: dict[str, list[Rating]] = {}
    for rating in ratings:
        by_entry.setdefault(rating.entry_key, []).append(rating)

    proposals: list[Proposal] = []
    for entry_key in sorted(by_entry):
        for group in _group(by_entry[entry_key]):
            if len(group) < MIN_RATINGS:
                continue
            counts = Counter(rating.verdict for rating in group)
            verdict_counts = {
                verdict: counts.get(verdict, 0)
                for verdict in ("fits", "too_early", "too_late", "wrong")
            }
            latitude, longitude = _centre(group)
            notes = tuple(rating.note for rating in group if rating.note)
            country = _dominant_country(group)

            if counts.get("wrong", 0) * 2 > len(group):
                proposals.append(Proposal(
                    entry_key=entry_key, kind="hide", shift_days=None, rating_count=len(group),
                    latitude=latitude, longitude=longitude, radius_km=GROUP_RADIUS_KM,
                    country=country, verdict_counts=verdict_counts, shift_days_range=None,
                    notes=notes,
                ))
                continue

            # Only a rating that says which way, and by how much, can move a date.
            shifts = [
                rating.shift_days
                for rating in group
                if rating.verdict in SHIFT_VERDICTS and rating.shift_days is not None
            ]
            if len(shifts) * 2 <= len(group):
                # Most of the group is content, or nobody said by how much: leave the date alone.
                continue
            middle = median(shifts)
            if middle is None or round(middle) == 0:
                continue
            proposals.append(Proposal(
                entry_key=entry_key, kind="shift", shift_days=int(round(middle)),
                rating_count=len(group), latitude=latitude, longitude=longitude,
                radius_km=GROUP_RADIUS_KM, country=country, verdict_counts=verdict_counts,
                shift_days_range=(min(shifts), max(shifts)), notes=notes,
            ))
    return proposals


@dataclass(frozen=True)
class ApprovedCorrection:
    """An approved proposal, as the calendar needs it."""

    entry_key: str
    kind: str
    shift_days: Optional[int]
    rating_count: int
    latitude: float
    longitude: float
    radius_km: int


def corrections_for(
    corrections: Iterable[ApprovedCorrection],
    latitude: Optional[float],
    longitude: Optional[float],
) -> dict[str, ApprovedCorrection]:
    """The approved corrections that cover a place, by entry key.

    Without a position nothing applies: a correction is a statement about somewhere. When two
    cover the same place, the nearer one wins — it is the more specific statement.
    """
    if latitude is None or longitude is None:
        return {}
    best: dict[str, tuple[float, ApprovedCorrection]] = {}
    for correction in corrections:
        away = distance_km(latitude, longitude, correction.latitude, correction.longitude)
        if away > correction.radius_km:
            continue
        current = best.get(correction.entry_key)
        if current is None or away < current[0]:
            best[correction.entry_key] = (away, correction)
    return {key: correction for key, (_, correction) in best.items()}
