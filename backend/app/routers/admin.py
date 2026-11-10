import math
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func, or_, and_

from app import year_feedback
from app.beekeeping_year import ENTRIES as YEAR_ENTRIES
from app.deps import CurrentAdmin, DB
from app.config import settings
from app.monitoring import send_self_test
from app.i18n import error
from app.models import (
    Apiary, Hive, Inspection, RefreshToken, User, HornetSighting, YearProposal, YearRating,
)
from app.utils.accounts import delete_account
from app.schemas import (
    AdminApiaryOut, AdminPlatformStats, AdminUserDetail, AdminTokenOut,
    AdminTokenStats, HealthSummary, HornetSightingStatusUpdate, InactiveUserOut,
    NoVarroaApiaryOut, PaginatedResponse, SignupDay, SupporterUpdate, UserOut,
    YearProposalApprove, YearProposalOut, YearRecomputeOut, ZeroInspectionHiveOut,
)
from app.clock import now_utc

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/ping")
def ping(admin: CurrentAdmin) -> dict:
    """Health-check for the admin dependency. Returns 403 for non-admins."""
    return {"ok": True, "email": admin.email}


@router.get("/health/configuration")
def configuration_health(admin: CurrentAdmin) -> dict:
    """What the running server actually received — not what the hosting dashboard shows.

    A variable that never reaches the function is invisible everywhere else: the app keeps
    working, just with the default. For the signing key that is a security hole, because the
    default is published in this repository and anyone could forge a login token with it.
    """
    return {
        "environment": settings.environment,
        "signing_key_is_the_public_default": settings.secret_key == "dev-secret-change-me",
        "crash_reporting_configured": bool(settings.sentry_dsn.strip()),
        # Push fails quietly by design: without credentials a reminder run logs a warning and
        # carries on, so nothing anywhere says that iPhones never hear anything. This does.
        "push_android_configured": bool(
            settings.firebase_project_id.strip() and settings.firebase_service_account_json.strip()
        ),
        "push_ios_configured": bool(
            settings.apns_key_id.strip()
            and settings.apns_team_id.strip()
            and settings.apns_private_key_p8.strip()
        ),
    }


@router.post("/self-test/error")
def self_test_error(admin: CurrentAdmin) -> dict:
    """Send a deliberate error to the crash reporter and report where it went.

    Crash reporting is the one feature nobody notices is broken until the day it is
    needed, so it gets a button instead of a hope.
    """
    return send_self_test()


# ---------------------------------------------------------------------------
# User management
# ---------------------------------------------------------------------------

@router.get("/users")
def list_users(
    admin: CurrentAdmin,
    db: DB,
    q: Optional[str] = None,
    supporter: Optional[bool] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
) -> PaginatedResponse:
    # Subqueries for per-user counts
    apiary_sq = (
        db.query(Apiary.user_id, func.count(Apiary.id).label("ac"))
        .group_by(Apiary.user_id)
        .subquery()
    )
    hive_sq = (
        db.query(Hive.user_id, func.count(Hive.id).label("hc"))
        .group_by(Hive.user_id)
        .subquery()
    )
    insp_sq = (
        db.query(Hive.user_id, func.count(Inspection.id).label("ic"))
        .join(Inspection, Inspection.hive_id == Hive.id)
        .group_by(Hive.user_id)
        .subquery()
    )

    base = (
        db.query(
            User,
            func.coalesce(apiary_sq.c.ac, 0),
            func.coalesce(hive_sq.c.hc, 0),
            func.coalesce(insp_sq.c.ic, 0),
        )
        .outerjoin(apiary_sq, User.id == apiary_sq.c.user_id)
        .outerjoin(hive_sq,   User.id == hive_sq.c.user_id)
        .outerjoin(insp_sq,   User.id == insp_sq.c.user_id)
    )

    if q:
        base = base.filter(User.email.ilike(f"%{q}%"))
    if supporter is not None:
        base = base.filter(User.is_supporter == supporter)
    base = base.order_by(User.created_at.desc())

    total = base.with_entities(func.count(User.id)).order_by(None).scalar() or 0
    rows = base.offset((page - 1) * per_page).limit(per_page).all()

    return PaginatedResponse(
        items=[
            AdminUserDetail(
                id=u.id, email=u.email, name=u.name, locale=u.locale,
                is_admin=u.is_admin, is_supporter=u.is_supporter,
                created_at=u.created_at,
                apiary_count=ac, hive_count=hc, inspection_count=ic,
            )
            for u, ac, hc, ic in rows
        ],
        total=total,
        page=page,
        per_page=per_page,
        pages=math.ceil(total / per_page) if total else 1,
    )


