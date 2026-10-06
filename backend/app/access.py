"""Who may see and change what, now that an apiary can have more than one beekeeper.

Every route used to answer that with `thing.user_id != current_user.id`. With sharing that
question has one answer, and it lives here, so that the apiary list, the hive routes, the
inspection routes, the stats and the exports cannot drift apart about who is allowed in.

Two levels matter:

* **Seeing and working**: owner and collaborators alike. Collaborators are equals for the
  daily work (inspections, editing hives).
* **Owning**: deleting, sharing, and putting an apiary on the public map. Those stay with the
  person whose apiary or hive it is.

What a caller may not see at all answers 404, as before, so that other people's apiaries stay
invisible; what they may see but not do answers 403 `OWNER_ONLY`.
"""
from __future__ import annotations

from typing import Optional

from fastapi import HTTPException
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.i18n import error
from app.models import Apiary, Hive, Share, User

OWNER = "owner"
SHARED = "shared"
PARTIAL = "partial"


class Scope:
    """What one user can reach, worked out once per request from their accepted shares."""

    def __init__(self, db: Session, user: User):
        self.db = db
        self.user = user
        rows = (
            db.query(Share.apiary_id, Share.hive_id)
            .filter(Share.grantee_user_id == user.id, Share.status == "accepted")
            .all()
        )
        self.shared_apiary_ids: set[str] = {a for a, _ in rows if a}
        self.shared_hive_ids: set[str] = {h for _, h in rows if h}
        self._partial_apiary_ids: Optional[set[str]] = None

    @property
    def partial_apiary_ids(self) -> set[str]:
        """Apiaries the user sees only because one of their hives was shared."""
        if self._partial_apiary_ids is None:
            found: set[str] = set()
            if self.shared_hive_ids:
                found = {
                    apiary_id for (apiary_id,) in
                    self.db.query(Hive.apiary_id).filter(Hive.id.in_(self.shared_hive_ids))
                }
            self._partial_apiary_ids = found - self.shared_apiary_ids
        return self._partial_apiary_ids

    # -- one thing --------------------------------------------------------------------------

    def apiary_access(self, apiary: Apiary) -> Optional[str]:
        if apiary.user_id == self.user.id:
            return OWNER
        if apiary.id in self.shared_apiary_ids:
            return SHARED
        if apiary.id in self.partial_apiary_ids:
            return PARTIAL
        return None

    def hive_access(self, hive: Hive) -> Optional[str]:
        # The apiary's owner owns every hive in it, including one a collaborator added.
        if hive.user_id == self.user.id or hive.apiary.user_id == self.user.id:
            return OWNER
        if hive.id in self.shared_hive_ids or hive.apiary_id in self.shared_apiary_ids:
            return SHARED
        return None

    # -- many things, as query conditions ---------------------------------------------------

    def apiary_filter(self):
        return or_(
            Apiary.user_id == self.user.id,
            Apiary.id.in_(self.shared_apiary_ids),
            Apiary.id.in_(self.partial_apiary_ids),
        )

    def hive_filter(self):
        return or_(
            Hive.user_id == self.user.id,
            Hive.apiary_id.in_(select(Apiary.id).where(Apiary.user_id == self.user.id)),
            Hive.apiary_id.in_(self.shared_apiary_ids),
            Hive.id.in_(self.shared_hive_ids),
        )

    def hives_in(self, apiary: Apiary) -> list[Hive]:
        """The hives of an apiary this user may see: all of them, or only the shared ones."""
        if self.apiary_access(apiary) == PARTIAL:
            return [h for h in apiary.hives if h.id in self.shared_hive_ids]
        return list(apiary.hives)


def apiary_or_404(db: Session, user: User, apiary_id: str, lang, need: str = "view"):
    """The apiary and the caller's access to it. `need` is "view", "edit" or "owner"."""
    apiary = db.get(Apiary, apiary_id)
    scope = Scope(db, user)
    access = scope.apiary_access(apiary) if apiary else None
    if access is None:
        raise HTTPException(404, detail=error("APIARY_NOT_FOUND", lang))
    if need == "owner" and access != OWNER:
        raise HTTPException(403, detail=error("OWNER_ONLY", lang))
    if need == "edit" and access == PARTIAL:
        raise HTTPException(403, detail=error("OWNER_ONLY", lang))
    return apiary, access, scope


def hive_or_404(db: Session, user: User, hive_id: str, lang, need: str = "view"):
    """The hive and the caller's access to it. `need` is "view" (which also allows working on
    it) or "owner"."""
    hive = db.get(Hive, hive_id)
    scope = Scope(db, user)
    access = scope.hive_access(hive) if hive else None
    if access is None:
        raise HTTPException(404, detail=error("HIVE_NOT_FOUND", lang))
    if need == "owner" and access != OWNER:
        raise HTTPException(403, detail=error("OWNER_ONLY", lang))
    return hive, access, scope


def remove_shares(db: Session, *, apiary_id: Optional[str] = None, hive_id: Optional[str] = None) -> None:
    """Forget the shares of something that is being deleted. The database cascades too, but not
    everywhere the tests run, and a share without its target is meaningless."""
    if apiary_id is None and hive_id is None:
        raise ValueError("remove_shares needs a target; with none it would delete every share")
    query = db.query(Share)
    if apiary_id is not None:
        query = query.filter(Share.apiary_id == apiary_id)
    if hive_id is not None:
        query = query.filter(Share.hive_id == hive_id)
    query.delete(synchronize_session=False)
