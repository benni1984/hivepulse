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
    """A refund arrives as a CANCELLATION with a reason. There is no REFUND event type.

    This test used to send `kind="REFUND"` and pass, which proved only that the table mapped a
    string nobody will ever send. The real event is a cancellation, and without the reason it
    reads as "keeps the feature until the period ends" -- so somebody could be refunded and stay
    a supporter (#496).
    """
    user_id = _user_id(db_session)
    auth_client.post("/api/v1/subscriptions/webhook", json=_event(user_id), headers=_headers())

    ms = int((now_utc() + timedelta(seconds=1)).timestamp() * 1000)
    auth_client.post("/api/v1/subscriptions/webhook",
                     json=_event(user_id, kind="CANCELLATION", event_timestamp_ms=ms,
                                 cancel_reason="CUSTOMER_SUPPORT"),
                     headers=_headers())

    body = auth_client.get("/api/v1/subscriptions/me").json()
    assert body["status"] == "refunded"
    assert auth_client.get("/api/v1/users/me").json()["is_supporter"] is False


def test_an_ordinary_cancellation_is_not_a_refund(auth_client, db_session):
    """The other half of the same decision, and the reason the reason matters. Switching off
    auto-renewal must leave the feature in place until the period that was paid for ends."""
    user_id = _user_id(db_session)
    auth_client.post("/api/v1/subscriptions/webhook", json=_event(user_id), headers=_headers())

    ms = int((now_utc() + timedelta(seconds=1)).timestamp() * 1000)
    auth_client.post("/api/v1/subscriptions/webhook",
                     json=_event(user_id, kind="CANCELLATION", event_timestamp_ms=ms,
                                 cancel_reason="UNSUBSCRIBE"),
                     headers=_headers())

    body = auth_client.get("/api/v1/subscriptions/me").json()
    assert body["status"] == "active", "cancelled is not expired"
    assert body["will_renew"] is False, "but it will not come back by itself"
    assert auth_client.get("/api/v1/users/me").json()["is_supporter"] is True


def test_a_reversed_refund_gives_the_access_back(auth_client, db_session):
    """REFUND_REVERSED exists and used to fall into "unknown event, ignore" -- so the money came
    back to us and the person stayed locked out."""
    user_id = _user_id(db_session)
    auth_client.post("/api/v1/subscriptions/webhook", json=_event(user_id), headers=_headers())
    ms = int((now_utc() + timedelta(seconds=1)).timestamp() * 1000)
    auth_client.post("/api/v1/subscriptions/webhook",
                     json=_event(user_id, kind="CANCELLATION", event_timestamp_ms=ms,
                                 cancel_reason="CUSTOMER_SUPPORT"),
                     headers=_headers())

    ms2 = int((now_utc() + timedelta(seconds=2)).timestamp() * 1000)
    auth_client.post("/api/v1/subscriptions/webhook",
                     json=_event(user_id, kind="REFUND_REVERSED", event_timestamp_ms=ms2),
                     headers=_headers())

    assert auth_client.get("/api/v1/users/me").json()["is_supporter"] is True


def test_the_dashboards_own_test_button_is_ignored_quietly(auth_client, db_session):
    """RevenueCat's "send test webhook" sends type TEST from store TEST_STORE. Answering 200 and
    doing nothing is right; the point of this test is that it is *named* as ignored rather than
    logged as an unknown type, because during setup that reads as a misconfiguration."""
    user_id = _user_id(db_session)

    resp = auth_client.post("/api/v1/subscriptions/webhook",
                            json=_event(user_id, kind="TEST", store="TEST_STORE"),
                            headers=_headers())

    assert resp.status_code == 200
    assert resp.json()["handled"] is False
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

    @pytest.fixture(autouse=True)
    def selling_is_switched_on(self, monkeypatch):
        """Everything in this class is about *what* the link looks like once selling is allowed.

        Whether it is allowed at all is `web_checkout_enabled`, which is off by default so that a
        deploy cannot start selling by itself (#530) -- that switch has its own class below."""
        from app.config import settings
        monkeypatch.setattr(settings, "web_checkout_enabled", True)

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