@router.get("/users/{user_id}")
def get_user(user_id: str, admin: CurrentAdmin, db: DB) -> AdminUserDetail:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "USER_NOT_FOUND", "message": "User not found."},
        )
    apiary_count = db.query(func.count(Apiary.id)).filter(Apiary.user_id == user_id).scalar() or 0
    hive_count = db.query(func.count(Hive.id)).filter(Hive.user_id == user_id).scalar() or 0
    inspection_count = (
        db.query(func.count(Inspection.id))
        .join(Hive, Inspection.hive_id == Hive.id)
        .filter(Hive.user_id == user_id)
        .scalar() or 0
    )
    return AdminUserDetail(
        id=user.id,
        email=user.email,
        name=user.name,
        locale=user.locale,
        is_admin=user.is_admin,
        is_supporter=user.is_supporter,
        created_at=user.created_at,
        apiary_count=apiary_count,
        hive_count=hive_count,
        inspection_count=inspection_count,
    )


@router.put("/users/{user_id}/supporter")
def set_supporter(user_id: str, body: SupporterUpdate, admin: CurrentAdmin, db: DB) -> UserOut:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "USER_NOT_FOUND", "message": "User not found."},
        )
    user.is_supporter = body.is_supporter
    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)


@router.get("/stats")
def platform_stats(
    admin: CurrentAdmin,
    db: DB,
    preset: str = Query("30d", pattern="^(30d|90d|365d|all)$"),
) -> AdminPlatformStats:
    now = now_utc()
    _days = {"30d": 30, "90d": 90, "365d": 365}
    cutoff: Optional[datetime] = None if preset == "all" else now - timedelta(days=_days[preset])

    total_users = db.query(func.count(User.id)).scalar() or 0
    supporter_count = db.query(func.count(User.id)).filter(User.is_supporter.is_(True)).scalar() or 0

    new_q = db.query(func.count(User.id))
    if cutoff:
        new_q = new_q.filter(User.created_at >= cutoff)
    new_users_in_period = new_q.scalar() or 0

    total_apiaries = db.query(func.count(Apiary.id)).scalar() or 0
    public_apiaries = db.query(func.count(Apiary.id)).filter(Apiary.is_public.is_(True)).scalar() or 0
    total_hives = db.query(func.count(Hive.id)).scalar() or 0
    total_inspections = db.query(func.count(Inspection.id)).scalar() or 0

    thirty_days_ago = now - timedelta(days=30)
    active_users_30d = (
        db.query(func.count(func.distinct(Hive.user_id)))
        .join(Inspection, Inspection.hive_id == Hive.id)
        .filter(Inspection.created_at >= thirty_days_ago)
        .scalar() or 0
    )

    day_col = func.date(User.created_at)
    signups_q = (
        db.query(day_col.label("day"), func.count(User.id).label("cnt"))
        .group_by(day_col)
        .order_by(day_col)
    )
    if cutoff:
        signups_q = signups_q.filter(User.created_at >= cutoff)
    signups_by_day = [SignupDay(date=str(row.day), count=row.cnt) for row in signups_q.all()]

    return AdminPlatformStats(
        preset=preset,
        total_users=total_users,
        new_users_in_period=new_users_in_period,
        supporter_count=supporter_count,
        total_apiaries=total_apiaries,
        public_apiaries=public_apiaries,
        total_hives=total_hives,
        total_inspections=total_inspections,
        active_users_30d=active_users_30d,
        signups_by_day=signups_by_day,
    )


