import math
from datetime import datetime, date

from fastapi import APIRouter, HTTPException, Query, Request, status

from app.deps import DB, CurrentUser, OptionalUser
from app.models import HornetCatch, HornetNest, HornetSighting, HornetTrap, HornetTrapCatch
from app.rate_limit import enforce_rate_limit
from app.schemas import (
    HornetCatchCreate,
    HornetCatchOut,
    HornetNestCreate,
    HornetNestOut,
    HornetSightingCreate,
    HornetSightingOut,
    HornetStatsOut,
    HornetVote,
    HornetTrapCreate,
    HornetTrapCatchCreate,
    HornetTrapCatchOut,
    HornetTrapOut,
    HornetTrapNearbyOut,
    PaginatedResponse,
)

router = APIRouter(prefix="/hornets", tags=["hornet-tracker"])

# Precision for GPS coordinates returned on *public, unauthenticated* listing
# endpoints — ~111m at the equator. Coarse enough that a nest/sighting report
# doesn't pinpoint a reporter's exact home, fine enough that a visitor can
# still walk to the right spot to find/destroy a nest.
_PUBLIC_COORD_DECIMALS = 3


def _fuzz(v: float | None) -> float | None:
    return round(v, _PUBLIC_COORD_DECIMALS) if v is not None else None

# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------


@router.get("/stats")
def get_stats(db: DB) -> HornetStatsOut:
    from sqlalchemy import func

    total_caught = db.query(func.coalesce(func.sum(HornetCatch.count), 0)).scalar() or 0
    total_nests = db.query(func.count(HornetNest.id)).scalar() or 0
    destroyed_nests = (
        db.query(func.count(HornetNest.id))
        .filter(HornetNest.status == "destroyed")
        .scalar() or 0
    )
    pending_sightings = (
        db.query(func.count(HornetSighting.id))
        .filter(HornetSighting.status == "pending")
        .scalar() or 0
    )
    confirmed_sightings = (
        db.query(func.count(HornetSighting.id))
        .filter(HornetSighting.status == "confirmed")
        .scalar() or 0
    )
    total_traps = db.query(func.count(HornetTrap.id)).scalar() or 0
    return HornetStatsOut(
        total_caught=int(total_caught),
        total_nests=total_nests,
        destroyed_nests=destroyed_nests,
        pending_sightings=pending_sightings,
        confirmed_sightings=confirmed_sightings,
        total_traps=total_traps,
    )


# ---------------------------------------------------------------------------
# Catches
# ---------------------------------------------------------------------------


@router.post("/catches", status_code=status.HTTP_201_CREATED)
def report_catch(body: HornetCatchCreate, request: Request, db: DB) -> HornetCatchOut:
    enforce_rate_limit(db, request, "hornet_report", limit=20, window_minutes=10)
    catch = HornetCatch(
        latitude=body.latitude,
        longitude=body.longitude,
        count=body.count,
        reporter_name=body.reporter_name,
    )
    db.add(catch)
    db.commit()
    db.refresh(catch)
    return HornetCatchOut.model_validate(catch)


# ---------------------------------------------------------------------------
# Nests
# ---------------------------------------------------------------------------


@router.get("/nests")
def list_nests(db: DB) -> dict:
    """Return all nests as a GeoJSON FeatureCollection.

    Public/unauthenticated — coordinates are fuzzed and reporter_name is
    omitted (the map UI never displays it) so a citizen reporting a nest in
    their own yard doesn't have their exact home + name published.
    """
    nests = db.query(HornetNest).order_by(HornetNest.created_at.desc()).all()
    features = [
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [_fuzz(n.longitude), _fuzz(n.latitude)],
            },
            "properties": {
                "id": n.id,
                "status": n.status,
                "notes": n.notes,
                "photo_url": n.photo_url,
                "created_at": n.created_at.isoformat() if n.created_at else None,
            },
        }
        for n in nests
    ]
    return {"type": "FeatureCollection", "features": features}