class TestSellingIsSwitchedOffUntilSomebodySaysOtherwise:
    """The switch exists because selling used to turn itself on (#530).

    A token in the environment was enough to put a buy button in front of people, so the next
    deploy -- about anything at all -- would start selling. Paddle approves a checkout domain on
    its own schedule, and a checkout opened before that approval fails in the customer's face
    with "Something went wrong."

    Note what these tests do *not* set: `web_checkout_enabled`. The default is the behaviour
    under test.
    """

    def test_a_configured_token_alone_does_not_start_selling(self, auth_client, monkeypatch):
        from app.config import settings
        monkeypatch.setattr(settings, "revenuecat_web_purchase_token", "tok123")

        resp = auth_client.get("/api/v1/subscriptions/web-checkout")

        assert resp.status_code == 503
        assert resp.json()["detail"]["code"] == "WEB_CHECKOUT_UNCONFIGURED"
        assert "url" not in resp.json()

    def test_the_sandbox_token_does_not_either(self, auth_client, monkeypatch):
        from app.config import settings
        monkeypatch.setattr(settings, "revenuecat_web_purchase_token_sandbox", "sand123")

        resp = auth_client.get("/api/v1/subscriptions/web-checkout")

        assert resp.status_code == 503

    def test_it_answers_exactly_as_an_unconfigured_deployment_does(self, auth_client, monkeypatch):
        """Deliberately the same code, so the page already says "cannot be bought here yet" in
        five languages, Sentry already ignores it (#497) and the E2E suite already expects it.
        A new code would have meant new text, new noise and a new expectation."""
        from app.config import settings
        monkeypatch.setattr(settings, "revenuecat_web_purchase_token", "tok123")

        switched_off = auth_client.get("/api/v1/subscriptions/web-checkout")
        monkeypatch.setattr(settings, "revenuecat_web_purchase_token", "")
        unconfigured = auth_client.get("/api/v1/subscriptions/web-checkout")

        assert switched_off.status_code == unconfigured.status_code
        assert switched_off.json() == unconfigured.json()

    def test_switching_it_on_sells(self, auth_client, monkeypatch):
        from app.config import settings
        monkeypatch.setattr(settings, "revenuecat_web_purchase_token", "tok123")
        monkeypatch.setattr(settings, "web_checkout_enabled", True)

        resp = auth_client.get("/api/v1/subscriptions/web-checkout")

        assert resp.status_code == 200
        assert resp.json()["url"].startswith("https://pay.rev.cat/tok123/")

    def test_switching_it_on_without_a_token_still_refuses(self, auth_client, monkeypatch):
        """The two conditions are separate; neither excuses the other."""
        from app.config import settings
        monkeypatch.setattr(settings, "web_checkout_enabled", True)
        monkeypatch.setattr(settings, "revenuecat_web_purchase_token", "")
        monkeypatch.setattr(settings, "revenuecat_web_purchase_token_sandbox", "")

        resp = auth_client.get("/api/v1/subscriptions/web-checkout")

        assert resp.status_code == 503

    def test_an_existing_subscriber_is_unaffected(self, auth_client, db_session, monkeypatch):
        """Only *selling* is gated. Somebody who already bought must keep their access, and the
        webhook must keep arriving -- otherwise a kill switch for new purchases would also be a
        kill switch for the people who already paid."""
        from app.config import settings
        from app.models import User
        from app.utils import entitlements
        monkeypatch.setattr(settings, "web_checkout_enabled", False)
        user = db_session.query(User).filter(User.email == "test@example.com").first()
        entitlements.apply_event(db_session, user=user, source="web", status="active",
                                 current_period_end=None, store_txn_id="txn-530")
        db_session.commit()

        me = auth_client.get("/api/v1/subscriptions/me")

        assert me.status_code == 200
        assert me.json()["status"] == "active"