# ---------------------------------------------------------------------------
# Map moderation
# ---------------------------------------------------------------------------

def _hive_count_subquery(db):
    return (
        db.query(Hive.apiary_id, func.count(Hive.id).label("hc"))
        .group_by(Hive.apiary_id)
        .subquery()
    )


def _apiary_row_to_out(apiary, email, hive_count) -> AdminApiaryOut:
    return AdminApiaryOut(
        id=apiary.id,
        name=apiary.name,
        owner_email=email,
        latitude=apiary.latitude,
        longitude=apiary.longitude,
        hive_count=hive_count,
        is_public=apiary.is_public,
        created_at=apiary.created_at,
    )


@router.get("/apiaries")
def list_public_apiaries(
    admin: CurrentAdmin,
    db: DB,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
) -> PaginatedResponse:
    hc_sq = _hive_count_subquery(db)
    hc_col = func.coalesce(hc_sq.c.hc, 0)
    base = (
        db.query(Apiary, User.email, hc_col)
        .join(User, Apiary.user_id == User.id)
        .outerjoin(hc_sq, Apiary.id == hc_sq.c.apiary_id)
        .filter(Apiary.is_public.is_(True))
        .order_by(Apiary.created_at.desc())
    )
    total = db.query(func.count(Apiary.id)).filter(Apiary.is_public.is_(True)).scalar() or 0
    rows = base.offset((page - 1) * per_page).limit(per_page).all()
    return PaginatedResponse(
        items=[_apiary_row_to_out(a, email, hc) for a, email, hc in rows],
        total=total,
        page=page,
        per_page=per_page,
        pages=math.ceil(total / per_page) if total else 1,
    )


@router.get("/apiaries/flagged")
def flagged_apiaries(admin: CurrentAdmin, db: DB) -> list:
    hc_sq = _hive_count_subquery(db)
    hc_col = func.coalesce(hc_sq.c.hc, 0)
    rows = (
        db.query(Apiary, User.email, hc_col)
        .join(User, Apiary.user_id == User.id)
        .outerjoin(hc_sq, Apiary.id == hc_sq.c.apiary_id)
        .filter(Apiary.is_public.is_(True))
        .filter(or_(
            hc_col > 500,
            and_(Apiary.latitude.isnot(None), or_(Apiary.latitude < -90, Apiary.latitude > 90)),
            and_(Apiary.longitude.isnot(None), or_(Apiary.longitude < -180, Apiary.longitude > 180)),
        ))
        .all()
    )
    return [_apiary_row_to_out(a, email, hc) for a, email, hc in rows]


@router.put("/apiaries/{apiary_id}/set-private")
def set_apiary_private(apiary_id: str, admin: CurrentAdmin, db: DB) -> AdminApiaryOut:
    apiary = db.get(Apiary, apiary_id)
    if apiary is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "APIARY_NOT_FOUND", "message": "Apiary not found."},
        )
    apiary.is_public = False
    apiary.city_name = None
    apiary.city_latitude = None
    apiary.city_longitude = None
    db.commit()
    db.refresh(apiary)
    hive_count = db.query(func.count(Hive.id)).filter(Hive.apiary_id == apiary_id).scalar() or 0
    owner = db.get(User, apiary.user_id)
    return _apiary_row_to_out(apiary, owner.email, hive_count)


@router.delete("/users/{user_id}", status_code=204)
def delete_user(user_id: str, admin: CurrentAdmin, db: DB):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "USER_NOT_FOUND", "message": "User not found."},
        )
    if user.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "CANNOT_DELETE_SELF", "message": "Admins cannot delete their own account."},
        )
    # Hands over what the user shared with others, then deletes the rest in FK order.
    delete_account(db, user)


# ---------------------------------------------------------------------------
# Data health
# ---------------------------------------------------------------------------

def _users_with_inspections_sq(db):
    return db.query(Hive.user_id).join(Inspection, Inspection.hive_id == Hive.id).distinct()


