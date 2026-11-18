"""The one place that decides whether somebody is a supporter, and the only one that believes a
payment provider.

The shape of this module is the point of #17's design. RevenueCat verifies purchases against the
App Store, Google Play and the web, and tells us through a webhook — but it is **not** asked at
request time whether a user has access. It writes into `subscriptions`, and `subscriptions`
answers. That keeps a US service a verification step rather than a dependency the access system
hangs on, and it means swapping to the stores' own APIs later replaces this file and leaves the
data model standing.

Everything that touches a subscription goes through `apply_event`. There is no second write path.
"""
from __future__ import annotations

import json
from datetime import datetime
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.clock import now_utc
from app.models import Subscription, User

#: A subscription in one of these states grants access.
#:
#: `grace` is in here on purpose and is the one most often got wrong: the store is retrying a
#: payment that failed, the person has not cancelled anything, and locking them out while their
#: bank decides is how a renewal becomes a cancellation.
ACCESS_GRANTING = frozenset({"active", "grace"})

#: Everything the database accepts, so a provider's unknown status cannot be written through.
KNOWN_STATUSES = frozenset({"active", "grace", "expired", "refunded", "revoked"})
KNOWN_SOURCES = frozenset({"apple", "google", "web", "manual"})


def grants_access(subscription: Subscription) -> bool:
    """Whether this one record, right now, lets somebody in.

    The stored status is not trusted on its own: a webhook can be lost — a deploy at the wrong
    moment is enough — and an `active` row whose period ended three weeks ago must not keep a
    feature unlocked for free. `manual` has no end and is the exception.
    """
    if subscription.status not in ACCESS_GRANTING:
        return False
    if subscription.current_period_end is None:
        return True
    return subscription.current_period_end > now_utc()


def current_for(db: Session, user_id: str) -> Optional[Subscription]:
    """The record that decides, or None.

    Somebody who bought on the iPhone and later on the website has two rows. Taking the most
    generous of them is the only defensible answer — they paid twice, and which store we happen to
    ask first is not their problem.
    """
    rows = db.query(Subscription).filter(Subscription.user_id == user_id).all()
    granting = [r for r in rows if grants_access(r)]
    if granting:
        # The one that lasts longest; a `manual` grant (no end) wins outright.
        return max(granting, key=lambda r: (r.current_period_end is None,
                                            r.current_period_end or datetime.min))
    if not rows:
        return None
    # Nothing grants access: show the most recently touched, so the account page can say what
    # happened rather than pretending there was never a subscription.
    return max(rows, key=lambda r: r.updated_at or r.created_at or datetime.min)


def recompute_supporter(db: Session, user: User) -> bool:
    """Refresh the cached flag on the user from the records, and return it.

    `User.is_supporter` stays what every client reads; this is the only thing that writes it.
    """
    allowed = any(grants_access(r) for r in
                  db.query(Subscription).filter(Subscription.user_id == user.id).all())
    if user.is_supporter != allowed:
        user.is_supporter = allowed
    return allowed


def apply_event(
    db: Session,
    *,
    user: User,
    source: str,
    status: str,
    product_id: Optional[str] = None,
    current_period_end: Optional[datetime] = None,
    will_renew: bool = False,
    store_txn_id: Optional[str] = None,
    event_at: Optional[datetime] = None,
    raw: Optional[dict[str, Any]] = None,
) -> Subscription:
    """Write what a provider said, and refresh the cached flag.

    The single write path, so the three things that must happen together — the record, the
    ordering guard and the user's flag — cannot be done two out of three.

    Out-of-order events are dropped rather than applied. Webhooks retry, and a retried
    `INITIAL_PURCHASE` arriving after the `CANCELLATION` it preceded would hand back access that
    was taken away.
    """
    if source not in KNOWN_SOURCES:
        raise ValueError(f"unknown subscription source: {source!r}")
    if status not in KNOWN_STATUSES:
        raise ValueError(f"unknown subscription status: {status!r}")

    row = (
        db.query(Subscription)
        .filter(Subscription.user_id == user.id, Subscription.source == source)
        .one_or_none()
    )

    if row is not None and event_at is not None and row.event_at is not None:
        if event_at < row.event_at:
            # Older than what is stored. Leave it alone and let the caller report success: the
            # provider must not retry something we deliberately ignored.
            return row

    if row is None:
        row = Subscription(user_id=user.id, source=source)
        db.add(row)

    row.status = status
    row.product_id = product_id
    row.current_period_end = current_period_end
    row.will_renew = will_renew
    row.store_txn_id = store_txn_id
    row.event_at = event_at
    row.raw = json.dumps(raw, default=str) if raw is not None else None
    row.updated_at = now_utc()

    # Both sessions in this project are built with `autoflush=False` (app/database.py,
    # tests/conftest.py), so a row added above is invisible to the query below until it is
    # written. Without this the flag would be recomputed from everything *except* the event
    # being applied -- and a first purchase would leave `is_supporter` false.
    db.flush()

    recompute_supporter(db, user)
    return row


def revoke_manual(db: Session, user: User) -> None:
    """Take back a grant an admin made by hand, and nothing else.

    A `manual` record is removed rather than marked expired: it never had a period to end, and an
    expired row with no dates would read, on the account page, as a subscription that lapsed.
    Records from a store are left exactly where they are -- an admin taking back a courtesy must
    not cancel something somebody is paying for.
    """
    db.query(Subscription).filter(
        Subscription.user_id == user.id, Subscription.source == "manual"
    ).delete(synchronize_session=False)
    db.flush()
    recompute_supporter(db, user)


def sweep_expired(db: Session) -> int:
    """Close the gap a lost webhook leaves, and return how many accounts changed.

    Everything here is event-driven, which works until an event does not arrive. This is the
    backstop: it walks accounts whose cached flag says supporter and checks it against the records,
    so a missed `EXPIRATION` costs at most a day of free access rather than forever.

    Meant for the daily cron that already runs the inspection reminders.
    """
    changed = 0
    for user in db.query(User).filter(User.is_supporter.is_(True)).all():
        before = user.is_supporter
        if recompute_supporter(db, user) != before:
            changed += 1
    return changed
