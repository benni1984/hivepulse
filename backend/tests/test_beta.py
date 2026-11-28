"""The signup form on /beta (#568).

Everything here mocks `send_email`: the endpoint's whole job is to turn a body into one mail,
so what the mail says and whether a failure is noticed are the things worth pinning.
"""
from unittest.mock import patch

import pytest

URL = "/api/v1/beta/signup"
BODY = {"email": "tester@gmail.com", "platform": "android"}


@pytest.fixture
def sent():
    """Patch the sender and hand the test the calls it received."""
    with patch("app.routers.beta.send_email", return_value=True) as mock:
        yield mock


def test_signup_sends_one_mail(client, sent):
    r = client.post(URL, json=BODY)
    assert r.status_code == 200, r.text
    assert r.json() == {"received": True}
    assert sent.call_count == 1

    to_email, subject, body = sent.call_args.args
    assert to_email == "hivepulse@multihead.de"
    assert "tester@gmail.com" in subject
    assert "tester@gmail.com" in body


def test_signup_stores_nothing(client, sent, db_session):
    """No table gained a row. The absence is the feature, so it is tested, not assumed."""
    from app.models import RateLimitHit

    before = {
        table.name: db_session.execute(table.select()).fetchall()
        for table in RateLimitHit.metadata.sorted_tables
        if table.name != "rate_limit_hits"  # the limiter writes one by design
    }
    client.post(URL, json=BODY)
    after = {
        table.name: db_session.execute(table.select()).fetchall()
        for table in RateLimitHit.metadata.sorted_tables
        if table.name != "rate_limit_hits"
    }
    assert before == after


def test_optional_fields_reach_the_mail(client, sent):
    client.post(URL, json={**BODY, "name": "Camille", "device": "Pixel 7a", "note": "12 ruches"})
    body = sent.call_args.args[2]
    assert "Camille" in body and "Pixel 7a" in body and "12 ruches" in body


def test_blank_optional_fields_are_dropped(client, sent):
    """A field of spaces is an empty field, not a blank line in somebody's mailbox."""
    client.post(URL, json={**BODY, "name": "   ", "note": ""})
    body = sent.call_args.args[2]
    assert "Name" not in body
    assert "Note" not in body


def test_the_platform_is_named_in_words(client, sent):
    client.post(URL, json={"email": "t@example.com", "platform": "ios"})
    assert "TestFlight" in sent.call_args.args[1]


def test_user_text_is_escaped(client, sent):
    """The note goes into HTML and comes from anybody at all."""
    client.post(URL, json={**BODY, "note": "<script>alert(1)</script>"})
    body = sent.call_args.args[2]
    assert "<script>" not in body
    assert "&lt;script&gt;" in body


@pytest.mark.parametrize("payload", [
    {"email": "not-an-address", "platform": "android"},
    {"email": "t@example.com", "platform": "windows-phone"},
    {"email": "t@example.com"},
    {"platform": "android"},
    {"email": "t@example.com", "platform": "android", "name": "x" * 81},
    {"email": "t@example.com", "platform": "android", "note": "x" * 501},
])
def test_bad_bodies_are_refused(client, sent, payload):
    assert client.post(URL, json=payload).status_code == 422
    sent.assert_not_called()


def test_a_failed_send_is_a_503_and_not_a_cheerful_lie(client):
    """Nothing is stored, so the mail is the request. Answering 200 would lose a tester."""
    with patch("app.routers.beta.send_email", return_value=False):
        r = client.post(URL, json=BODY)
    assert r.status_code == 503
    assert r.json()["detail"]["code"] == "BETA_SIGNUP_FAILED"


def test_the_failure_speaks_the_caller_s_language(client):
    with patch("app.routers.beta.send_email", return_value=False):
        r = client.post(URL, json=BODY, headers={"Accept-Language": "fr"})
    assert "n’a pas pu" in r.json()["detail"]["message"]


def test_rate_limited_per_client(client, sent):
    from app.routers.beta import SIGNUPS_PER_HOUR

    for _ in range(SIGNUPS_PER_HOUR):
        assert client.post(URL, json=BODY).status_code == 200
    r = client.post(URL, json=BODY)
    assert r.status_code == 429
    assert sent.call_count == SIGNUPS_PER_HOUR


def test_the_mailbox_is_capped_across_everybody(client, sent):
    """The per-client cap does nothing against many addresses aiming at one mailbox."""
    from app.routers.beta import SIGNUPS_PER_HOUR_TOTAL

    accepted = 0
    for i in range(SIGNUPS_PER_HOUR_TOTAL + 5):
        r = client.post(URL, json=BODY, headers={"X-Forwarded-For": f"10.0.0.{i}"})
        if r.status_code == 200:
            accepted += 1
    assert accepted == SIGNUPS_PER_HOUR_TOTAL
