"""How much of the application an account has, as opposed to what it is allowed to see.

`app/access.py` answers "whose apiary is this". This answers "what does this account include".
The two are deliberately apart: ownership never changes, and a subscription changes the moment one
lapses — mixing them would mean a lapsed subscription looked like somebody else's hive.

## The rule that matters more than any number

**Reaching a limit never closes what already exists.** No hiding, no read-only, no deletion: the
only thing that stops is adding the eleventh colony. A paywall that locks away work somebody has
already done is the one thing this kind of product does not survive, and it would be a particularly
poor thing to do to a record of living animals.

Everything here therefore guards a *creation*, never a read. There is no function in this file
that can take something away.

## Where the line runs (#478)

Decided while the application had no users at all, because a quantity limit is close to
impossible to introduce once people have crossed it.

* **Ten colonies** free, apiaries unlimited. Ten covers the real hobbyist, who should never pay;
  somebody keeping twenty-five does not notice €19.99 a year.
* **Working together, custom fields, the whole statistics history** need the subscription.
* **The person who invites** needs it — a guest accepting an invitation works for free. A feature
  that needs two paying people sells to nobody.
* The hornet tracker, the beekeeping year, QR codes, offline inspections and the raw data export
  stay free, on purpose. The reasons are in #478.
"""
from __future__ import annotations

from datetime import date, timedelta
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.clock import today_utc
from app.i18n import error
from app.models import Hive, User

#: Colonies an account may keep without a subscription.
FREE_HIVE_LIMIT = 10

#: How far back statistics reach without one. A year covers the running season and the one
#: before it, which is what a beekeeper compares against; further back is the subscription.
FREE_HISTORY_DAYS = 365


def hive_count(db: Session, user: User) -> int:
    """Colonies this account owns. Hives shared *with* them belong to somebody else and are that
    person's allowance, not this one's."""
    return db.query(Hive).filter(Hive.user_id == user.id).count()


def hives_left(db: Session, user: User) -> Optional[int]:
    """How many more may be added, or None when there is no limit."""
    if user.is_supporter:
        return None
    return max(0, FREE_HIVE_LIMIT - hive_count(db, user))


def require_room_for_a_hive(db: Session, user: User,
                            accept_language: Optional[str] = None) -> None:
    """Guards both ways a hive comes into being: made by hand, and the first scan of a new code.

    Raises before anything is written, so a refused attempt leaves no half-made QR batch behind.
    """
    if user.is_supporter:
        return
    if hive_count(db, user) < FREE_HIVE_LIMIT:
        return
    raise HTTPException(403, detail=error("FREE_HIVE_LIMIT_REACHED", accept_language))


def require_supporter(user: User, accept_language: Optional[str] = None) -> None:
    """For the things that are the subscription rather than a quantity of it."""
    if user.is_supporter or user.is_admin:
        return
    raise HTTPException(403, detail=error("SUPPORTER_REQUIRED", accept_language))


def earliest_allowed_stats_day(user: User) -> Optional[date]:
    """The oldest day a statistics window may begin on, or None when there is no limit.

    **A day, not a preset.** The first version of this asked whether the *preset* was allowed, and
    three ways of asking walked straight past it: no parameters at all (which means "everything",
    and is what the clients actually send), a preset nobody recognises, and an explicit
    `from=2000-01-01`. A limit that only holds for the polite spelling of a question is not a
    limit. Every window now ends up here, however it was asked for.

    And it **narrows rather than refuses**. A statistics page that answers 403 teaches somebody
    that the app is broken; one that shows a year instead of everything teaches them what the
    subscription is for. This is a limit people should meet as a smaller number, not as an error.
    """
    if user.is_supporter or user.is_admin:
        return None
    return today_utc() - timedelta(days=FREE_HISTORY_DAYS)