class TestAdminGrantSurvivesTheSweep:
    """What `PUT /admin/users/{id}/supporter` is for, and the day it used to last (#17).

    The daily sweep walks every account whose cached flag says supporter and recomputes it from
    the subscription records. An admin grant that only poked the flag therefore lasted until the
    next cron run and then vanished — silently, because nothing logs a flag going false.

    The account this would have cost most is `review@multihead.de`: it is how the store reviewers
    sign in, it exists only because somebody made it by hand, and "we could not sign in" is a
    whole rejected review round.
    """

    def _admin_and_victim(self, client, db_session):
        from app.models import User
        client.post("/api/v1/auth/register", json={
            "email": "boss@example.com", "password": "password123",
            "name": "Boss", "locale": "en"})
        client.post("/api/v1/auth/register", json={
            "email": "reviewer@example.com", "password": "password123",
            "name": "Reviewer", "locale": "en"})
        boss = db_session.query(User).filter(User.email == "boss@example.com").first()
        boss.is_admin = True
        db_session.commit()
        token = client.post("/api/v1/auth/login", json={
            "email": "boss@example.com", "password": "password123"}).json()["access_token"]
        victim = db_session.query(User).filter(User.email == "reviewer@example.com").first()
        return {"Authorization": f"Bearer {token}"}, victim

    def test_an_admin_grant_is_still_there_after_the_daily_sweep(self, client, db_session):
        from app.utils import entitlements
        headers, victim = self._admin_and_victim(client, db_session)

        resp = client.put(f"/api/v1/admin/users/{victim.id}/supporter",
                          json={"is_supporter": True}, headers=headers)
        assert resp.status_code == 200 and resp.json()["is_supporter"] is True

        # The admin wrote through the request's own session. Without this, the test session
        # hands the sweep its own stale copy of the row -- still showing the old flag -- and the
        # sweep finds nothing to change, which looks exactly like the bug being absent.
        db_session.expire_all()
        entitlements.sweep_expired(db_session)
        db_session.commit()
        db_session.refresh(victim)

        assert victim.is_supporter is True, "the sweep must not undo what an admin granted"

    def test_the_grant_is_a_record_and_not_only_a_flag(self, client, db_session):
        from app.models import Subscription
        headers, victim = self._admin_and_victim(client, db_session)

        client.put(f"/api/v1/admin/users/{victim.id}/supporter",
                   json={"is_supporter": True}, headers=headers)

        rows = db_session.query(Subscription).filter(Subscription.user_id == victim.id).all()
        assert [r.source for r in rows] == ["manual"]
        assert rows[0].current_period_end is None, "a manual grant does not expire"

    def test_taking_it_away_again_still_works(self, client, db_session):
        from app.utils import entitlements
        headers, victim = self._admin_and_victim(client, db_session)
        client.put(f"/api/v1/admin/users/{victim.id}/supporter",
                   json={"is_supporter": True}, headers=headers)

        client.put(f"/api/v1/admin/users/{victim.id}/supporter",
                   json={"is_supporter": False}, headers=headers)
        db_session.expire_all()
        entitlements.sweep_expired(db_session)
        db_session.commit()
        db_session.refresh(victim)

        assert victim.is_supporter is False

    def test_a_store_subscription_is_not_clobbered_by_an_admin_grant(self, client, db_session):
        """Granting by hand must add a manual record beside a real one, never overwrite it:
        somebody who is actually paying keeps their renewal date."""
        from app.models import Subscription
        from app.utils import entitlements
        from app.clock import now_utc
        from datetime import timedelta
        headers, victim = self._admin_and_victim(client, db_session)
        entitlements.apply_event(db_session, user=victim, source="apple", status="active",
                                 product_id="supporter_yearly",
                                 current_period_end=now_utc() + timedelta(days=200),
                                 store_txn_id="apple-1")
        db_session.commit()

        client.put(f"/api/v1/admin/users/{victim.id}/supporter",
                   json={"is_supporter": True}, headers=headers)

        sources = sorted(r.source for r in
                         db_session.query(Subscription).filter(Subscription.user_id == victim.id))
        assert sources == ["apple", "manual"]


