"""The supporter subscription (#17, api-contract.md → Subscriptions).

Four endpoints and no cleverness: the state, a way to ask for it sooner, where to buy on the web
(#479), and the webhook that is the actual authority. Everything that changes an entitlement goes
through `app.utils.entitlements`, which is the only thing that writes a subscription or touches
`User.is_supporter` — this router never does it directly, not even for a purchase it just handed
somebody a link to.
"""
import json
import logging
import secrets
from typing import Optional
from urllib.parse import quote

from fastapi import APIRouter, Header, HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.deps import CurrentUser, DB
from app.i18n import error
from app.models import Subscription, User
from app.schemas import SubscriptionOut, WebCheckoutOut
from app import limits
from app.utils import entitlements, revenuecat

log = logging.getLogger(__name__)

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])

#: Apple and Google do not let an app cancel a subscription they sold; the person has to do it in
#: the store. Saying so here keeps the three clients from each deciding for themselves what they
#: may offer.
STORE_MANAGED = {"apple", "google"}

def _manage_url(row: Subscription) -> Optional[str]:
    """Where a web subscriber cancels. RevenueCat puts it in the subscriber body."""
    if row.source != "web" or not row.raw:
        return None
    try:
        body = json.loads(row.raw)
    except ValueError:
        return None
    return (body.get("subscriber") or {}).get("management_url")


def _out(db: Session, user: User, row: Optional[Subscription]) -> SubscriptionOut:
    """The stored state, plus what the account currently holds against its allowance (#478).

    The account is not optional. An earlier version let it default to None so that the
    "never bought anything" case could be a module constant, and the counters would then have
    silently read 0 of nothing for a real account — the kind of mistake that shows up as a
    paywall that never appears. Both callers have the account in hand; they pass it.

    The counters come from `app.limits`, never from a number repeated here: the limit is a product
    decision and the moment it exists in two places one of them is wrong.
    """
    counters = {
        "hives_used": limits.hive_count(db, user),
        "hive_limit": None if user.is_supporter else limits.FREE_HIVE_LIMIT,
    }
    if row is None:
        return SubscriptionOut(status="none", **counters)
    return SubscriptionOut(
        status=row.status,
        source=row.source,
        product_id=row.product_id,
        current_period_end=row.current_period_end,
        will_renew=bool(row.will_renew),
        store_managed=row.source in STORE_MANAGED,
        manage_url=_manage_url(row),
        **counters,
    )


@router.get("/me", response_model=SubscriptionOut)
def my_subscription(current_user: CurrentUser, db: DB):
    return _out(db, current_user, entitlements.current_for(db, current_user.id))


@router.get("/web-checkout", response_model=WebCheckoutOut)
def web_checkout(current_user: CurrentUser, accept_language: Optional[str] = Header(default=None)):
    """Where this account buys the subscription on the web (#479).

    **The server builds this URL, never a client.** The account id is a *path segment* of the
    purchase link, and leaving it out does not fall back to an anonymous purchase — the page
    answers 404. RevenueCat's own documentation also disagrees with itself about the parameter's
    name, and getting that wrong produces a successful payment attached to no account, which is
    the worst thing this feature could do. So one place decides, and it decides `user.id`.

    Not for the apps: buying inside them goes through StoreKit and Play Billing, and a web
    purchase link shown in an app is a store rejection. What a web purchase *grants* is of course
    honoured everywhere — that is the point of deriving `is_supporter` on the server.
    """
    # Two ways to be unable to sell, answered identically on purpose. The page already renders
    # this code as "cannot be bought here yet" in five languages, `scrub_event` already keeps it
    # out of Sentry (#497), and the E2E suite already expects it -- so the switch costs no new
    # user-facing text and no new noise.
    if not settings.web_checkout_enabled:
        # Deliberately switched off: the token may well be present and correct, but nobody has
        # said yet that this deployment may sell (#530).
        log.info("web checkout is switched off (WEB_CHECKOUT_ENABLED)")
        raise HTTPException(503, detail=error("WEB_CHECKOUT_UNCONFIGURED", accept_language))

    token = (settings.revenuecat_web_purchase_token_sandbox
             or settings.revenuecat_web_purchase_token)
    if not token:
        # Not a failure: it is the normal state of a deployment whose store side is unconfigured,
        # and of every test run. A page says "not yet" rather than showing an error.
        raise HTTPException(503, detail=error("WEB_CHECKOUT_UNCONFIGURED", accept_language))
    return WebCheckoutOut(
        url=f"https://pay.rev.cat/{token}/{quote(str(current_user.id), safe='')}"
            f"?email={quote(current_user.email, safe='')}"
    )


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
    return _out(db, current_user, entitlements.current_for(db, current_user.id))


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
