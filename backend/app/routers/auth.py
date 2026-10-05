import logging
import secrets
import uuid as _uuid_mod
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import settings
from app.notifications_i18n import reset_email
from app.database import get_db
from app.i18n import error
from app.models import PasswordResetToken, RefreshToken, User
from app.rate_limit import enforce_rate_limit
from app.schemas import (
    AccessTokenResponse, LoginRequest, LogoutRequest,
    RefreshRequest, RegisterRequest, TokenResponse, UserOut,
    CISetupRequest, ForgotPasswordRequest, ResetPasswordRequest, SocialSignInRequest,
)
from app.utils import social_identity

# A bcrypt hash of an unguessable placeholder — used to run a real bcrypt
# verify (and burn the same ~100ms) even when the email doesn't exist, so
# login response time doesn't leak whether an account exists.
_DUMMY_HASH = "$2b$12$MUdXmdk69VXMdltexQ6BkOzhVJLR7fNF3kiSFfI8j7dmNlBJe/R8."

router = APIRouter(prefix="/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
ALGORITHM = "HS256"
logger = logging.getLogger(__name__)
RESET_TOKEN_TTL_MINUTES = 15


def _hash(password: str) -> str:
    return pwd_context.hash(password)


def _verify(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def _make_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    return jwt.encode({"sub": user_id, "type": "access", "exp": expire}, settings.secret_key, algorithm=ALGORITHM)


def _make_refresh_token(user_id: str, db: Session) -> str:
    import uuid
    token_str = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    rt = RefreshToken(user_id=user_id, token=token_str, expires_at=expires_at)
    db.add(rt)
    db.commit()
    return token_str


def _lang(accept_language: Optional[str]) -> Optional[str]:
    return accept_language


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(
    body: RegisterRequest,
    request: Request,
    db: Session = Depends(get_db),
    accept_language: Optional[str] = Header(default=None),
):
    enforce_rate_limit(db, request, "register", limit=10, window_minutes=60)
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(409, detail=error("EMAIL_ALREADY_REGISTERED", accept_language))
    user = User(
        email=body.email,
        hashed_password=_hash(body.password),
        name=body.name,
        locale=body.locale,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return TokenResponse(
        access_token=_make_access_token(user.id),
        refresh_token=_make_refresh_token(user.id, db),
        user=UserOut.model_validate(user),
    )


@router.get("/providers")
def sign_in_providers():
    """Which providers this server can verify tokens for, and under which client ID.

    Public on purpose, and the single source of truth: nothing else has to carry a copy of
    the client ID, so the two can never drift apart. A provider the server cannot verify is
    null, the client hides its button, and no button can offer a sign-in that would be
    refused on arrival.

    Client IDs are public by design — Google's appears in the markup of every page showing
    its button. The client secret takes no part in this flow.
    """
    def first(raw: str) -> Optional[str]:
        ids = [value.strip() for value in raw.split(",") if value.strip()]
        return ids[0] if ids else None

    return {
        "google": ({"client_id": first(settings.google_client_ids)}
                   if first(settings.google_client_ids) else None),
        "apple": ({"client_id": first(settings.apple_client_ids)}
                  if first(settings.apple_client_ids) else None),
    }


@router.post("/social", response_model=TokenResponse)
def social_sign_in(
    body: SocialSignInRequest,
    request: Request,
    db: Session = Depends(get_db),
    accept_language: Optional[str] = Header(default=None),
):
    """Sign in with an Apple or Google identity token, creating the account on first use."""
    enforce_rate_limit(db, request, "social_sign_in", limit=10, window_minutes=5)

    try:
        identity = social_identity.verify(body.provider, body.id_token)
    except social_identity.ProviderUnconfigured:
        raise HTTPException(503, detail=error("SOCIAL_SIGN_IN_UNCONFIGURED", accept_language))
    except social_identity.IdentityError as failure:
        # The reason belongs in the log, not in the response: it would tell an attacker which
        # part of a forged token to fix next.
        logger.info("Rejected %s identity token: %s", body.provider, failure)
        raise HTTPException(401, detail=error("INVALID_IDENTITY_TOKEN", accept_language))

    column = User.apple_sub if identity.provider == "apple" else User.google_sub
    user = db.query(User).filter(column == identity.subject).first()

    if user is None and identity.email:
        # A known address may claim its account, but only when the provider vouches for it.
        # Without that check, anybody able to register an unverified address at either
        # provider could walk into a stranger's hives.
        if not identity.email_verified:
            raise HTTPException(401, detail=error("EMAIL_NOT_VERIFIED", accept_language))
        user = db.query(User).filter(User.email == identity.email).first()
        if user is not None:
            setattr(user, f"{identity.provider}_sub", identity.subject)

    if user is None:
        if not identity.email:
            raise HTTPException(401, detail=error("EMAIL_NOT_VERIFIED", accept_language))
        user = User(
            email=identity.email,
            hashed_password=None,  # there is no password to this account, and never was
            name=body.name or identity.name or identity.email.split("@")[0],
            locale=body.locale,
            **{f"{identity.provider}_sub": identity.subject},
        )
        db.add(user)

    db.commit()
    db.refresh(user)
    return TokenResponse(
        access_token=_make_access_token(user.id),
        refresh_token=_make_refresh_token(user.id, db),
        user=UserOut.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
def login(
    body: LoginRequest,
    request: Request,
    db: Session = Depends(get_db),
    accept_language: Optional[str] = Header(default=None),
):
    enforce_rate_limit(db, request, "login", limit=10, window_minutes=5)
    user = db.query(User).filter(User.email == body.email).first()
    # Always run a real bcrypt verify, even for an unknown email, so response
    # timing doesn't reveal whether the address is registered.
    # An account created through Apple or Google has no password. Falling through to the
    # dummy hash keeps the timing constant and, more importantly, turns what would be a
    # crash on None into the plain refusal the caller deserves.
    stored = user.hashed_password if user and user.hashed_password else _DUMMY_HASH
    password_ok = _verify(body.password, stored)
    if not user or not password_ok:
        raise HTTPException(401, detail=error("INVALID_CREDENTIALS", accept_language))
    return TokenResponse(
        access_token=_make_access_token(user.id),
        refresh_token=_make_refresh_token(user.id, db),
        user=UserOut.model_validate(user),
    )


@router.post("/refresh", response_model=AccessTokenResponse)
def refresh(
    body: RefreshRequest,
    db: Session = Depends(get_db),
    accept_language: Optional[str] = Header(default=None),
):
    rt = db.query(RefreshToken).filter(RefreshToken.token == body.refresh_token).first()
    if not rt or rt.revoked or rt.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(401, detail=error("TOKEN_INVALID", accept_language))
    return AccessTokenResponse(access_token=_make_access_token(rt.user_id))


@router.post("/ci-setup", status_code=204, include_in_schema=False)
def ci_setup(
    body: CISetupRequest,
    db: Session = Depends(get_db),
):
    """Create or update an admin user for CI testing. Requires CI_SETUP_TOKEN env var.

    Disabled entirely in production — this exists solely so CI can provision
    a demo/admin account on staging; a 404 (not 403) avoids even confirming
    the route exists.
    """
    if settings.environment == "production":
        raise HTTPException(status_code=404)
    if not settings.ci_setup_token or not secrets.compare_digest(body.token, settings.ci_setup_token):
        raise HTTPException(status_code=403, detail="Forbidden")
    user = db.query(User).filter(User.email == body.email).first()
    if user:
        user.hashed_password = _hash(body.password)
        user.is_admin = True
    else:
        user = User(
            email=body.email,
            hashed_password=_hash(body.password),
            name=body.name or "CI Admin",
            is_admin=True,
        )
        db.add(user)
    db.commit()


@router.post("/logout", status_code=204)
def logout(
    body: LogoutRequest,
    db: Session = Depends(get_db),
):
    rt = db.query(RefreshToken).filter(RefreshToken.token == body.refresh_token).first()
    if rt:
        rt.revoked = True
        db.commit()


def _send_reset_email(to_email: str, reset_url: str, locale: Optional[str] = None) -> None:
    """Send password-reset email via Resend. Logs URL when API key is not configured."""
    if not settings.resend_api_key:
        logger.warning("RESEND_API_KEY not configured — password reset URL: %s", reset_url)
        return
    import httpx

    subject, html = reset_email(reset_url, RESET_TOKEN_TTL_MINUTES, locale, account=to_email)
    try:
        resp = httpx.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {settings.resend_api_key}"},
            json={
                "from": "HivePulse <noreply@multihead.de>",
                "to": [to_email],
                "subject": subject,
                "html": html,
            },
            timeout=10,
        )
        if resp.status_code >= 400:
            logger.error("Resend API error %s: %s", resp.status_code, resp.text)
        else:
            logger.info("Password reset email sent to %s (id=%s)", to_email, resp.json().get("id"))
    except Exception as exc:
        logger.error("Failed to send reset email: %s", exc)


@router.post("/forgot-password", status_code=204)
def forgot_password(body: ForgotPasswordRequest, request: Request, db: Session = Depends(get_db)):
    """Always returns 204 — never reveals whether the email is registered."""
    enforce_rate_limit(db, request, "forgot_password", limit=5, window_minutes=60)
    # The limit above counts per client IP, which does nothing against somebody aiming at one
    # mailbox from a fresh address each time. Three of these landed in one inbox in a single
    # night. The cost is that a stranger can keep a real user waiting an hour for their reset
    # link; a mailbox nobody can empty is the worse of the two.
    enforce_rate_limit(db, request, "forgot_password_address", limit=5, window_minutes=60,
                       identity=body.email.strip().lower())
    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        return  # silent — no user enumeration

    token_str = str(_uuid_mod.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=RESET_TOKEN_TTL_MINUTES)
    prt = PasswordResetToken(user_id=user.id, token=token_str, expires_at=expires_at)
    db.add(prt)
    db.commit()

    reset_url = f"{settings.app_base_url}/dashboard/reset-password?token={token_str}"
    _send_reset_email(user.email, reset_url, user.locale)


@router.post("/reset-password", status_code=204)
def reset_password(
    body: ResetPasswordRequest,
    db: Session = Depends(get_db),
    accept_language: Optional[str] = Header(default=None),
):
    prt = db.query(PasswordResetToken).filter(PasswordResetToken.token == body.token).first()
    now = datetime.now(timezone.utc)
    if (
        not prt
        or prt.used_at is not None
        or prt.expires_at.replace(tzinfo=timezone.utc) < now
    ):
        raise HTTPException(400, detail=error("RESET_TOKEN_INVALID", accept_language))

    user = db.query(User).filter(User.id == prt.user_id).first()
    user.hashed_password = _hash(body.new_password)
    prt.used_at = now
    db.add(user)
    db.flush()

    db.query(RefreshToken).filter(RefreshToken.user_id == user.id).update({"revoked": True})
    db.commit()
