"""Moving hives from one apiary to another, with the history. See "Moving Hives" in the API contract."""
import logging
from datetime import date
from typing import Optional

from fastapi import APIRouter, Header, HTTPException, Query
from sqlalchemy import select

from app.access import OWNER, Scope, apiary_or_404, hive_or_404
from app.deps import CurrentUser, DB
from app.i18n import error
from app.models import Apiary, Hive, HiveMove
from app.routers.apiaries import _to_out
from app.schemas import HiveMoveOut, MoveCreate, MovePlace, MoveResult
from app.utils.geocoding import forward_geocode

logger = logging.getLogger(__name__)

router = APIRouter(tags=["moves"])


def _out(move: HiveMove) -> HiveMoveOut:
    return HiveMoveOut(
        id=move.id,
        hive_id=move.hive_id,
        hive_name=move.hive.name,
        moved_on=move.moved_on,
        forage=move.forage,
        note=move.note,
        **{"from": MovePlace(
            apiary_id=move.from_apiary_id, name=move.from_name,
            latitude=move.from_latitude, longitude=move.from_longitude,
        )},
        to=MovePlace(
            apiary_id=move.to_apiary_id, name=move.to_name,
            latitude=move.to_latitude, longitude=move.to_longitude,
        ),
        created_by_name=move.created_by.name if move.created_by else None,
        created_at=move.created_at,
    )


def _locate(apiary: Apiary) -> None:
    """Gives an apiary that has an address but no position one, if the lookup finds it.

    The map needs coordinates and the web dashboard only ever collects an address. A failed lookup
    is not an error: the move goes through and simply is not drawn.
    """
    if apiary.latitude is None and apiary.longitude is None and apiary.address:
        found = forward_geocode(apiary.address)
        if found:
            apiary.latitude = found.latitude
            apiary.longitude = found.longitude


@router.post("/hives/move", response_model=MoveResult, status_code=201)
def move_hives(
    body: MoveCreate,
    current_user: CurrentUser,
    db: DB,
    accept_language: Optional[str] = Header(default=None),
):
    scope = Scope(db, current_user)

    # Everything is checked before anything is changed: a move either happens for all the hives or not at all.
    hives: list[Hive] = []
    for hive_id in dict.fromkeys(body.hive_ids):
        hive = db.get(Hive, hive_id)
        access = scope.hive_access(hive) if hive else None
        if access is None:
            raise HTTPException(404, detail=error("HIVE_NOT_FOUND", accept_language))
        if access != OWNER:
            raise HTTPException(403, detail=error("OWNER_ONLY", accept_language))
        hives.append(hive)

    if body.to_apiary_id:
        target, _, _ = apiary_or_404(db, current_user, body.to_apiary_id, accept_language, need="owner")
        to_move = [h for h in hives if h.apiary_id != target.id]
        if not to_move:
            raise HTTPException(400, detail=error("NOTHING_TO_MOVE", accept_language))
    else:
        to_move = hives
        target = Apiary(
            user_id=current_user.id,
            name=body.new_apiary.name.strip(),
            address=body.new_apiary.address,
            latitude=body.new_apiary.latitude,
            longitude=body.new_apiary.longitude,
        )
        db.add(target)
        db.flush()

    _locate(target)

    moved_on = body.moved_on or date.today()
    moves: list[HiveMove] = []
    for hive in to_move:
        origin = hive.apiary
        move = HiveMove(
            hive_id=hive.id,
            from_apiary_id=origin.id,
            to_apiary_id=target.id,
            moved_on=moved_on,
            forage=(body.forage or "").strip() or None,
            note=(body.note or "").strip() or None,
            from_name=origin.name, from_latitude=origin.latitude, from_longitude=origin.longitude,
            to_name=target.name, to_latitude=target.latitude, to_longitude=target.longitude,
            created_by_id=current_user.id,
        )
        db.add(move)
        moves.append(move)
        hive.apiary_id = target.id

    db.commit()
    db.refresh(target)
    for move in moves:
        db.refresh(move)
    return MoveResult(moved=len(moves), apiary=_to_out(target, Scope(db, current_user)),
                      moves=[_out(m) for m in moves])


@router.get("/hives/moves/overview", response_model=list[HiveMoveOut])
def moves_overview(
    current_user: CurrentUser,
    db: DB,
    from_date: Optional[date] = Query(default=None, alias="from"),
    to_date: Optional[date] = Query(default=None, alias="to"),
):
    """Every move of every hive the caller owns, for the map of all journeys."""
    owned_hives = select(Hive.id).where(
        Hive.apiary_id.in_(select(Apiary.id).where(Apiary.user_id == current_user.id))
    )
    query = db.query(HiveMove).filter(HiveMove.hive_id.in_(owned_hives))
    if from_date:
        query = query.filter(HiveMove.moved_on >= from_date)
    if to_date:
        query = query.filter(HiveMove.moved_on <= to_date)
    moves = query.order_by(HiveMove.moved_on.desc(), HiveMove.created_at.desc()).all()
    return [_out(m) for m in moves]


@router.get("/hives/{hive_id}/moves", response_model=list[HiveMoveOut])
def hive_moves(
    hive_id: str,
    current_user: CurrentUser,
    db: DB,
    accept_language: Optional[str] = Header(default=None),
):
    hive, _, _ = hive_or_404(db, current_user, hive_id, accept_language)
    moves = (
        db.query(HiveMove)
        .filter(HiveMove.hive_id == hive.id)
        .order_by(HiveMove.moved_on.desc(), HiveMove.created_at.desc())
        .all()
    )
    return [_out(m) for m in moves]
