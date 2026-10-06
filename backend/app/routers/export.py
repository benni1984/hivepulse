import csv
import io
import json
from typing import List, Optional

from fastapi import APIRouter, Header, HTTPException, Query
from fastapi.responses import Response

from app.access import apiary_or_404, hive_or_404
from app.deps import CurrentUser, DB
from app.models import Inspection
from app.schemas import InspectionOut

router = APIRouter(tags=["export"])

_STD_FIELDS = [
    "id", "hive_id", "date", "queen_seen", "queen_color",
    "brood_frames", "honey_frames", "mood", "population_strength",
    "varroa_level", "varroa_count", "swarm_cells_seen", "treatment_applied",
    "feeding_done", "feeding_type", "weight_kg", "notes", "created_at",
]


def _inspections_to_csv(rows: List[dict]) -> str:
    custom_keys: list[str] = []
    for row in rows:
        for k in (row.get("custom_fields") or {}):
            if k not in custom_keys:
                custom_keys.append(k)

    buf = io.StringIO()
    fieldnames = _STD_FIELDS + custom_keys
    writer = csv.DictWriter(buf, fieldnames=fieldnames, extrasaction="ignore", lineterminator="\r\n")
    writer.writeheader()
    for row in rows:
        flat = {f: row.get(f) for f in _STD_FIELDS}
        for k in custom_keys:
            flat[k] = (row.get("custom_fields") or {}).get(k)
        writer.writerow(flat)
    return buf.getvalue()


@router.get("/hives/{hive_id}/inspections/export")
def export_hive_inspections(
    hive_id: str,
    current_user: CurrentUser,
    db: DB,
    format: str = Query("json", pattern="^(json|csv)$"),
    accept_language: Optional[str] = Header(default=None),
):
    hive_or_404(db, current_user, hive_id, accept_language)
    inspections = (
        db.query(Inspection)
        .filter(Inspection.hive_id == hive_id)
        .order_by(Inspection.date.desc())
        .all()
    )
    rows = [InspectionOut.model_validate(i).model_dump(mode="json") for i in inspections]

    if format == "csv":
        content = _inspections_to_csv(rows)
        return Response(
            content=content,
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="hive_{hive_id}_inspections.csv"'},
        )

    return Response(
        content=json.dumps(rows, default=str),
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="hive_{hive_id}_inspections.json"'},
    )


@router.get("/apiaries/{apiary_id}/inspections/export")
def export_apiary_inspections(
    apiary_id: str,
    current_user: CurrentUser,
    db: DB,
    format: str = Query("json", pattern="^(json|csv)$"),
    accept_language: Optional[str] = Header(default=None),
):
    apiary, _, scope = apiary_or_404(db, current_user, apiary_id, accept_language)
    # Somebody who has single hives of this apiary shared gets the records of those hives only.
    hives = scope.hives_in(apiary)
    hive_ids = [h.id for h in hives]
    if not hive_ids:
        inspections = []
    else:
        inspections = (
            db.query(Inspection)
            .filter(Inspection.hive_id.in_(hive_ids))
            .order_by(Inspection.date.desc())
            .all()
        )

    rows = [InspectionOut.model_validate(i).model_dump(mode="json") for i in inspections]

    if format == "csv":
        hive_name_map = {h.id: h.name for h in hives}
        for row in rows:
            row["hive_name"] = hive_name_map.get(row["hive_id"], "")

        custom_keys: list[str] = []
        for row in rows:
            for k in (row.get("custom_fields") or {}):
                if k not in custom_keys:
                    custom_keys.append(k)

        buf = io.StringIO()
        fieldnames = ["hive_name"] + _STD_FIELDS + custom_keys
        writer = csv.DictWriter(buf, fieldnames=fieldnames, extrasaction="ignore", lineterminator="\r\n")
        writer.writeheader()
        for row in rows:
            flat = {f: row.get(f) for f in ["hive_name"] + _STD_FIELDS}
            for k in custom_keys:
                flat[k] = (row.get("custom_fields") or {}).get(k)
            writer.writerow(flat)

        return Response(
            content=buf.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="apiary_{apiary_id}_inspections.csv"'},
        )

    return Response(
        content=json.dumps(rows, default=str),
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="apiary_{apiary_id}_inspections.json"'},
    )
