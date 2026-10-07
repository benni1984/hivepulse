"""Planned treatments: what is going to happen, for which hive or apiary, by when.
See "Planned Treatments" in the API contract."""
from datetime import date
from typing import Optional

from fastapi import APIRouter, Header, HTTPException, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Query as SAQuery, Session

from app.access import OWNER, SHARED, Scope, apiary_or_404, hive_or_404
from app.deps import CurrentUser, DB
from app.i18n import error
from app.models import Apiary, Hive, PlannedTreatment
from app.schemas import (
    PlannedTreatmentOut, TreatmentCreate, TreatmentDone, TreatmentTarget, TreatmentUpdate,
)

router = APIRouter(prefix="/treatments", tags=["treatments"])


def out(treatment: PlannedTreatment) -> PlannedTreatmentOut:
    if treatment.hive_id:
        target = TreatmentTarget(type="hive", id=treatment.hive_id, name=treatment.hive.name)
        apiary_name = treatment.hive.apiary.name
    else:
        target = TreatmentTarget(type="apiary", id=treatment.apiary_id, name=treatment.apiary.name)
        apiary_name = None
    return PlannedTreatmentOut(
        id=treatment.id,
        target=target,
        apiary_name=apiary_name,
        product=treatment.product,
        due_on=treatment.due_on,
        note=treatment.note,
        done_on=treatment.done_on,
        overdue=treatment.done_on is None and treatment.due_on < date.today(),
        created_by_name=treatment.created_by.name if treatment.created_by else None,
        created_at=treatment.created_at,
    )


def visible_treatments(db: Session, scope: Scope) -> SAQuery:
    """The treatments of every hive the caller can work on, and of every apiary they may edit: somebody who
    has only single hives of an apiary sees the plans for those hives, not the apiary-wide ones."""
    hives = select(Hive.id).where(scope.hive_filter())
    apiaries = select(Apiary.id).where(
        or_(Apiary.user_id == scope.user.id, Apiary.id.in_(scope.shared_apiary_ids))
    )
    return db.query(PlannedTreatment).filter(
        or_(PlannedTreatment.hive_id.in_(hives), PlannedTreatment.apiary_id.in_(apiaries))
    )


def _get_or_404(db: Session, user, treatment_id: str, lang) -> PlannedTreatment:
    treatment = db.get(PlannedTreatment, treatment_id)
    if treatment is None:
        raise HTTPException(404, detail=error("TREATMENT_NOT_FOUND", lang))
    scope = Scope(db, user)
    if treatment.hive_id:
        allowed = scope.hive_access(treatment.hive) is not None
    else:
        allowed = scope.apiary_access(treatment.apiary) in (OWNER, SHARED)
    if not allowed:
        raise HTTPException(404, detail=error("TREATMENT_NOT_FOUND", lang))
    return treatment


@router.post("", response_model=PlannedTreatmentOut, status_code=201)
def create_treatment(
    body: TreatmentCreate,
    current_user: CurrentUser,
    db: DB,
    accept_language: Optional[str] = Header(default=None),
):
    if body.hive_id:
        hive_or_404(db, current_user, body.hive_id, accept_language)
    else:
        apiary_or_404(db, current_user, body.apiary_id, accept_language, need="edit")
    treatment = PlannedTreatment(
        hive_id=body.hive_id,
        apiary_id=body.apiary_id,
        product=body.product.strip(),
        due_on=body.due_on,
        note=(body.note or "").strip() or None,
        created_by_id=current_user.id,
    )
    db.add(treatment)
    db.commit()
    db.refresh(treatment)
    return out(treatment)


@router.get("", response_model=list[PlannedTreatmentOut])
def list_treatments(
    current_user: CurrentUser,
    db: DB,
    status: str = Query(default="open", pattern="^(open|done)$"),
    hive_id: Optional[str] = Query(default=None),
    apiary_id: Optional[str] = Query(default=None),
    accept_language: Optional[str] = Header(default=None),
):
    query = visible_treatments(db, Scope(db, current_user))
    if hive_id:
        hive_or_404(db, current_user, hive_id, accept_language)
        query = query.filter(PlannedTreatment.hive_id == hive_id)
    if apiary_id:
        apiary_or_404(db, current_user, apiary_id, accept_language)
        query = query.filter(PlannedTreatment.apiary_id == apiary_id)
    if status == "open":
        query = query.filter(PlannedTreatment.done_on.is_(None)).order_by(
            PlannedTreatment.due_on.asc(), PlannedTreatment.created_at.asc())
    else:
        query = query.filter(PlannedTreatment.done_on.isnot(None)).order_by(
            PlannedTreatment.done_on.desc(), PlannedTreatment.created_at.desc())
    return [out(t) for t in query.all()]


@router.put("/{treatment_id}", response_model=PlannedTreatmentOut)
def update_treatment(
    treatment_id: str,
    body: TreatmentUpdate,
    current_user: CurrentUser,
    db: DB,
    accept_language: Optional[str] = Header(default=None),
):
    treatment = _get_or_404(db, current_user, treatment_id, accept_language)
    changes = body.model_dump(exclude_unset=True)
    if "product" in changes:
        if not changes["product"] or not changes["product"].strip():
            raise HTTPException(422, detail="product cannot be empty")
        treatment.product = changes["product"].strip()
    if "due_on" in changes and changes["due_on"] is not None:
        treatment.due_on = changes["due_on"]
    if "note" in changes:
        treatment.note = (changes["note"] or "").strip() or None
    db.commit()
    db.refresh(treatment)
    return out(treatment)


@router.post("/{treatment_id}/done", response_model=PlannedTreatmentOut)
def mark_done(
    treatment_id: str,
    current_user: CurrentUser,
    db: DB,
    body: Optional[TreatmentDone] = None,
    accept_language: Optional[str] = Header(default=None),
):
    # The body is optional: marking something done today needs no more than the click.
    treatment = _get_or_404(db, current_user, treatment_id, accept_language)
    treatment.done_on = (body.done_on if body else None) or date.today()
    db.commit()
    db.refresh(treatment)
    return out(treatment)


@router.post("/{treatment_id}/reopen", response_model=PlannedTreatmentOut)
def reopen(
    treatment_id: str,
    current_user: CurrentUser,
    db: DB,
    accept_language: Optional[str] = Header(default=None),
):
    treatment = _get_or_404(db, current_user, treatment_id, accept_language)
    treatment.done_on = None
    db.commit()
    db.refresh(treatment)
    return out(treatment)


@router.delete("/{treatment_id}", status_code=204)
def delete_treatment(
    treatment_id: str,
    current_user: CurrentUser,
    db: DB,
    accept_language: Optional[str] = Header(default=None),
):
    treatment = _get_or_404(db, current_user, treatment_id, accept_language)
    db.delete(treatment)
    db.commit()