@router.post("/nests", status_code=status.HTTP_201_CREATED)
def report_nest(body: HornetNestCreate, request: Request, db: DB) -> HornetNestOut:
    enforce_rate_limit(db, request, "hornet_report", limit=20, window_minutes=10)
    nest = HornetNest(
        latitude=body.latitude,
        longitude=body.longitude,
        reporter_name=body.reporter_name,
        notes=body.notes,
        photo_url=body.photo_url,
    )
    db.add(nest)
    db.commit()
    db.refresh(nest)
    return HornetNestOut.model_validate(nest)


# ---------------------------------------------------------------------------
# Sightings
# ---------------------------------------------------------------------------


@router.get("/sightings")
def list_sightings(
    db: DB,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
) -> PaginatedResponse:
    """Public/unauthenticated. reporter_name is kept — it's an intentional,
    user-opted-in attribution shown on the community page — but coordinates
    are fuzzed since they're never actually displayed, only ever fetched.
    """
    base = db.query(HornetSighting).order_by(HornetSighting.created_at.desc())
    total = base.count()
    items = base.offset((page - 1) * per_page).limit(per_page).all()
    out_items = [
        HornetSightingOut.model_validate(s).model_copy(
            update={"latitude": _fuzz(s.latitude), "longitude": _fuzz(s.longitude)}
        )
        for s in items
    ]
    return PaginatedResponse(
        items=out_items,
        total=total,
        page=page,
        per_page=per_page,
        pages=math.ceil(total / per_page) if total else 1,
    )


@router.post("/sightings", status_code=status.HTTP_201_CREATED)
def submit_sighting(body: HornetSightingCreate, request: Request, db: DB) -> HornetSightingOut:
    enforce_rate_limit(db, request, "hornet_report", limit=20, window_minutes=10)
    sighting = HornetSighting(
        photo_url=body.photo_url,
        description=body.description,
        reporter_name=body.reporter_name,
        latitude=body.latitude,
        longitude=body.longitude,
    )
    db.add(sighting)
    db.commit()
    db.refresh(sighting)
    return HornetSightingOut.model_validate(sighting)


@router.post("/sightings/{sighting_id}/vote", status_code=status.HTTP_204_NO_CONTENT)
def vote_on_sighting(sighting_id: str, body: HornetVote, db: DB):
    sighting = db.get(HornetSighting, sighting_id)
    if sighting is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "HORNET_SIGHTING_NOT_FOUND", "message": "Sighting not found."},
        )
    if body.vote == "yes":
        sighting.yes_votes += 1
    else:
        sighting.no_votes += 1

    # Auto-confirm: yes > 2× no AND total votes ≥ 5
    total_votes = sighting.yes_votes + sighting.no_votes
    if (
        sighting.status == "pending"
        and total_votes >= 5
        and sighting.yes_votes > sighting.no_votes * 2
    ):
        sighting.status = "confirmed"

    db.commit()


# ---------------------------------------------------------------------------
# Traps (issue #134)
# ---------------------------------------------------------------------------

def _trap_total_caught(trap: HornetTrap) -> int:
    return sum(c.count for c in trap.catches)


def _trap_to_out(trap: HornetTrap) -> HornetTrapOut:
    return HornetTrapOut(
        id=trap.id,
        access_code=trap.access_code,
        name=trap.name,
        latitude=trap.latitude,
        longitude=trap.longitude,
        notes=trap.notes,
        owner_name=trap.owner_name,
        created_at=trap.created_at,
        total_caught=_trap_total_caught(trap),
        catches=[HornetTrapCatchOut.model_validate(c) for c in trap.catches],
    )


@router.get("/traps")
def list_my_traps(current_user: CurrentUser, db: DB) -> list[HornetTrapOut]:
    """Return all traps owned by the authenticated user."""
    traps = (
        db.query(HornetTrap)
        .filter(HornetTrap.user_id == current_user.id)
        .order_by(HornetTrap.created_at.desc())
        .all()
    )
    return [_trap_to_out(t) for t in traps]


