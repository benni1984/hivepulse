"""The supporter subscription (#17, api-contract.md → Subscriptions).

Three endpoints and no cleverness: the state, a way to ask for it sooner, and the webhook that is
the actual authority. All three go through `app.utils.entitlements`, which is the only thing that
writes a subscription or touches `User.is_supporter`.
"""
import json
import logging
import secrets
from typing import Optional

from fastapi import APIRouter, Header, HTTPException

from app.config import settings
from app.deps import CurrentUser, DB
from app.models import Subscription, User
from app.schemas import SubscriptionOut
from app.utils import entitlements, revenuecat

log = logging.getLogger(__name__)

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])

#: Apple and Google do not let an app cancel a subscription they sold; the person has to do it in
#: the store. Saying so here keeps the three clients from each deciding for themselves what they
#: may offer.
STORE_MANAGED = {"apple", "google"}

NONE = SubscriptionOut(status="none")


def _manage_url(row: Subscription) -> Optional[str]:
    """Where a web subscriber cancels. RevenueCat puts it in the subscriber body."""
    if row.source != "web" or not row.raw:
        return None
    try:
        body = json.loads(row.raw)
    except ValueError:
        return None
    return (body.get("subscriber") or {}).get("management_url")


def _out(row: Optional[Subscription]) -> SubscriptionOut:
    if row is None:
        return NONE
    return SubscriptionOut(
        status=row.status,
        source=row.source,
        product_id=row.product_id,
        current_period_end=row.current_period_end,
        will_renew=bool(row.will_renew),
        store_managed=row.source in STORE_MANAGED,
        manage_url=_manage_url(row),
    )


@router.get("/me", response_model=SubscriptionOut)
def my_subscription(current_user: CurrentUser, db: DB):
    return _out(entitlements.current_for(db, current_user.id))


@router.post("/sync", response_model=SubscriptionOut)
def sync(current_user: CurrentUser, db: DB):
    """Refresh this account from the provider, instead of waiting for the webhook.

    The webhook stays the authority; this only shortens the wait between somebody paying and the
    feature unlocking, which is not a wait anybody should watch a spinner through.

    Nothing to ask (no key configured, RevenueCat unreachable, nothing bought) is not an error:
    the stored state is returned unchanged. A failed sync must never look like a cancelled
    subscription.
    """
    body = revenuecat.fetch_subscriber(current_user.id)
    if body is not None:
        event = revenuecat.read_subscriber(current_user.id, body)
        if event is not None:
            event.pop("app_user_id", None)
            entitlements.apply_event(db, user=current_user, **event)
            db.commit()
    return _out(entitlements.current_for(db, current_user.id))


@router.post("/webhook")
def webhook(db: DB, payload: dict, authorization: Optional[str] = Header(default=None)):
    """Everything a client never sees: a renewal while the phone is off, a cancellation made in
    the App Store, a refund granted weeks later, a card that stopped working.

    Not authenticated as a user. RevenueCat sends a shared secret, compared in constant time the
    way `/notifications/send-reminders` compares its cron secret.
    """
    expected = settings.revenuecat_webhook_secret
    presented = (authorization or "").removeprefix("Bearer ").strip()
    # An empty configured secret must refuse everything rather than accept everything: a
    # misconfigured deployment should go quiet, not open.
    if not expected or not secrets.compare_digest(presented, expected):
        raise HTTPException(401, detail={"code": "WEBHOOK_UNAUTHORIZED",
                                         "message": "Unauthorized."})

    event = revenuecat.read_event(payload)
    if event is None:
        # An event type we do not know, or one without an account. Answering 200 stops RevenueCat
        # retrying something we deliberately ignored.
        return {"handled": False}

    user = db.get(User, event.pop("app_user_id"))
    if user is None:
        # A purchase for an account that no longer exists -- somebody deleted theirs while a
        # subscription ran. Nothing to do, and nothing to retry.
        log.info("revenuecat: event for an unknown account")
        return {"handled": False}

    entitlements.apply_event(db, user=user, **event)
    db.commit()
    return {"handled": True}
