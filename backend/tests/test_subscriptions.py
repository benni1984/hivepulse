"""The three endpoints of the supporter subscription (#17).

The rules about who is entitled to what live in `test_entitlements.py`; this file is about the
edges where the outside world touches them — a webhook with the wrong secret, an event for an
account that no longer exists, an event type RevenueCat invented after this was written.

The one worth reading is `a cancellation does not take the feature away`. Cancelling means
auto-renewal is off; the subscription still runs to the end of the period that was paid for.
Revoking access on the day somebody cancels is taking away something they bought, and it is a
mistake that is easy to make and hard to notice.
"""
from datetime import timedelta

import pytest

from app.clock import now_utc
from app.models import User

SECRET = "rc-webhook-secret"


@pytest.fixture(autouse=True)
def set_webhook_secret(monkeypatch):
    from app import config as cfg
    monkeypatch.setattr(cfg.settings, "revenuecat_webhook_secret", SECRET)


@pytest.fixture(autouse=True)
def no_revenuecat_calls(monkeypatch):
    """`/sync` must never reach the network in a test. With no key configured it does not, and
    this makes that explicit rather than hopeful."""
    from app.utils import revenuecat
    monkeypatch.setattr(revenuecat, "fetch_subscriber", lambda user_id: None)


def _headers(secret: str = SECRET):
    return {"Authorization": f"Bearer {secret}"}


def _event(user_id: str, kind: str = "INITIAL_PURCHASE", store: str = "APP_STORE", **over):
    ms = int(now_utc().timestamp() * 1000)
    event = {
        "type": kind,
        "app_user_id": user_id,
        "store": store,
        "product_id": "supporter_yearly",
        "transaction_id": "txn-1",
        "expiration_at_ms": ms + 365 * 24 * 3600 * 1000,
        "event_timestamp_ms": ms,
    }
    event.update(over)
    return {"event": event}


def _user_id(db_session, email="test@example.com") -> str:
    return db_session.query(User).filter(User.email == email).first().id


# --------------------------------------------------------------------------------------------
# What the account sees
# --------------------------------------------------------------------------------------------

def test_an_account_that_never_bought_anything_gets_a_shape_not_a_null(auth_client):
    """Always an object. A sometimes-absent body is three decoders' worth of special case."""
    resp = auth_client.get("/api/v1/subscriptions/me")

    assert resp.status_code == 200
    assert resp.json()["status"] == "none"
    assert resp.json()["source"] is None


def test_a_purchase_shows_up_with_its_end_date(auth_client, db_session):
    user_id = _user_id(db_session)
    auth_client.post("/api/v1/subscriptions/webhook", json=_event(user_id), headers=_headers())

    body = auth_client.get("/api/v1/subscriptions/me").json()

    assert body["status"] == "active"
    assert body["source"] == "apple"
    assert body["product_id"] == "supporter_yearly"
    assert body["current_period_end"] is not None
    assert body["will_renew"] is True


@pytest.mark.parametrize("store,source,managed", [
    ("APP_STORE", "apple", True),
    ("PLAY_STORE", "google", True),
    ("STRIPE", "web", False),
])
def test_the_client_is_told_whether_it_may_offer_to_cancel(auth_client, db_session, store, source, managed):
    """Apple and Google do not let an app cancel what they sold. Deciding that here means the
    three clients do not each guess at it."""
    user_id = _user_id(db_session)
    auth_client.post("/api/v1/subscriptions/webhook",
                     json=_event(user_id, store=store), headers=_headers())

    body = auth_client.get("/api/v1/subscriptions/me").json()

    assert body["source"] == source
    assert body["store_managed"] is managed


def test_sync_returns_the_stored_state_when_there_is_nothing_to_ask(auth_client):
    """No key, RevenueCat unreachable, nothing bought — none of it is an error. A failed sync
    must never look like a cancelled subscription."""
    resp = auth_client.post("/api/v1/subscriptions/sync")

    assert resp.status_code == 200
    assert resp.json()["status"] == "none"


# --------------------------------------------------------------------------------------------
# The webhook, which is the one open to the internet
# --------------------------------------------------------------------------------------------

def test_without_the_secret_it_refuses(client, db_session):
    resp = client.post("/api/v1/subscriptions/webhook", json=_event("whoever"))

    assert resp.status_code == 401
    assert resp.json()["detail"]["code"] == "WEBHOOK_UNAUTHORIZED"


def test_with_the_wrong_secret_it_refuses(client):
    resp = client.post("/api/v1/subscriptions/webhook", json=_event("whoever"),
                       headers=_headers("not-the-secret"))

    assert resp.status_code == 401


