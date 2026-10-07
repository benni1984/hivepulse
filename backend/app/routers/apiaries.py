import math
from typing import Optional

from fastapi import APIRouter, Header, HTTPException, Query
from sqlalchemy.orm import Session

from app.access import OWNER, PARTIAL, Scope, apiary_or_404, remove_shares
from app.deps import CurrentUser, DB
from app.i18n import error
from app.models import Apiary, HiveMove
from app.schemas import ApiaryCreate, ApiaryOut, ApiaryUpdate, PaginatedResponse
from app.utils.geocoding import forward_geocode, reverse_geocode_city

router = APIRouter(prefix="/apiaries", tags=["apiaries"])


def _maybe_geocode(apiary: Apiary, db: Session) -> None:
    """Populate city_* columns when apiary is public and has GPS coordinates.

    The web dashboard never collects lat/lng directly, only a free-text
    address, so an apiary with an address but no coordinates yet is forward-
    geocoded first — without this, every web-created public apiary would be
    counted in /public/stats totals but never appear as a map pin.
    """
    if apiary.is_public and apiary.latitude is None and apiary.longitude is None and apiary.address:
        coords = forward_geocode(apiary.address)
        if coords:
            apiary.latitude = coords.latitude
            apiary.longitude = coords.longitude

    if apiary.is_public and apiary.latitude is not None and apiary.longitude is not None:
        result = reverse_geocode_city(apiary.latitude, apiary.longitude)
        if result:
            apiary.city_name = result.name
            apiary.city_latitude = result.latitude
            apiary.city_longitude = result.longitude
        else:
            apiary.city_name = None
            apiary.city_latitude = round(apiary.latitude, 1)
            apiary.city_longitude = round(apiary.longitude, 1)
    else:
        apiary.city_name = None
        apiary.city_latitude = None
        apiary.city_longitude = None
    db.commit()
    db.refresh(apiary)


def _to_out(apiary: Apiary, scope: Scope) -> ApiaryOut:
    access = scope.apiary_access(apiary)
    # Seen only through single shared hives, an apiary shows its name and nothing else: the
    # address and the notes belong to the owner, and the contract promises the name.
    partial = access == PARTIAL
    return ApiaryOut(
        id=apiary.id,
        name=apiary.name,
        description=None if partial else apiary.description,
        latitude=None if partial else apiary.latitude,
        longitude=None if partial else apiary.longitude,
        address=None if partial else apiary.address,
        # Somebody who only has one hive of it shared must not learn how many others there are.
        hive_count=len(scope.hives_in(apiary)),
        is_public=apiary.is_public,
        access=access,
        owner_name=None if access == OWNER else apiary.user.name,
        created_at=apiary.created_at,
    )


@router.get("", response_model=PaginatedResponse)
def list_apiaries(
    current_user: CurrentUser,
    db: DB,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    scope = Scope(db, current_user)
    q = db.query(Apiary).filter(scope.apiary_filter())
    total = q.count()
    items = q.offset((page - 1) * per_page).limit(per_page).all()
    return PaginatedResponse(
        items=[_to_out(a, scope) for a in items],
        total=total,
        page=page,
        per_page=per_page,
        pages=math.ceil(total / per_page) if total else 0,
    )


@router.post("", response_model=ApiaryOut, status_code=201)
def create_apiary(body: ApiaryCreate, current_user: CurrentUser, db: DB):
    apiary = Apiary(user_id=current_user.id, **body.model_dump())
    db.add(apiary)
    db.commit()
    db.refresh(apiary)
    _maybe_geocode(apiary, db)
    return _to_out(apiary, Scope(db, current_user))


@router.get("/{apiary_id}", response_model=ApiaryOut)
def get_apiary(
    apiary_id: str,
    current_user: CurrentUser,
    db: DB,
    accept_language: Optional[str] = Header(default=None),
):
    apiary, _, scope = apiary_or_404(db, current_user, apiary_id, accept_language)
    return _to_out(apiary, scope)


@router.put("/{apiary_id}", response_model=ApiaryOut)
def update_apiary(
    apiary_id: str,
    body: ApiaryUpdate,
    current_user: CurrentUser,
    db: DB,
    accept_language: Optional[str] = Header(default=None),
):
    apiary, access, scope = apiary_or_404(db, current_user, apiary_id, accept_language, need="edit")
    changes = body.model_dump(exclude_unset=True)
    # Whether the apiary appears on the public map is the owner's decision alone: it exposes
    # the location of something a collaborator was only asked to help look after.
    if access != OWNER and changes.get("is_public", apiary.is_public) != apiary.is_public:
        raise HTTPException(403, detail=error("OWNER_ONLY", accept_language))
    for field, value in changes.items():
        setattr(apiary, field, value)
    db.commit()
    db.refresh(apiary)
    _maybe_geocode(apiary, db)
    return _to_out(apiary, scope)


@router.delete("/{apiary_id}", status_code=204)
def delete_apiary(
    apiary_id: str,
    current_user: CurrentUser,
    db: DB,
    accept_language: Optional[str] = Header(default=None),
):
    apiary, _, _ = apiary_or_404(db, current_user, apiary_id, accept_language, need="owner")
    if apiary.hives:
        raise HTTPException(409, detail=error("APIARY_HAS_HIVES", accept_language))
    remove_shares(db, apiary_id=apiary.id)
    # The history keeps its copy of the name and the position; only the link to the apiary goes.
    db.query(HiveMove).filter(HiveMove.from_apiary_id == apiary.id).update(
        {HiveMove.from_apiary_id: None}, synchronize_session=False)
    db.query(HiveMove).filter(HiveMove.to_apiary_id == apiary.id).update(
        {HiveMove.to_apiary_id: None}, synchronize_session=False)
    db.delete(apiary)
    db.commit()
