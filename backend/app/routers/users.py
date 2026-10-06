from typing import Optional

from fastapi import APIRouter, Header, HTTPException
from passlib.context import CryptContext

from app.deps import CurrentUser, DB
from app.i18n import error
from app.utils.accounts import delete_account
from app.utils import apple_auth
from app.schemas import (
    PushTokenRegister,
    ReminderSettingsOut,
    ReminderSettingsUpdate,
    UserOut,
    UserUpdate,
)

router = APIRouter(prefix="/users", tags=["users"])
_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.get("/me", response_model=UserOut)
def get_me(current_user: CurrentUser):
    return current_user


@router.put("/me", response_model=UserOut)
def update_me(
    body: UserUpdate,
    current_user: CurrentUser,
    db: DB,
    accept_language: Optional[str] = Header(default=None),
):
    if body.name is not None:
        current_user.name = body.name
    if body.locale is not None:
        current_user.locale = body.locale
    if body.password is not None:
        if current_user.hashed_password is None:
            # Verifying against nothing raises instead of returning False, which used to turn
            # this into a 500. An account made through Apple or Google has no password to
            # change; it sets one through the emailed reset link, which proves the mailbox.
            raise HTTPException(400, detail=error("NO_PASSWORD_SET", accept_language))
        if not _pwd.verify(body.current_password, current_user.hashed_password):
            raise HTTPException(400, detail="Current password is incorrect")
        current_user.hashed_password = _pwd.hash(body.password)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.delete("/me", status_code=204)
def delete_me(current_user: CurrentUser, db: DB):
    if current_user.apple_refresh_token and current_user.apple_token_client_id:
        # Apple requires the token to be revoked when the account goes. Best effort: an
        # unreachable Apple must not keep somebody from deleting their own data.
        apple_auth.revoke(current_user.apple_refresh_token, current_user.apple_token_client_id)
    # What was shared with others is handed over to them first; the rest goes.
    delete_account(db, current_user)


# ---------------------------------------------------------------------------
# Reminder settings & push tokens
# ---------------------------------------------------------------------------


@router.get("/me/reminder", response_model=ReminderSettingsOut)
def get_reminder_settings(current_user: CurrentUser) -> ReminderSettingsOut:
    return ReminderSettingsOut.model_validate(current_user)


@router.put("/me/reminder", response_model=ReminderSettingsOut)
def update_reminder_settings(
    body: ReminderSettingsUpdate, current_user: CurrentUser, db: DB
) -> ReminderSettingsOut:
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return ReminderSettingsOut.model_validate(current_user)


@router.post("/me/push-token")
def register_push_token(
    body: PushTokenRegister, current_user: CurrentUser, db: DB
) -> dict:
    if body.platform == "ios":
        current_user.push_token_apns = body.token
    else:
        current_user.push_token_fcm = body.token
    db.commit()
    return {"ok": True}
