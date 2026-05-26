from fastapi import APIRouter, HTTPException
from passlib.context import CryptContext

from app.deps import CurrentUser, DB
from app.models import Hive, Inspection
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
def update_me(body: UserUpdate, current_user: CurrentUser, db: DB):
    if body.name is not None:
        current_user.name = body.name
    if body.locale is not None:
        current_user.locale = body.locale
    if body.password is not None:
        if not _pwd.verify(body.current_password, current_user.hashed_password):
            raise HTTPException(400, detail="Current password is incorrect")
        current_user.hashed_password = _pwd.hash(body.password)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.delete("/me", status_code=204)
def delete_me(current_user: CurrentUser, db: DB):
    user_id = current_user.id
    # Delete in FK order: inspections → hives → user (cascade handles rest)
    db.query(Inspection).filter(
        Inspection.hive_id.in_(db.query(Hive.id).filter(Hive.user_id == user_id))
    ).delete(synchronize_session=False)
    db.query(Hive).filter(Hive.user_id == user_id).delete(synchronize_session=False)
    db.delete(current_user)
    db.commit()


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
