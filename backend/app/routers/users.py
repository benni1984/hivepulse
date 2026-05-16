from fastapi import APIRouter, HTTPException
from passlib.context import CryptContext

from app.deps import CurrentUser, DB
from app.models import Hive, Inspection
from app.schemas import UserOut, UserUpdate

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
