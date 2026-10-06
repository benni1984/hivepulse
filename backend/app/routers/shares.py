"""Inviting another beekeeper to work on an apiary or a hive. See "Sharing" in the API contract."""
import hashlib
import logging
import secrets
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Header, HTTPException, Query, Request
from sqlalchemy import func

from app.access import apiary_or_404, hive_or_404
from app.config import settings
from app.deps import CurrentUser, DB
from app.i18n import error
from app.models import Share, User
from app.notifications_i18n import invitation_email
from app.rate_limit import enforce_rate_limit
from app.schemas import (
    IncomingShareOut, ShareCreate, ShareOut, ShareTarget, ShareTokenRequest,
)
from app.utils.mail import send_email

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/shares", tags=["shares"])


def _hash(token: str) -> str:
    # The plain token only ever travels in the invitation email; the database holds a hash,
    # so a copy of the table cannot be used to accept somebody else's invitation.
    return hashlib.sha256(token.encode()).hexdigest()


def _target(share: Share) -> ShareTarget:
    if share.apiary_id:
        return ShareTarget(type="apiary", id=share.apiary_id, name=share.apiary.name)
    return ShareTarget(type="hive", id=share.hive_id, name=share.hive.name)


def _owner_of_target(share: Share) -> str:
    """Who owns what the share is about, today: ownership can change hands, the share's own
    owner_id only says who made the invitation."""
    if share.apiary_id:
        return share.apiary.user_id
    return share.hive.apiary.user_id


def _share_out(share: Share) -> ShareOut:
    accepted = share.status == "accepted"
    return ShareOut(
        id=share.id,
        email=share.grantee_email,
        status=share.status,
        target=_target(share),
        collaborator_name=share.grantee.name if accepted and share.grantee else None,
        created_at=share.created_at,
        accepted_at=share.accepted_at,
    )


def _incoming_out(share: Share) -> IncomingShareOut:
    return IncomingShareOut(
        id=share.id,
        owner_name=share.owner.name,
        target=_target(share),
        apiary_name=share.hive.apiary.name if share.hive_id else None,
        created_at=share.created_at,
    )


@router.post("", response_model=ShareOut, status_code=201)
def create_share(
    body: ShareCreate,
    request: Request,
    current_user: CurrentUser,
    db: DB,
    accept_language: Optional[str] = Header(default=None),
):
    enforce_rate_limit(db, request, "share_invite", limit=20, window_minutes=60,
                       identity=current_user.id)

    if body.apiary_id:
        apiary, _, _ = apiary_or_404(db, current_user, body.apiary_id, accept_language, need="owner")
        target_name, filters = apiary.name, {"apiary_id": apiary.id}
    else:
        hive, _, _ = hive_or_404(db, current_user, body.hive_id, accept_language, need="owner")
        target_name, filters = hive.name, {"hive_id": hive.id}

    email = body.email.strip().lower()
    if email == current_user.email.strip().lower():
        raise HTTPException(400, detail=error("SHARE_WITH_SELF", accept_language))

    if db.query(Share).filter_by(grantee_email=email, **filters).first():
        raise HTTPException(409, detail=error("SHARE_ALREADY_EXISTS", accept_language))

    grantee = db.query(User).filter(func.lower(User.email) == email).first()

    # Answered the same whether or not an account exists, so this cannot be used to find out
    # who has one. Either way the person gets an email with a link and a token in it.
    token = secrets.token_urlsafe(32)
    share = Share(
        owner_id=current_user.id,
        grantee_email=email,
        grantee_user_id=grantee.id if grantee else None,
        status="pending",
        token_hash=_hash(token),
        **filters,
    )
    db.add(share)
    db.commit()
    db.refresh(share)

    subject, html_body = invitation_email(
        owner=current_user.name,
        target=target_name,
        url=f"{settings.app_base_url.rstrip('/')}/dashboard/invitations?token={token}",
        locale=grantee.locale if grantee else accept_language,
    )
    send_email(email, subject, html_body)
    return _share_out(share)


