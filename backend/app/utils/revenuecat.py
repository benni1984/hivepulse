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
    "CANCELLATION": "active",          # until the period ends; `will_renew` carries the news
    "BILLING_ISSUE": "grace",
    "EXPIRATION": "expired",
    "SUBSCRIPTION_PAUSED": "expired",
    "REFUND": "refunded",
    "TRANSFER": "revoked",             # the purchase now belongs to another account
}


def _when(ms: Optional[int]) -> Optional[datetime]:
    """RevenueCat sends milliseconds since the epoch; this database stores naive UTC."""
    if ms is None:
        return None
    return datetime.fromtimestamp(int(ms) / 1000, tz=timezone.utc).replace(tzinfo=None)


def read_event(payload: dict[str, Any]) -> Optional[dict[str, Any]]:
    """What `entitlements.apply_event` needs, or None when this event is not ours to act on.

    Unknown event types return None on purpose. RevenueCat adds them, and a type we have never
    seen is not a reason to guess at somebody's access — the webhook answers 200 and the row stays
    as it was, which is the safe direction.
    """
    event = payload.get("event") or {}
    kind = event.get("type")
    status = EVENTS.get(kind)
    if status is None:
        log.info("revenuecat: ignoring unknown event type %r", kind)
        return None

    user_id = event.get("app_user_id")
    if not user_id:
        log.warning("revenuecat: %s event without an app_user_id", kind)
        return None

    store = STORES.get(event.get("store") or "")
    if store is None:
        log.warning("revenuecat: %s event from unknown store %r", kind, event.get("store"))
        return None

    return {
        "app_user_id": str(user_id),
        "source": store,
        "status": status,
        "product_id": event.get("product_id"),
        "current_period_end": _when(event.get("expiration_at_ms")),
        # A cancellation keeps access and loses the renewal; everything else that grants access
        # is expected to renew.
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