def _inactive_users_q(db):
    thirty_days_ago = now_utc() - timedelta(days=30)
    return (
        db.query(User)
        .filter(User.created_at < thirty_days_ago)
        .filter(~User.id.in_(_users_with_inspections_sq(db)))
    )


def _zero_inspection_hives_q(db):
    inspected = db.query(Inspection.hive_id).distinct()
    return (
        db.query(Hive, Apiary.name, User.email)
        .join(Apiary, Apiary.id == Hive.apiary_id)
        .join(User, User.id == Hive.user_id)
        .filter(~Hive.id.in_(inspected))
        .order_by(Hive.initialized_at.desc())
    )


@router.get("/health/summary")
def health_summary(admin: CurrentAdmin, db: DB) -> HealthSummary:
    inactive_users = _inactive_users_q(db).with_entities(func.count(User.id)).scalar() or 0
    zero_inspection_hives = (
        db.query(func.count(Hive.id))
        .filter(~Hive.id.in_(db.query(Inspection.hive_id).distinct()))
        .scalar() or 0
    )
    no_varroa_inspections = (
        db.query(func.count(Inspection.id)).filter(Inspection.varroa_level.is_(None)).scalar() or 0
    )
    return HealthSummary(
        inactive_users=inactive_users,
        zero_inspection_hives=zero_inspection_hives,
        no_varroa_inspections=no_varroa_inspections,
    )


@router.get("/health/inactive-users")
def health_inactive_users(
    admin: CurrentAdmin,
    db: DB,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
) -> PaginatedResponse:
    apiary_count_sq = (
        db.query(Apiary.user_id, func.count(Apiary.id).label("ac"))
        .group_by(Apiary.user_id)
        .subquery()
    )
    base = (
        _inactive_users_q(db)
        .add_columns(func.coalesce(apiary_count_sq.c.ac, 0))
        .outerjoin(apiary_count_sq, User.id == apiary_count_sq.c.user_id)
        .order_by(User.created_at.asc())
    )
    total = _inactive_users_q(db).with_entities(func.count(User.id)).scalar() or 0
    rows = base.offset((page - 1) * per_page).limit(per_page).all()
    return PaginatedResponse(
        items=[
            InactiveUserOut(
                id=u.id, email=u.email, name=u.name,
                created_at=u.created_at, apiary_count=ac,
            )
            for u, ac in rows
        ],
        total=total,
        page=page,
        per_page=per_page,
        pages=math.ceil(total / per_page) if total else 1,
    )


@router.get("/health/no-varroa-inspections")
def health_no_varroa_inspections(admin: CurrentAdmin, db: DB) -> list:
    rows = (
        db.query(
            Apiary.id,
            Apiary.name,
            User.email,
            func.count(Inspection.id).label("missing"),
        )
        .join(Hive, Hive.apiary_id == Apiary.id)
        .join(Inspection, Inspection.hive_id == Hive.id)
        .join(User, User.id == Apiary.user_id)
        .filter(Inspection.varroa_level.is_(None))
        .group_by(Apiary.id, Apiary.name, User.email)
        .order_by(func.count(Inspection.id).desc())
        .all()
    )
    return [
        NoVarroaApiaryOut(
            apiary_id=apiary_id,
            apiary_name=apiary_name,
            owner_email=email,
            missing_varroa_count=missing,
        )
        for apiary_id, apiary_name, email, missing in rows
    ]


@router.get("/health/zero-inspection-hives")
def health_zero_inspection_hives(admin: CurrentAdmin, db: DB) -> list:
    rows = _zero_inspection_hives_q(db).all()
    return [
        ZeroInspectionHiveOut(
            id=hive.id, name=hive.name, hive_type=hive.hive_type,
            apiary_id=hive.apiary_id, apiary_name=apiary_name,
            owner_email=email, initialized_at=hive.initialized_at,
        )
        for hive, apiary_name, email in rows
    ]


# ---------------------------------------------------------------------------
# Token management (force-logout)
# ---------------------------------------------------------------------------