def test_an_unconfigured_secret_refuses_everything_rather_than_accepting_it(client, monkeypatch):
    """A deployment that forgot the secret should go quiet, not open. The opposite default would
    turn one missing environment variable into an endpoint that grants subscriptions."""
    from app import config as cfg
    monkeypatch.setattr(cfg.settings, "revenuecat_webhook_secret", "")

    resp = client.post("/api/v1/subscriptions/webhook", json=_event("whoever"), headers=_headers(""))

    assert resp.status_code == 401


def test_an_event_for_an_account_that_no_longer_exists_is_not_retried(client):
    """Somebody deleted their account while a subscription ran. Nothing to do — and answering
    anything but 200 would have RevenueCat retry it forever."""
    resp = client.post("/api/v1/subscriptions/webhook",
                       json=_event("no-such-user"), headers=_headers())

    assert resp.status_code == 200
    assert resp.json()["handled"] is False


def test_an_event_type_we_have_never_seen_is_ignored_rather_than_guessed_at(auth_client, db_session):
    """RevenueCat adds event types. A type we do not know is not a reason to guess at somebody's
    access, so the row stays as it was and the webhook still answers 200."""
    user_id = _user_id(db_session)
    auth_client.post("/api/v1/subscriptions/webhook", json=_event(user_id), headers=_headers())

    resp = auth_client.post("/api/v1/subscriptions/webhook",
                            json=_event(user_id, kind="SOMETHING_NEW"), headers=_headers())

    assert resp.status_code == 200
    assert resp.json()["handled"] is False
    assert auth_client.get("/api/v1/subscriptions/me").json()["status"] == "active"


def test_an_event_from_a_store_we_do_not_know_is_ignored_too(auth_client, db_session):
    user_id = _user_id(db_session)

    resp = auth_client.post("/api/v1/subscriptions/webhook",
                            json=_event(user_id, store="SOME_NEW_STORE"), headers=_headers())

    assert resp.json()["handled"] is False


# --------------------------------------------------------------------------------------------
# What the events mean
# --------------------------------------------------------------------------------------------

def test_a_cancellation_does_not_take_the_feature_away(auth_client, db_session):
    """The whole point. Cancelling switches auto-renewal off; the subscription runs to the end of
    what was paid for. Revoking on the day of the cancellation takes away something bought."""
    user_id = _user_id(db_session)
    auth_client.post("/api/v1/subscriptions/webhook", json=_event(user_id), headers=_headers())

    ms = int((now_utc() + timedelta(seconds=1)).timestamp() * 1000)
    auth_client.post("/api/v1/subscriptions/webhook",
                     json=_event(user_id, kind="CANCELLATION", event_timestamp_ms=ms),
                     headers=_headers())

    body = auth_client.get("/api/v1/subscriptions/me").json()
    assert body["status"] == "active", "access ends when the period does, not when they cancel"
    assert body["will_renew"] is False, "but it will not come back by itself"
    assert auth_client.get("/api/v1/users/me").json()["is_supporter"] is True


def test_a_billing_problem_is_a_grace_period_and_not_a_lockout(auth_client, db_session):
    """The store is retrying a card that failed. The person did nothing; locking them out while
    their bank decides turns a hiccup into a lost customer."""
    user_id = _user_id(db_session)

    auth_client.post("/api/v1/subscriptions/webhook",
                     json=_event(user_id, kind="BILLING_ISSUE"), headers=_headers())

    assert auth_client.get("/api/v1/subscriptions/me").json()["status"] == "grace"
    assert auth_client.get("/api/v1/users/me").json()["is_supporter"] is True


def test_an_expiry_ends_it(auth_client, db_session):
    user_id = _user_id(db_session)
    auth_client.post("/api/v1/subscriptions/webhook", json=_event(user_id), headers=_headers())

    ms = int((now_utc() + timedelta(seconds=1)).timestamp() * 1000)
    auth_client.post("/api/v1/subscriptions/webhook",
                     json=_event(user_id, kind="EXPIRATION", event_timestamp_ms=ms),
                     headers=_headers())

    assert auth_client.get("/api/v1/users/me").json()["is_supporter"] is False


def test_a_refund_ends_it_too(auth_client, db_session):
    user_id = _user_id(db_session)
    auth_client.post("/api/v1/subscriptions/webhook", json=_event(user_id), headers=_headers())

    ms = int((now_utc() + timedelta(seconds=1)).timestamp() * 1000)
    auth_client.post("/api/v1/subscriptions/webhook",
                     json=_event(user_id, kind="REFUND", event_timestamp_ms=ms),
                     headers=_headers())

    body = auth_client.get("/api/v1/subscriptions/me").json()
    assert body["status"] == "refunded"
    assert auth_client.get("/api/v1/users/me").json()["is_supporter"] is False


