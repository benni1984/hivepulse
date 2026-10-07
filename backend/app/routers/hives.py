import io
import math
from typing import Optional, Union

from fastapi import APIRouter, Header, HTTPException, Query
from fastapi.responses import StreamingResponse

from app.utils.qr import make_qr_png

from app.access import PARTIAL, Scope, apiary_or_404, hive_or_404, remove_shares
from app.deps import CurrentUser, DB
from app.i18n import error
from app.models import Hive, PlannedTreatment, QrBatch, QrToken
from app.schemas import HiveCreate, HiveInitialize, HiveOut, HiveUpdate, PaginatedResponse, QrScanUnlinked

router = APIRouter(tags=["hives"])


def _hive_out(hive: Hive, access: str) -> HiveOut:
    out = HiveOut.model_validate(hive)
    out.access = access
    return out


@router.get("/hives/by-qr/{token}", response_model=Union[HiveOut, QrScanUnlinked])
def resolve_qr(
    token: str,
    current_user: CurrentUser,
    db: DB,
    accept_language: Optional[str] = Header(default=None),
):
    qr = db.get(QrToken, token)
    if not qr:
        raise HTTPException(404, detail=error("QR_TOKEN_NOT_FOUND", accept_language))
    if qr.hive is None:
        # A code attached to nothing can only be used by whoever printed it.
        if qr.user_id != current_user.id:
            raise HTTPException(404, detail=error("QR_TOKEN_NOT_FOUND", accept_language))
        return QrScanUnlinked(token=token)
    # A code on a hive resolves for everybody who may work on that hive, so a collaborator can
    # scan the owner's sticker.
    access = Scope(db, current_user).hive_access(qr.hive)
    if access is None:
        raise HTTPException(404, detail=error("QR_TOKEN_NOT_FOUND", accept_language))
    return _hive_out(qr.hive, access)


@router.get("/apiaries/{apiary_id}/hives", response_model=PaginatedResponse)
def list_hives(
    apiary_id: str,
    current_user: CurrentUser,
    db: DB,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    accept_language: Optional[str] = Header(default=None),
):
    _, access, scope = apiary_or_404(db, current_user, apiary_id, accept_language)
    q = db.query(Hive).filter(Hive.apiary_id == apiary_id)
    if access == PARTIAL:
        # Only some hives of this apiary were shared; the others are not this person's to see.
        q = q.filter(Hive.id.in_(scope.shared_hive_ids))
    total = q.count()
    items = q.offset((page - 1) * per_page).limit(per_page).all()
    return PaginatedResponse(
        items=[_hive_out(h, scope.hive_access(h)) for h in items],
        total=total,
        page=page,
        per_page=per_page,
        pages=math.ceil(total / per_page) if total else 0,
    )


@router.post("/apiaries/{apiary_id}/hives", response_model=HiveOut, status_code=201)
def create_hive(
    apiary_id: str,
    body: HiveCreate,
    current_user: CurrentUser,
    db: DB,
    accept_language: Optional[str] = Header(default=None),
):
    _, _, scope = apiary_or_404(db, current_user, apiary_id, accept_language, need="edit")

    batch = QrBatch(user_id=current_user.id, count=1)
    db.add(batch)
    db.flush()

    token = QrToken(user_id=current_user.id, batch_id=batch.id)
    db.add(token)
    db.flush()

    hive = Hive(
        user_id=current_user.id,
        qr_token=token.token,
        apiary_id=apiary_id,
        name=body.name,
        hive_type=body.hive_type,
        acquisition_date=body.acquisition_date,
        notes=body.notes,
    )
    db.add(hive)
    db.commit()
    db.refresh(hive)
    return _hive_out(hive, scope.hive_access(hive))


@router.post("/hives/initialize", response_model=HiveOut, status_code=201)
def initialize_hive(
    body: HiveInitialize,
    current_user: CurrentUser,
    db: DB,
    accept_language: Optional[str] = Header(default=None),
):
    qr = db.get(QrToken, body.qr_token)
    if not qr or qr.user_id != current_user.id:
        raise HTTPException(404, detail=error("QR_TOKEN_NOT_FOUND", accept_language))
    if qr.hive is not None:
        raise HTTPException(409, detail=error("QR_TOKEN_ALREADY_LINKED", accept_language))

    _, _, scope = apiary_or_404(db, current_user, body.apiary_id, accept_language, need="edit")

    hive = Hive(
        user_id=current_user.id,
        qr_token=body.qr_token,
        apiary_id=body.apiary_id,
        name=body.name,
        hive_type=body.hive_type,
        latitude=body.latitude,
        longitude=body.longitude,
        acquisition_date=body.acquisition_date,
        notes=body.notes,
        custom_fields=body.custom_fields,
    )
    db.add(hive)
    db.commit()
    db.refresh(hive)
    return _hive_out(hive, scope.hive_access(hive))


@router.get("/hives/{hive_id}", response_model=HiveOut)
def get_hive(
    hive_id: str,
    current_user: CurrentUser,
    db: DB,
    accept_language: Optional[str] = Header(default=None),
):
    hive, access, _ = hive_or_404(db, current_user, hive_id, accept_language)
    return _hive_out(hive, access)


@router.put("/hives/{hive_id}", response_model=HiveOut)
def update_hive(
    hive_id: str,
    body: HiveUpdate,
    current_user: CurrentUser,
    db: DB,
    accept_language: Optional[str] = Header(default=None),
):
    hive, access, scope = hive_or_404(db, current_user, hive_id, accept_language)
    if body.apiary_id is not None and body.apiary_id != hive.apiary_id:
        # Taking a hive out of an apiary is the owner's call: a collaborator could otherwise walk
        # a hive that was shared with them into an apiary the owner never sees.
        hive_or_404(db, current_user, hive_id, accept_language, need="owner")
        apiary_or_404(db, current_user, body.apiary_id, accept_language, need="edit")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(hive, field, value)
    db.commit()
    db.refresh(hive)
    return _hive_out(hive, scope.hive_access(hive))


@router.delete("/hives/{hive_id}", status_code=204)
def delete_hive(
    hive_id: str,
    current_user: CurrentUser,
    db: DB,
    accept_language: Optional[str] = Header(default=None),
):
    hive, _, _ = hive_or_404(db, current_user, hive_id, accept_language, need="owner")
    remove_shares(db, hive_id=hive.id)
    db.query(PlannedTreatment).filter(PlannedTreatment.hive_id == hive.id).delete(synchronize_session=False)
    db.delete(hive)
    db.commit()


@router.get("/hives/{hive_id}/qr")
def get_hive_qr(
    hive_id: str,
    current_user: CurrentUser,
    db: DB,
    accept_language: Optional[str] = Header(default=None),
):
    hive, _, _ = hive_or_404(db, current_user, hive_id, accept_language)
    png = make_qr_png(hive.qr_token)
    return StreamingResponse(io.BytesIO(png), media_type="image/png")