@router.get("", response_model=list[ShareOut])
def list_shares(
    current_user: CurrentUser,
    db: DB,
    apiary_id: Optional[str] = Query(default=None),
    hive_id: Optional[str] = Query(default=None),
    accept_language: Optional[str] = Header(default=None),
):
    if bool(apiary_id) == bool(hive_id):
        raise HTTPException(422, detail="Give exactly one of apiary_id and hive_id")
    if apiary_id:
        apiary_or_404(db, current_user, apiary_id, accept_language, need="owner")
        query = db.query(Share).filter(Share.apiary_id == apiary_id)
    else:
        hive_or_404(db, current_user, hive_id, accept_language, need="owner")
        query = db.query(Share).filter(Share.hive_id == hive_id)
    return [_share_out(s) for s in query.order_by(Share.created_at.desc()).all()]


@router.get("/incoming", response_model=list[IncomingShareOut])
def incoming_shares(current_user: CurrentUser, db: DB):
    shares = (
        db.query(Share)
        .filter(Share.grantee_user_id == current_user.id, Share.status == "pending")
        .order_by(Share.created_at.desc())
        .all()
    )
    return [_incoming_out(s) for s in shares]


def _own_invitation(db, user: User, share_id: str, lang) -> Share:
    share = db.get(Share, share_id)
    if share is None or share.grantee_user_id != user.id:
        raise HTTPException(404, detail=error("SHARE_NOT_FOUND", lang))
    return share


@router.post("/{share_id}/accept", status_code=204)
def accept_share(
    share_id: str,
    current_user: CurrentUser,
    db: DB,
    accept_language: Optional[str] = Header(default=None),
):
    share = _own_invitation(db, current_user, share_id, accept_language)
    if share.status == "pending":
        share.status = "accepted"
        share.accepted_at = datetime.utcnow()
        share.token_hash = None  # a token works once
        db.commit()


@router.post("/{share_id}/decline", status_code=204)
def decline_share(
    share_id: str,
    current_user: CurrentUser,
    db: DB,
    accept_language: Optional[str] = Header(default=None),
):
    share = _own_invitation(db, current_user, share_id, accept_language)
    if share.status != "pending":
        raise HTTPException(404, detail=error("SHARE_NOT_FOUND", accept_language))
    db.delete(share)
    db.commit()


@router.post("/accept-by-token", response_model=IncomingShareOut)
def accept_by_token(
    body: ShareTokenRequest,
    request: Request,
    current_user: CurrentUser,
    db: DB,
    accept_language: Optional[str] = Header(default=None),
):
    # Guessing tokens is hopeless at 256 bits, but nothing else here deserves to be hammered
    # either, and the limit costs an honest user nothing.
    enforce_rate_limit(db, request, "share_token", limit=20, window_minutes=60,
                       identity=current_user.id)
    share = (
        db.query(Share)
        .filter(Share.token_hash == _hash(body.token), Share.status == "pending")
        .first()
    )
    # An invitation that was made out to an existing account is not for anybody else, even
    # with the token in hand; the owner cannot accept their own either.
    if (
        share is None
        or (share.grantee_user_id is not None and share.grantee_user_id != current_user.id)
        or _owner_of_target(share) == current_user.id
    ):
        raise HTTPException(404, detail=error("SHARE_TOKEN_INVALID", accept_language))

    share.grantee_user_id = current_user.id
    share.status = "accepted"
    share.accepted_at = datetime.utcnow()
    share.token_hash = None
    db.commit()
    db.refresh(share)
    return _incoming_out(share)


@router.delete("/{share_id}", status_code=204)
def delete_share(
    share_id: str,
    current_user: CurrentUser,
    db: DB,
    accept_language: Optional[str] = Header(default=None),
):
    """The owner revokes or withdraws, a collaborator leaves. Nothing they recorded goes."""
    share = db.get(Share, share_id)
    if share is None or (
        share.grantee_user_id != current_user.id and _owner_of_target(share) != current_user.id
    ):
        raise HTTPException(404, detail=error("SHARE_NOT_FOUND", accept_language))
    db.delete(share)
    db.commit()