def test_the_admin_grant_still_works(admin_client, db_session):
    """`review@multihead.de` is why this path cannot break: the store reviewers sign in with it,
    and a review that cannot see the paid feature fails with "we could not test it".

    Checked through the database rather than a second client, because `auth_client` and
    `admin_client` share one HTTP client and whichever is built last owns its token.
    """
    admin_client.post("/api/v1/auth/register", json={
        "email": "granted@example.com", "password": "password123",
        "name": "Granted", "locale": "en",
    })
    user_id = _user_id(db_session, "granted@example.com")

    resp = admin_client.put(f"/api/v1/admin/users/{user_id}/supporter", json={"is_supporter": True})

    assert resp.status_code == 200
    db_session.expire_all()
    assert db_session.get(User, user_id).is_supporter is True


# --------------------------------------------------------------------------------------------
# Where somebody buys it on the web (#479)
# --------------------------------------------------------------------------------------------

class TestWebCheckout:
    """The account id is a *path segment* of the purchase link, and a link without it answers 404
    rather than selling anonymously. Worse, a link with the *wrong* id takes real money and
    attaches it to nobody. These tests are about that one string."""

    def test_nothing_configured_says_not_yet_rather_than_failing(self, auth_client):
        """The normal state of a deployment whose store side is not set up, and of every test run
        before this class sets a token. A page must be able to say "not yet"."""
        resp = auth_client.get("/api/v1/subscriptions/web-checkout")

        assert resp.status_code == 503
        assert resp.json()["detail"]["code"] == "WEB_CHECKOUT_UNCONFIGURED"

    def test_the_link_carries_this_accounts_own_id_as_a_path_segment(
            self, auth_client, db_session, monkeypatch):
        from app.config import settings
        from app.models import User
        monkeypatch.setattr(settings, "revenuecat_web_purchase_token", "tok123")
        user = db_session.query(User).filter(User.email == "test@example.com").first()

        url = auth_client.get("/api/v1/subscriptions/web-checkout").json()["url"]

        assert url.startswith(f"https://pay.rev.cat/tok123/{user.id}"), url
        assert f"?email=" in url, "so nobody retypes their address at the till"

    def test_the_address_is_escaped_rather_than_pasted_in(self, client, monkeypatch):
        """A + in an address is a space once it is in a query string. Nobody would notice until a
        receipt went to the wrong mailbox."""
        from app.config import settings
        monkeypatch.setattr(settings, "revenuecat_web_purchase_token", "tok123")
        client.post("/api/v1/auth/register", json={
            "email": "bee+keeper@example.com", "password": "password123",
            "name": "Plus", "locale": "en"})
        token = client.post("/api/v1/auth/login", json={
            "email": "bee+keeper@example.com", "password": "password123"}).json()["access_token"]

        url = client.get("/api/v1/subscriptions/web-checkout",
                         headers={"Authorization": f"Bearer {token}"}).json()["url"]

        assert "bee%2Bkeeper%40example.com" in url
        assert "bee+keeper@" not in url

    def test_a_sandbox_token_wins_so_staging_cannot_take_real_money(self, auth_client, monkeypatch):
        from app.config import settings
        monkeypatch.setattr(settings, "revenuecat_web_purchase_token", "live-token")
        monkeypatch.setattr(settings, "revenuecat_web_purchase_token_sandbox", "sandbox-token")

        url = auth_client.get("/api/v1/subscriptions/web-checkout").json()["url"]

        assert "sandbox-token" in url
        assert "live-token" not in url

    def test_two_accounts_never_receive_the_same_link(self, client, monkeypatch):
        """The failure this guards is a payment credited to the wrong beekeeper."""
        from app.config import settings
        monkeypatch.setattr(settings, "revenuecat_web_purchase_token", "tok123")
        links = []
        for who in ("one", "two"):
            client.post("/api/v1/auth/register", json={
                "email": f"{who}@example.com", "password": "password123",
                "name": who, "locale": "en"})
            tok = client.post("/api/v1/auth/login", json={
                "email": f"{who}@example.com", "password": "password123"}).json()["access_token"]
            links.append(client.get("/api/v1/subscriptions/web-checkout",
                                    headers={"Authorization": f"Bearer {tok}"}).json()["url"])

        assert links[0] != links[1]

    def test_there_is_no_link_without_an_account(self, client, monkeypatch):
        """A purchase link only means anything attached to somebody, so an anonymous caller must
        not receive one at all.

        Asserted as "refused, and no url in the body" rather than as a particular status, because
        which status a *missing* Authorization header gets is #482's subject and not this test's.
        Pinning 401 or 422 here would make this test fail for a reason that has nothing to do with
        buying anything.
        """
        from app.config import settings
        monkeypatch.setattr(settings, "revenuecat_web_purchase_token", "tok123")

        resp = client.get("/api/v1/subscriptions/web-checkout")

        assert resp.status_code >= 400
        assert "url" not in resp.json()

    def test_the_message_is_translated(self, auth_client):
        resp = auth_client.get("/api/v1/subscriptions/web-checkout",
                               headers={"Accept-Language": "de"})

        assert "noch nicht gekauft werden" in resp.json()["detail"]["message"]