def _active_tokens_q(db, user_id: str):
    now = now_utc()
    return (
        db.query(RefreshToken)
        .filter(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked.is_(False),
            RefreshToken.expires_at > now,
        )
    )


@router.get("/tokens/stats")
def token_stats(admin: CurrentAdmin, db: DB) -> AdminTokenStats:
    now = now_utc()
    active_q = db.query(RefreshToken).filter(
        RefreshToken.revoked.is_(False),
        RefreshToken.expires_at > now,
    )
    total_active = active_q.count()
    users_with_sessions = (
        active_q.with_entities(func.count(func.distinct(RefreshToken.user_id))).scalar() or 0
    )
    avg_per_user = round(total_active / users_with_sessions, 2) if users_with_sessions else 0.0
    return AdminTokenStats(
        total_active_sessions=total_active,
        users_with_active_sessions=users_with_sessions,
        avg_sessions_per_user=avg_per_user,
    )


@router.get("/users/{user_id}/tokens")
def list_user_tokens(user_id: str, admin: CurrentAdmin, db: DB) -> list:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "USER_NOT_FOUND", "message": "User not found."},
        )
    tokens = _active_tokens_q(db, user_id).order_by(RefreshToken.expires_at.desc()).all()
    return [AdminTokenOut(id=t.id, expires_at=t.expires_at) for t in tokens]


@router.delete("/users/{user_id}/tokens", status_code=204)
def revoke_user_tokens(user_id: str, admin: CurrentAdmin, db: DB):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "USER_NOT_FOUND", "message": "User not found."},
        )
    db.query(RefreshToken).filter(RefreshToken.user_id == user_id).update(
        {"revoked": True}, synchronize_session=False
    )
    db.commit()


# ---------------------------------------------------------------------------
# Hornet Tracker — admin overrides
# ---------------------------------------------------------------------------

@router.put("/hornets/sightings/{sighting_id}/status", status_code=204)
def set_sighting_status(
    sighting_id: str, body: HornetSightingStatusUpdate, admin: CurrentAdmin, db: DB
):
    sighting = db.get(HornetSighting, sighting_id)
    if sighting is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "HORNET_SIGHTING_NOT_FOUND", "message": "Sighting not found."},
        )
    sighting.status = body.status
    db.commit()


# ---------------------------------------------------------------------------
# Beekeeping year: the corrections beekeepers propose, and the decision
# ---------------------------------------------------------------------------
#
# The questionnaire in routers/public_year.py collects ratings from beekeepers with no account.
# They never move a date by themselves — they are grouped per entry and region and wait here. The
# grouping and the reasoning behind its numbers live in app/year_feedback.py.


def _entry_titles(language: str = "en") -> dict:
    return {entry.key: entry.title.get(language, entry.key) for entry in YEAR_ENTRIES}


def _stored_ratings(db) -> list:
    return [
        year_feedback.Rating(
            entry_key=row.entry_key, verdict=row.verdict, shift_days=row.shift_days,
            note=row.note, country=row.country, latitude=row.latitude, longitude=row.longitude,
        )
        for row in db.query(YearRating).all()
    ]


def _proposal_out(row, titles: dict, group=None) -> YearProposalOut:
    """A stored proposal, with the live group detail when a recompute has just produced it.

    The counts, the range and the notes are not stored: they are what the ratings say right now,
    and a stored copy would quietly go stale as more ratings arrive.
    """
    return YearProposalOut(
        id=row.id,
        entry_key=row.entry_key,
        entry_title=titles.get(row.entry_key, row.entry_key),
        kind=row.kind,
        shift_days=row.shift_days,
        rating_count=row.rating_count,
        latitude=row.latitude,
        longitude=row.longitude,
        radius_km=row.radius_km,
        country=row.country,
        verdict_counts=group.verdict_counts if group else {},
        shift_days_range=list(group.shift_days_range) if group and group.shift_days_range else None,
        notes=list(group.notes) if group else [],
        status=row.status,
        created_at=row.created_at,
        decided_at=row.decided_at,
    )