@router.post("/traps", status_code=status.HTTP_201_CREATED)
def create_trap(body: HornetTrapCreate, request: Request, db: DB, current_user: OptionalUser) -> HornetTrapOut:
    enforce_rate_limit(db, request, "hornet_report", limit=20, window_minutes=10)
    trap = HornetTrap(
        name=body.name,
        latitude=body.latitude,
        longitude=body.longitude,
        notes=body.notes,
        owner_name=body.owner_name,
        user_id=current_user.id if current_user else None,
    )
    db.add(trap)
    db.commit()
    db.refresh(trap)
    return _trap_to_out(trap)


@router.get("/traps/nearby")
def get_nearby_traps(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    radius_m: int = Query(50, ge=1, le=500),
    db: DB = None,
) -> list[HornetTrapNearbyOut]:
    """Return all traps within radius_m metres, sorted by distance ascending (max 20)."""
    traps = db.query(HornetTrap).all()

    results: list[HornetTrapNearbyOut] = []
    for trap in traps:
        dist = _haversine_m(lat, lon, trap.latitude, trap.longitude)
        if dist <= radius_m:
            results.append(
                HornetTrapNearbyOut(
                    access_code=trap.access_code,
                    name=trap.name,
                    latitude=trap.latitude,
                    longitude=trap.longitude,
                    distance_m=round(dist),
                    total_caught=_trap_total_caught(trap),
                )
            )

    results.sort(key=lambda r: r.distance_m)
    return results[:20]


@router.get("/traps/geojson")
def get_traps_geojson(db: DB) -> dict:
    """Return all traps as a GeoJSON FeatureCollection. Public/unauthenticated
    — coordinates are fuzzed, same rationale as list_nests above."""
    traps = db.query(HornetTrap).order_by(HornetTrap.created_at.desc()).all()
    features = [
        {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [_fuzz(t.longitude), _fuzz(t.latitude)]},
            "properties": {
                "access_code": t.access_code,
                "name": t.name,
                "total_caught": _trap_total_caught(t),
                "created_at": t.created_at.isoformat() if t.created_at else None,
            },
        }
        for t in traps
    ]
    return {"type": "FeatureCollection", "features": features}


@router.get("/traps/{access_code}")
def get_trap(access_code: str, db: DB) -> HornetTrapOut:
    trap = db.query(HornetTrap).filter(HornetTrap.access_code == access_code.upper()).first()
    if trap is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "TRAP_NOT_FOUND", "message": "Trap not found."},
        )
    return _trap_to_out(trap)


@router.post("/traps/{access_code}/catches", status_code=status.HTTP_201_CREATED)
def add_trap_catch(access_code: str, body: HornetTrapCatchCreate, request: Request, db: DB) -> HornetTrapCatchOut:
    enforce_rate_limit(db, request, "hornet_report", limit=20, window_minutes=10)
    trap = db.query(HornetTrap).filter(HornetTrap.access_code == access_code.upper()).first()
    if trap is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "TRAP_NOT_FOUND", "message": "Trap not found."},
        )
    # Upsert: one entry per (trap_id, caught_on)
    existing = (
        db.query(HornetTrapCatch)
        .filter(HornetTrapCatch.trap_id == trap.id, HornetTrapCatch.caught_on == body.caught_on)
        .first()
    )
    if existing:
        existing.count = body.count
        db.commit()
        db.refresh(existing)
        return HornetTrapCatchOut.model_validate(existing)

    catch = HornetTrapCatch(trap_id=trap.id, count=body.count, caught_on=body.caught_on)
    db.add(catch)
    db.commit()
    db.refresh(catch)
    return HornetTrapCatchOut.model_validate(catch)


# ---------------------------------------------------------------------------
# Haversine helper
# ---------------------------------------------------------------------------

def _haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Return great-circle distance in metres between two GPS points."""
    R = 6_371_000  # Earth radius in metres
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
