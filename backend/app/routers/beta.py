"""Getting onto a store test, without a mailbox of one's own.

Google admits only accounts that were put on the tester list beforehand; everybody else opens
the opt-in link and is told the app is not available. So the address has to reach a human
before the link can do anything, and until now `/beta` asked for that with a `mailto:` --
which, from a post on a phone, is Facebook, then a browser, then a mail app, and nothing at
all for somebody with no mail account set up on the device (#568).

**This endpoint stores nothing.** It builds one e-mail from the body, sends it, and forgets
the request. That is deliberate and worth keeping: there is no row to export when somebody
asks what is held about them, none to delete when they ask for it gone, and no paragraph to
add to the privacy policy. The mail is the record, in the mailbox of the person who will act
on it.
"""
import html
import logging

from fastapi import APIRouter, Header, Request, HTTPException, status
from typing import Optional

from app.config import settings
from app.deps import DB
from app.i18n import error
from app.rate_limit import enforce_rate_limit
from app.schemas import BetaSignupIn, BetaSignupOut
from app.utils.mail import send_email

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/beta", tags=["beta"])

#: Per client. Three is room to mistype an address twice and still get it right, and no use to
#: anybody who wants to fill a mailbox.
SIGNUPS_PER_HOUR = 3

#: Across everybody, counted on a fixed key rather than the caller's IP. The per-client cap
#: above does nothing against a caller with many addresses, and the thing being protected here
#: is one mailbox, not one visitor's fair share. Forty an hour is far more than a recruiting
#: page for twelve testers will ever see honestly.
SIGNUPS_PER_HOUR_TOTAL = 40
_GLOBAL_BUCKET_IDENTITY = "all"

PLATFORM_NAMES = {"android": "Android (Google Play)", "ios": "iPhone (TestFlight)"}


def _render(signup: BetaSignupIn) -> str:
    """The mail. Every value is escaped: it is attacker-supplied text going into HTML."""
    rows = [("Store account", signup.email), ("Test", PLATFORM_NAMES[signup.platform])]
    if signup.name:
        rows.append(("Name", signup.name))
    if signup.device:
        rows.append(("Device", signup.device))
    if signup.note:
        rows.append(("Note", signup.note))

    cells = "".join(
        f"<tr><td style='padding:4px 12px 4px 0;vertical-align:top;color:#57534e'>{html.escape(label)}</td>"
        f"<td style='padding:4px 0;vertical-align:top'><strong>{html.escape(str(value))}</strong></td></tr>"
        for label, value in rows
    )
    return (
        "<p>Somebody asked to join a store test through the website.</p>"
        f"<table style='border-collapse:collapse;font-family:sans-serif'>{cells}</table>"
        "<p style='color:#57534e'>Add the address in the store console, then tell them the "
        "opt-in link works. Nothing about this request is stored anywhere else.</p>"
    )


@router.post("/signup", response_model=BetaSignupOut)
def beta_signup(
    signup: BetaSignupIn,
    request: Request,
    db: DB,
    accept_language: Optional[str] = Header(default=None),
):
    enforce_rate_limit(db, request, "beta-signup", SIGNUPS_PER_HOUR, 60)
    enforce_rate_limit(
        db, request, "beta-signup-all", SIGNUPS_PER_HOUR_TOTAL, 60,
        identity=_GLOBAL_BUCKET_IDENTITY,
    )

    subject = f"Beta signup ({PLATFORM_NAMES[signup.platform]}): {signup.email}"
    if not send_email(settings.beta_signup_email, subject, _render(signup)):
        # The one place `send_email` returning False must not be swallowed. Everywhere else the
        # thing the caller asked for is already in the database and a lost mail is a nuisance;
        # here the mail is the entire request, and a cheerful answer that reached nobody costs
        # the tester this page exists to find.
        logger.error("Beta signup from %s could not be delivered", signup.email)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=error("BETA_SIGNUP_FAILED", accept_language),
        )

    return BetaSignupOut()
