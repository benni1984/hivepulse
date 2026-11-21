"""Translating what RevenueCat says into what this application stores.

The interesting part of this file is the two tables, not the HTTP. RevenueCat speaks in events —
twenty-odd of them — and this application knows five states; getting that mapping wrong is how a
paying subscriber loses access, and it is the kind of wrong that shows up weeks later as "my
subscription disappeared".

Nothing here decides anything. It turns a payload into the arguments `app.utils.entitlements`
takes, and that module remains the only place that writes.

Without credentials this degrades rather than fails, the same way `app/utils/push.py` does: a
server with no RevenueCat key still serves every other request, and a missing key must never be
the reason a beekeeper cannot open their hives.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Optional

import httpx

from app.clock import now_utc
from app.config import settings

log = logging.getLogger(__name__)

API = "https://api.revenuecat.com/v1"

#: Which store an event came from, in our words.
#:
#: `PROMOTIONAL` is RevenueCat's word for an entitlement granted in their dashboard rather than
#: bought. It lands on `manual`, beside the admin grant, because that is what it is.
STORES = {
    "APP_STORE": "apple",
    "MAC_APP_STORE": "apple",
    "PLAY_STORE": "google",
    "AMAZON": "google",
    "STRIPE": "web",
    "RC_BILLING": "web",
    "PADDLE": "web",
    "PROMOTIONAL": "manual",
}

#: Stores whose events are real but not ours to act on. Listed rather than left to the "unknown
#: store" branch so that setting the integration up does not print warnings that look like a
#: misconfiguration. TEST_STORE is what the dashboard's own test button sends.
IGNORED_STORES = frozenset({"TEST_STORE", "ROKU"})

#: What an event means for access.
#:
#: Two of these are worth reading twice:
#:
#: * **CANCELLATION is not the end of access.** It means auto-renewal was switched off. The
#:   subscription runs to the end of the period that was paid for, and taking the feature away on
#:   the day somebody cancels would be taking away something they bought.
#: * **BILLING_ISSUE is a grace period.** The store is retrying a card that failed. The person
#:   did nothing; locking them out while their bank decides turns a hiccup into a lost customer.
EVENTS = {
    "INITIAL_PURCHASE": "active",
    "RENEWAL": "active",
    "UNCANCELLATION": "active",
    "PRODUCT_CHANGE": "active",
    "NON_RENEWING_PURCHASE": "active",
    "SUBSCRIPTION_EXTENDED": "active",
    "TEMPORARY_ENTITLEMENT_GRANT": "active",
    "CANCELLATION": "active",          # usually. A refund comes through here too -- see below
    "BILLING_ISSUE": "grace",
    "EXPIRATION": "expired",
    "SUBSCRIPTION_PAUSED": "expired",
    "REFUND_REVERSED": "active",       # the money went back to us; so does the access
    "TRANSFER": "revoked",             # the purchase now belongs to another account
}

#: Event types that exist and mean nothing to this application. Named so the log can say
#: "ignored" instead of "unknown", which during setup is the difference between a quiet line and
#: a false alarm. TEST is the dashboard's own test button.
IGNORED_EVENTS = frozenset({
    "TEST", "INVOICE_ISSUANCE", "EXPERIMENT_ENROLLMENT", "VIRTUAL_CURRENCY_TRANSACTION",
    "PURCHASE_REDEEMED", "SUBSCRIBER_ALIAS",
    "PRICE_INCREASE_CONSENT_REQUIRED", "PRICE_INCREASE_CONSENT_APPROVED",
})

#: Why a CANCELLATION arrived. **There is no REFUND event type** -- the list is TEST,
#: INITIAL_PURCHASE, RENEWAL, CANCELLATION, ... REFUND_REVERSED, ... and a refund is documented as
#: "A subscription or non-renewing purchase was canceled or refunded", told apart only by this
#: reason. This file used to map a `REFUND` type that can never arrive, so a real refund was read
#: as an ordinary cancellation and the person kept the features until the period they no longer
#: paid for ran out (#496).
REFUND_REASON = "CUSTOMER_SUPPORT"

#: The two environments RevenueCat labels its events with. Anything else is not something it
#: sends, so it is read as "do not act".
ENVIRONMENTS = frozenset({"PRODUCTION", "SANDBOX"})


def _when(ms: Optional[int]) -> Optional[datetime]:
    """RevenueCat sends milliseconds since the epoch; this database stores naive UTC."""
    if ms is None:
        return None
    return datetime.fromtimestamp(int(ms) / 1000, tz=timezone.utc).replace(tzinfo=None)


def _is_ours(environment: Optional[str], what: str) -> bool:
    """Whether something labelled `environment` belongs to this deployment.

    RevenueCat's webhook configuration offers Production, Sandbox or Both, and Both is its
    default. Pick that on a webhook pointing at production and a purchase paid for with a test
    card unlocks the paid features for real. Configuration is the first line of defence --
    one webhook per environment, each with its own secret -- and this is the second, for the
    day somebody clicks "Both" without knowing what it means (#506).

    An unlabelled event is refused. RevenueCat labels every event it sends, so one without a
    label is either not from RevenueCat or not what this code was written against, and
    granting access on it would be guessing. Refusing withholds a feature somebody may have
    paid for, which complains out loud; the other direction hands the paid features to a test
    card and says nothing.
    """
    want = (settings.revenuecat_environment or "").strip().upper()
    if want not in ENVIRONMENTS:
        # A deployment configured with nonsense gets the strict reading, not a free pass. The
        # module degrades rather than fails, the way its docstring says.
        log.warning("revenuecat: REVENUECAT_ENVIRONMENT is %r, reading it as PRODUCTION",
                    settings.revenuecat_environment)
        want = "PRODUCTION"

    got = (environment or "").strip().upper()
    if got == want:
        return True
    log.warning("revenuecat: ignoring %s from the %s environment; this deployment accepts %s",
                what, got or "unlabelled", want)
    return False


def read_event(payload: dict[str, Any]) -> Optional[dict[str, Any]]:
    """What `entitlements.apply_event` needs, or None when this event is not ours to act on.

    Unknown event types return None on purpose. RevenueCat adds them, and a type we have never
    seen is not a reason to guess at somebody's access — the webhook answers 200 and the row stays
    as it was, which is the safe direction.
    """
    event = payload.get("event") or {}
    kind = event.get("type")

    if kind in IGNORED_EVENTS:
        log.info("revenuecat: %s is not ours to act on", kind)
        return None

    status = EVENTS.get(kind)
    if status is None:
        log.info("revenuecat: ignoring unknown event type %r", kind)
        return None

    # Before anything is read out of the event: a sandbox purchase must not unlock a
    # production account, however well the shared secret checked out (#506).
    if not _is_ours(event.get("environment"), f"a {kind} event"):
        return None

    # A refund arrives as a cancellation and is told apart only by its reason. Read before
    # anything else uses `status`, because the difference is "keeps the feature until the period
    # ends" against "lost it now" (#496).
    if kind == "CANCELLATION" and event.get("cancel_reason") == REFUND_REASON:
        status = "refunded"

    # "When looking up users from the webhook in your systems, make sure to search both the
    # `original_app_user_id` and the `aliases` array." We always hand RevenueCat our own id in
    # the purchase link, so `app_user_id` is normally it; the fallback costs nothing and covers
    # the case where an anonymous purchase was identified afterwards.
    user_id = event.get("app_user_id") or event.get("original_app_user_id")
    if not user_id:
        log.warning("revenuecat: %s event without an app_user_id", kind)
        return None

    raw_store = event.get("store") or ""
    if raw_store in IGNORED_STORES:
        log.info("revenuecat: %s event from %s, ignored", kind, raw_store)
        return None
    store = STORES.get(raw_store)
    if store is None:
        log.warning("revenuecat: %s event from unknown store %r", kind, raw_store)
        return None

    return {
        "app_user_id": str(user_id),
        "source": store,
        "status": status,
        "product_id": event.get("product_id"),
        "current_period_end": _when(event.get("expiration_at_ms")),
        # There is no auto-renew field in the payload -- deriving it from the event is not a
        # shortcut, it is the only way. A cancellation keeps access and loses the renewal;
        # everything else that grants access is expected to renew.
        "will_renew": status == "active" and kind != "CANCELLATION",
        "store_txn_id": event.get("transaction_id") or event.get("original_transaction_id"),
        "event_at": _when(event.get("event_timestamp_ms")),
        "raw": payload,
    }


def read_subscriber(user_id: str, body: dict[str, Any]) -> Optional[dict[str, Any]]:
    """The same shape, read from a subscriber the API was asked about rather than an event.

    Used by `POST /subscriptions/sync`, so a purchase unlocks the moment it completes instead of
    when the webhook lands. The webhook remains the authority; this only shortens the wait.
    """
    entitlements = ((body.get("subscriber") or {}).get("entitlements") or {})
    entitlement = entitlements.get(settings.revenuecat_entitlement)
    if not entitlement:
        return None

    expires = _when_iso(entitlement.get("expires_date"))
    product = entitlement.get("product_identifier")
    subscriptions = ((body.get("subscriber") or {}).get("subscriptions") or {})
    detail = subscriptions.get(product) or {}
    store = STORES.get((detail.get("store") or "").upper())
    if store is None:
        return None

    # `POST /subscriptions/sync` reaches this with nothing but a signed-in account, which
    # makes it the easier of the two ways in -- the webhook at least wants the shared secret.
    # The subscriber API labels each subscription with a boolean rather than the event's enum,
    # so a missing one means what the name says: not sandbox.
    sandbox = "SANDBOX" if detail.get("is_sandbox") else "PRODUCTION"
    if not _is_ours(sandbox, f"the {product} subscription of {user_id}"):
        return None

    now = now_utc()
    if expires is not None and expires <= now:
        status = "expired"
    elif detail.get("billing_issues_detected_at"):
        status = "grace"
    else:
        status = "active"

    return {
        "app_user_id": str(user_id),
        "source": store,
        "status": status,
        "product_id": product,
        "current_period_end": expires,
        "will_renew": not detail.get("unsubscribe_detected_at") and status == "active",
        "store_txn_id": detail.get("original_purchase_date"),
        "event_at": None,
        "raw": body,
    }


def _when_iso(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).replace(tzinfo=None)
    except ValueError:
        log.warning("revenuecat: cannot read date %r", value)
        return None


def fetch_subscriber(user_id: str) -> Optional[dict[str, Any]]:
    """Ask RevenueCat what this account is entitled to, or None when we cannot ask.

    Returns None — rather than raising — when there is no key configured, which is the normal
    state in CI and on a development machine. The caller treats that as "nothing changed".
    """
    if not settings.revenuecat_api_key:
        log.info("revenuecat: no API key, skipping sync for %s", user_id)
        return None
    try:
        response = httpx.get(
            f"{API}/subscribers/{user_id}",
            headers={"Authorization": f"Bearer {settings.revenuecat_api_key}"},
            timeout=10.0,
        )
        response.raise_for_status()
        return response.json()
    except Exception as exc:                                  # noqa: BLE001 - any failure is the same answer
        log.warning("revenuecat: could not read subscriber %s: %s", user_id, exc)
        return None
