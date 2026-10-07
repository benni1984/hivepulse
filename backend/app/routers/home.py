"""What a beekeeper wants to know on opening the app. See "Home Summary" in the API contract."""
from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter
from sqlalchemy import func, select

from app.access import Scope
from app.config import settings
from app.deps import CurrentUser, DB
from app.models import Apiary, Inspection, PlannedTreatment, User
from app.routers.treatments import out as treatment_out, visible_treatments
from app.schemas import (
    HomeAd, HomeAttention, HomeHealth, HomeInspection, HomeInspections, HomeOut, HomeTreatments,
)

router = APIRouter(tags=["home"])

# Hives due within this many days count as "due soon".
DUE_SOON_DAYS = 3
# Treatments due within this many days are shown as upcoming.
UPCOMING_TREATMENT_DAYS = 30
SHOWN = 5


def in_reminder_season(user: User, month: int) -> bool:
    """The same rule the reminders use: a season may wrap the year boundary (October to February)."""
    start, end = user.reminder_season_start, user.reminder_season_end
    if start <= end:
        return start <= month <= end
    return month >= start or month <= end


def health_of(latest) -> tuple[str, list[str]]:
    """Status and reasons of a hive from its latest inspection; no inspection at all is `unknown`."""
    if latest is None:
        return "unknown", []
    alert, watch = [], []
    if latest.varroa_level is not None and latest.varroa_level >= 3:
        alert.append("varroa_high")
    if latest.swarm_cells_seen:
        alert.append("swarm_cells")
    if latest.mood == "aggressive":
        alert.append("aggressive")
    if latest.varroa_level == 2:
        watch.append("varroa_medium")
    if latest.mood == "nervous":
        watch.append("nervous")
    if latest.queen_seen is False:
        watch.append("queen_not_seen")
    if alert:
        return "alert", alert + watch
    if watch:
        return "watch", watch
    return "ok", []


def _latest_inspections(db, hive_ids: list[str]) -> dict:
    """The newest inspection of each hive, in one query: by the day entered, then by when it was typed in."""
    if not hive_ids:
        return {}
    ranked = (
        select(
            Inspection.hive_id.label("hive_id"),
            Inspection.date.label("date"),
            Inspection.varroa_level.label("varroa_level"),
            Inspection.swarm_cells_seen.label("swarm_cells_seen"),
            Inspection.mood.label("mood"),
            Inspection.queen_seen.label("queen_seen"),
            func.row_number().over(
                partition_by=Inspection.hive_id,
                order_by=(Inspection.date.desc(), Inspection.created_at.desc()),
            ).label("rank"),
        )
        .where(Inspection.hive_id.in_(hive_ids))
        .subquery()
    )
    rows = db.execute(select(ranked).where(ranked.c.rank == 1)).all()
    return {row.hive_id: row for row in rows}


@router.get("/home", response_model=HomeOut)
def home(current_user: CurrentUser, db: DB) -> HomeOut:
    scope = Scope(db, current_user)
    today = date.today()
    interval = current_user.reminder_interval_days

    apiaries = db.query(Apiary).filter(scope.apiary_filter()).all()
    hives = [(hive, apiary) for apiary in apiaries for hive in scope.hives_in(apiary)]
    latest = _latest_inspections(db, [hive.id for hive, _ in hives])

    # -- inspections ---------------------------------------------------------------------------------
    due = []
    for hive, apiary in hives:
        last = latest.get(hive.id)
        last_on = last.date if last else None
        # A hive that was never inspected is due that many days after it was created.
        basis = last_on or (hive.created_at.date() if hive.created_at else today)
        due_on = basis + timedelta(days=interval)
        due.append(HomeInspection(
            hive_id=hive.id, hive_name=hive.name, apiary_name=apiary.name,
            last_inspection_on=last_on, due_on=due_on, overdue_days=max((today - due_on).days, 0),
        ))
    due.sort(key=lambda d: (d.due_on, d.hive_name.lower()))
    soon_limit = today + timedelta(days=DUE_SOON_DAYS)

    # -- health ----------------------------------------------------------------------------------------
    counts = {"ok": 0, "watch": 0, "alert": 0, "unknown": 0}
    attention = []
    for hive, apiary in hives:
        status, reasons = health_of(latest.get(hive.id))
        counts[status] += 1
        if status in ("alert", "watch"):
            attention.append(HomeAttention(
                hive_id=hive.id, hive_name=hive.name, apiary_name=apiary.name, status=status, reasons=reasons,
            ))
    attention.sort(key=lambda a: (a.status != "alert", a.hive_name.lower()))

    # -- treatments --------------------------------------------------------------------------------------
    open_query = visible_treatments(db, scope).filter(PlannedTreatment.done_on.is_(None))
    upcoming = (
        open_query.filter(PlannedTreatment.due_on <= today + timedelta(days=UPCOMING_TREATMENT_DAYS))
        .order_by(PlannedTreatment.due_on.asc(), PlannedTreatment.created_at.asc())
        .limit(SHOWN)
        .all()
    )

    ad = None
    if settings.announcement_title.strip():
        ad = HomeAd(
            id=settings.announcement_id or "announcement",
            label=settings.announcement_label or "Ad",
            title=settings.announcement_title,
            body=settings.announcement_body,
            url=settings.announcement_url or None,
        )

    return HomeOut(
        today=today,
        in_season=in_reminder_season(current_user, datetime.now(timezone.utc).month),
        apiary_count=len(apiaries),
        hive_count=len(hives),
        inspections=HomeInspections(
            interval_days=interval,
            overdue_count=sum(1 for d in due if d.due_on < today),
            due_soon_count=sum(1 for d in due if today <= d.due_on <= soon_limit),
            next=due[:SHOWN],
        ),
        health=HomeHealth(**counts, attention=attention[:SHOWN]),
        treatments=HomeTreatments(
            open_count=open_query.count(),
            overdue_count=open_query.filter(PlannedTreatment.due_on < today).count(),
            upcoming=[treatment_out(t) for t in upcoming],
        ),
        ad=ad,
    )
