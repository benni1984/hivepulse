"""Who is a supporter, and why.

The whole of #17 rests on this module: RevenueCat verifies purchases, but it is never asked at
request time whether somebody has access. It writes records, and these rules read them. So the
rules are worth more tests than the plumbing around them.

Three of these describe mistakes that cost real users real access in other products, which is why
they are spelled out rather than folded into one happy path:

  * a grace period is not a cancellation,
  * a stored `active` whose period has ended is not access,
  * a retried webhook that arrives late must not undo what happened after it.
"""
from datetime import timedelta

import pytest

from app.clock import now_utc
from app.models import Subscription, User
from app.utils import entitlements


@pytest.fixture
def user(db_session):
    u = User(email="sub@example.com", name="Sub", hashed_password="x", locale="en")
    db_session.add(u)
    db_session.commit()
    return u


def _apply(db, user, **kwargs):
    kwargs.setdefault("source", "apple")
    kwargs.setdefault("status", "active")
    kwargs.setdefault("current_period_end", now_utc() + timedelta(days=30))
    row = entitlements.apply_event(db, user=user, **kwargs)
    db.commit()
    return row


# --------------------------------------------------------------------------------------------
# What grants access
# --------------------------------------------------------------------------------------------

def test_an_active_subscription_makes_a_supporter(db_session, user):
    _apply(db_session, user)

    assert user.is_supporter is True
    assert entitlements.current_for(db_session, user.id).status == "active"


def test_a_grace_period_still_grants_access(db_session, user):
    """The one most often got wrong. The store is retrying a payment that failed; the person
    cancelled nothing. Locking them out while their bank decides turns a renewal into a
    cancellation."""
    _apply(db_session, user, status="grace")

    assert user.is_supporter is True


@pytest.mark.parametrize("status", ["expired", "refunded", "revoked"])
def test_everything_else_does_not(db_session, user, status):
    _apply(db_session, user, status=status)

    assert user.is_supporter is False


def test_an_active_record_whose_period_has_ended_grants_nothing(db_session, user):
    """A webhook can be lost -- a deploy at the wrong moment is enough. The stored status is not
    trusted on its own, or a missed EXPIRATION would unlock a paid feature forever."""
    _apply(db_session, user, status="active",
           current_period_end=now_utc() - timedelta(days=21))

    assert user.is_supporter is False


def test_a_manual_grant_never_expires(db_session, user):
    """`review@multihead.de` is the reason this exists: the store reviewers sign in with it, and
    a review that cannot see the paid feature fails with "we could not test it"."""
    _apply(db_session, user, source="manual", current_period_end=None)

    assert user.is_supporter is True


# --------------------------------------------------------------------------------------------
# Two purchases, one person
# --------------------------------------------------------------------------------------------

def test_somebody_who_bought_twice_keeps_the_longer_one(db_session, user):
    """Buying on the iPhone and later on the website is not an error to resolve against the user.
    They paid twice; which store we happen to look at first is not their problem."""
    _apply(db_session, user, source="apple", current_period_end=now_utc() + timedelta(days=5))
    _apply(db_session, user, source="web", current_period_end=now_utc() + timedelta(days=300))

    current = entitlements.current_for(db_session, user.id)

    assert current.source == "web"
    assert user.is_supporter is True


def test_one_lapsed_purchase_does_not_cancel_a_live_one(db_session, user):
    _apply(db_session, user, source="apple", status="expired",
           current_period_end=now_utc() - timedelta(days=1))
    _apply(db_session, user, source="web", status="active")

    assert user.is_supporter is True
    assert entitlements.current_for(db_session, user.id).source == "web"


def test_with_nothing_live_the_account_page_still_learns_what_happened(db_session, user):
    """Showing nothing would be a worse answer than showing an expired subscription: the person
    is on that page precisely because something stopped working."""
    _apply(db_session, user, status="expired", current_period_end=now_utc() - timedelta(days=2))

    current = entitlements.current_for(db_session, user.id)

    assert current is not None and current.status == "expired"
    assert user.is_supporter is False


def test_an_account_that_never_bought_anything_has_none(db_session, user):
    assert entitlements.current_for(db_session, user.id) is None
    assert user.is_supporter is False


# --------------------------------------------------------------------------------------------
# Events arrive more than once, and not in order
# --------------------------------------------------------------------------------------------

def test_an_event_older_than_the_record_is_ignored(db_session, user):
    """RevenueCat retries on any non-2xx, so a purchase event can arrive after the cancellation
    that followed it. Applying it would hand back access that was taken away."""
    cancelled_at = now_utc()
    _apply(db_session, user, status="revoked", event_at=cancelled_at,
           current_period_end=now_utc() + timedelta(days=30))

    _apply(db_session, user, status="active", event_at=cancelled_at - timedelta(hours=1))

    assert entitlements.current_for(db_session, user.id).status == "revoked"
    assert user.is_supporter is False


def test_the_same_event_twice_changes_nothing(db_session, user):
    at = now_utc()
    _apply(db_session, user, status="active", event_at=at, store_txn_id="txn-1")
    _apply(db_session, user, status="active", event_at=at, store_txn_id="txn-1")

    rows = db_session.query(Subscription).filter(Subscription.user_id == user.id).all()

    assert len(rows) == 1
    assert user.is_supporter is True


def test_a_newer_event_is_applied(db_session, user):
    _apply(db_session, user, status="active", event_at=now_utc() - timedelta(days=1))
    _apply(db_session, user, status="refunded", event_at=now_utc())

    assert user.is_supporter is False


# --------------------------------------------------------------------------------------------
# The backstop
# --------------------------------------------------------------------------------------------

def test_the_sweep_takes_back_what_a_lost_webhook_left_open(db_session, user):
    """Everything here is event-driven, which works until an event does not arrive. The daily
    sweep means a missed expiry costs a day of free access rather than forever."""
    _apply(db_session, user, status="active", current_period_end=now_utc() + timedelta(days=1))
    assert user.is_supporter is True

    row = entitlements.current_for(db_session, user.id)
    row.current_period_end = now_utc() - timedelta(minutes=1)
    db_session.commit()

    changed = entitlements.sweep_expired(db_session)
    db_session.commit()

    assert changed == 1
    assert user.is_supporter is False


def test_the_sweep_leaves_a_live_subscription_alone(db_session, user):
    _apply(db_session, user, status="active")

    assert entitlements.sweep_expired(db_session) == 0
    assert user.is_supporter is True


# --------------------------------------------------------------------------------------------
# Nothing a provider says is taken on trust
# --------------------------------------------------------------------------------------------

@pytest.mark.parametrize("bad", ["paused", "", "ACTIVE", "cancelled"])
def test_a_status_the_database_does_not_know_is_refused(db_session, user, bad):
    """Providers add states. Writing one through would mean a value no gate understands, which
    fails open or closed depending on where it is read -- both wrong, neither visible."""
    with pytest.raises(ValueError):
        entitlements.apply_event(db_session, user=user, source="apple", status=bad)


def test_a_source_the_database_does_not_know_is_refused(db_session, user):
    with pytest.raises(ValueError):
        entitlements.apply_event(db_session, user=user, source="amazon", status="active")