@router.get("/year-proposals", response_model=list[YearProposalOut])
def list_year_proposals(
    admin: CurrentAdmin,
    db: DB,
    status_filter: str = Query(default="pending", alias="status",
                               pattern="^(pending|approved|rejected|all)$"),
) -> list:
    query = db.query(YearProposal)
    if status_filter != "all":
        query = query.filter(YearProposal.status == status_filter)
    rows = query.order_by(YearProposal.rating_count.desc(), YearProposal.entry_key).all()

    # The ratings are grouped again for the detail, so what an admin reads is current.
    groups = {
        (group.entry_key, group.kind, group.latitude, group.longitude): group
        for group in year_feedback.propose(_stored_ratings(db))
    }
    titles = _entry_titles()
    return [
        _proposal_out(row, titles, groups.get((row.entry_key, row.kind, row.latitude, row.longitude)))
        for row in rows
    ]


@router.post("/year-proposals/recompute", response_model=YearRecomputeOut)
def recompute_year_proposals(admin: CurrentAdmin, db: DB) -> YearRecomputeOut:
    """Group the ratings again and offer what is new.

    A decision is never undone by a recompute: an approved or rejected row is left exactly as it
    is, which is also what stops a rejected group being offered over and over. A pending row whose
    group has grown is brought up to date in place.
    """
    created = updated = unchanged = 0
    for group in year_feedback.propose(_stored_ratings(db)):
        row = (
            db.query(YearProposal)
            .filter(
                YearProposal.entry_key == group.entry_key,
                YearProposal.kind == group.kind,
                YearProposal.latitude == group.latitude,
                YearProposal.longitude == group.longitude,
            )
            .first()
        )
        if row is None:
            db.add(YearProposal(
                entry_key=group.entry_key, kind=group.kind, shift_days=group.shift_days,
                rating_count=group.rating_count, latitude=group.latitude,
                longitude=group.longitude, radius_km=group.radius_km, country=group.country,
                status="pending",
            ))
            created += 1
            continue
        if row.status != "pending":
            unchanged += 1
            continue
        if (row.shift_days, row.rating_count) == (group.shift_days, group.rating_count):
            unchanged += 1
            continue
        row.shift_days = group.shift_days
        row.rating_count = group.rating_count
        row.country = group.country
        updated += 1
    db.commit()
    return YearRecomputeOut(created=created, updated=updated, unchanged=unchanged)


def _proposal_or_404(proposal_id: str, db) -> YearProposal:
    row = db.query(YearProposal).filter(YearProposal.id == proposal_id).first()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=error("YEAR_PROPOSAL_NOT_FOUND"))
    return row


@router.post("/year-proposals/{proposal_id}/approve", response_model=YearProposalOut)
def approve_year_proposal(
    proposal_id: str, body: YearProposalApprove, admin: CurrentAdmin, db: DB
) -> YearProposalOut:
    """Approve the correction, optionally a different one than the median.

    An admin who knows the region may overrule the number the ratings produced — the ratings are
    evidence, not a vote that binds anybody.
    """
    row = _proposal_or_404(proposal_id, db)
    if body.shift_days is not None:
        if row.kind != "shift":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "VALIDATION_ERROR",
                        "message": "shift_days cannot be given for a proposal to hide an entry."},
            )
        row.shift_days = body.shift_days
    row.status = "approved"
    row.decided_at = now_utc()
    row.decided_by = admin.id
    db.commit()
    db.refresh(row)
    return _proposal_out(row, _entry_titles())


@router.post("/year-proposals/{proposal_id}/reject", response_model=YearProposalOut)
def reject_year_proposal(proposal_id: str, admin: CurrentAdmin, db: DB) -> YearProposalOut:
    """Reject it — and keep the row, so the next recompute does not offer the same group again."""
    row = _proposal_or_404(proposal_id, db)
    row.status = "rejected"
    row.decided_at = now_utc()
    row.decided_by = admin.id
    db.commit()
    db.refresh(row)
    return _proposal_out(row, _entry_titles())
