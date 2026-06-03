import logging
import uuid as _uuid_mod
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.i18n import error
from app.models import PasswordResetToken, RefreshToken, User
from app.schemas import (
    AccessTokenResponse, LoginRequest, LogoutRequest,
    RefreshRequest, RegisterRequest, TokenResponse, UserOut,
    CISetupRequest, ForgotPasswordRequest, ResetPasswordRequest,
)

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
    db: Session = Depends(get_db),
    accept_language: Optional[str] = Header(default=None),
):
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


@router.post("/login", response_model=TokenResponse)
def login(
    body: LoginRequest,
    db: Session = Depends(get_db),
    accept_language: Optional[str] = Header(default=None),
):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not _verify(body.password, user.hashed_password):
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
    """Create or update an admin user for CI testing. Requires CI_SETUP_TOKEN env var."""
    if not settings.ci_setup_token or body.token != settings.ci_setup_token:
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


def _send_reset_email(to_email: str, reset_url: str) -> None:
    """Send password-reset email via Resend. Logs URL when API key is not configured."""
    if not settings.resend_api_key:
        logger.warning("RESEND_API_KEY not configured — password reset URL: %s", reset_url)
        return
    import httpx
    try:
        httpx.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {settings.resend_api_key}"},
            json={
                "from": "HivePulse <noreply@hivepulse.app>",
                "to": [to_email],
                "subject": "Reset your HivePulse password",
                "html": (
                    f"<p>Click the link below to reset your password. "
                    f"It expires in {RESET_TOKEN_TTL_MINUTES} minutes.</p>"
                    f"<p><a href='{reset_url}'>{reset_url}</a></p>"
                    f"<p>If you did not request this, you can safely ignore this email.</p>"
                ),
            },
            timeout=10,
        )
    except Exception as exc:
        logger.error("Failed to send reset email: %s", exc)


@router.post("/forgot-password", status_code=204)
def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Always returns 204 — never reveals whether the email is registered."""
    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        return  # silent — no user enumeration

    token_str = str(_uuid_mod.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=RESET_TOKEN_TTL_MINUTES)
    prt = PasswordResetToken(user_id=user.id, token=token_str, expires_at=expires_at)
    db.add(prt)
    db.commit()

    reset_url = f"{settings.app_base_url}/dashboard/reset-password?token={token_str}"
    _send_reset_email(user.email, reset_url)


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

    user = prt.user
    user.hashed_password = _hash(body.new_password)
    prt.used_at = now

    # Revoke all existing refresh tokens so old sessions can't be reused
    db.query(RefreshToken).filter(RefreshToken.user_id == user.id).update({"revoked": True})
    db.commit()