class TestDeletingAnAccountThatPays:
    """What happens to a subscription when somebody deletes their account (#17, phase 5).

    Two different questions, and only one of them is ours to answer. Deleting the *records* is:
    they are the account's data and they go with it. Cancelling the *subscription* is not -- a
    store subscription belongs to the person's Apple or Google account and this server cannot
    touch it, so somebody who deletes an account without cancelling first keeps being charged for
    something they can no longer reach.
    """

    def _paying_user(self, client, db_session, source="apple"):
        from app.models import User
        from app.utils import entitlements
        from app.clock import now_utc
        from datetime import timedelta
        client.post("/api/v1/auth/register", json={
            "email": "payer@example.com", "password": "password123",
            "name": "Payer", "locale": "en"})
        user = db_session.query(User).filter(User.email == "payer@example.com").first()
        entitlements.apply_event(db_session, user=user, source=source, status="active",
                                 product_id="supporter_yearly",
                                 current_period_end=now_utc() + timedelta(days=100),
                                 store_txn_id=f"{source}-1")
        db_session.commit()
        token = client.post("/api/v1/auth/login", json={
            "email": "payer@example.com", "password": "password123"}).json()["access_token"]
        return user.id, {"Authorization": f"Bearer {token}"}

    def test_the_account_can_still_be_deleted(self, client, db_session):
        """The first thing to know: a subscription must not block somebody from leaving. A
        foreign key that refused the delete would trap a paying account in the product."""
        user_id, headers = self._paying_user(client, db_session)

        resp = client.delete("/api/v1/users/me", headers=headers)

        assert resp.status_code in (200, 204), resp.text

    def test_the_records_go_with_it(self, client, db_session):
        from app.models import Subscription
        user_id, headers = self._paying_user(client, db_session)

        client.delete("/api/v1/users/me", headers=headers)

        db_session.expire_all()
        assert db_session.query(Subscription).filter(Subscription.user_id == user_id).count() == 0

    def test_nothing_of_the_account_is_left_behind_anywhere(self, client, db_session):
        """A generic sweep, because the bug this class exists for was a *new table* nobody
        remembered.

        `Subscription` carried `ondelete="CASCADE"` on the column and still broke the delete:
        the ORM relationship had no cascade, so SQLAlchemy tried `UPDATE subscriptions SET
        user_id = NULL` first and the NOT NULL constraint refused it. A paying account could not
        be deleted at all.

        Rather than listing the tables that existed on the day this was written, the check walks
        every table that has a `user_id` column and asserts that none of them still points at the
        account. A table added later is covered the moment somebody stores a row in it.
        """
        from sqlalchemy import text
        from app.models import Base
        user_id, headers = self._paying_user(client, db_session)
        apiary = client.post("/api/v1/apiaries", json={"name": "Leaving", "address": "X"},
                             headers=headers).json()
        hive = client.post(f"/api/v1/apiaries/{apiary['id']}/hives",
                           json={"name": "Volk", "hive_type": "langstroth"},
                           headers=headers).json()
        client.post(f"/api/v1/hives/{hive['id']}/inspections",
                    json={"date": "2026-05-01", "mood": "calm"}, headers=headers)
        client.post("/api/v1/field-definitions",
                    json={"target": "inspection", "name": "Feld", "type": "text",
                          "options": [], "required": False, "sort_order": 0}, headers=headers)
        client.post("/api/v1/treatments",
                    json={"apiary_id": apiary["id"], "product": "Ameisensäure",
                          "due_on": "2026-08-20"}, headers=headers)

        assert client.delete("/api/v1/users/me", headers=headers).status_code in (200, 204)

        db_session.expire_all()
        leftovers = []
        for table in Base.metadata.sorted_tables:
            if "user_id" not in table.c:
                continue
            count = db_session.execute(
                text(f"SELECT COUNT(*) FROM {table.name} WHERE user_id = :uid"),
                {"uid": user_id},
            ).scalar()
            if count:
                leftovers.append(f"{table.name}: {count}")
        assert not leftovers, "rows still pointing at the deleted account: " + ", ".join(leftovers)
