from datetime import datetime
from typing import Annotated, Optional

from fastapi import Depends, Header, HTTPException, status
from jose import ExpiredSignatureError, JWTError, jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.i18n import error
from app.models import User

ALGORITHM = "HS256"


def get_current_user(
    # Optional, although the header is anything but: a required `Header()` is checked by
    # FastAPI's own request validation, which answers 422 with pydantic's list of errors
    # before this function runs. No header at all is an authentication failure like any
    # other, so it has to be decided in here to come out as 401 with the project's error
    # body (#482).
    authorization: Annotated[Optional[str], Header()] = None,
    accept_language: Annotated[Optional[str], Header()] = None,
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=error("TOKEN_INVALID", accept_language),
    )
    if not authorization or not authorization.startswith("Bearer "):
        raise credentials_exception
    token = authorization.removeprefix("Bearer ")
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        if user_id is None or token_type != "access":
            raise credentials_exception
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error("TOKEN_EXPIRED", accept_language),
        )
    except JWTError:
        raise credentials_exception
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=error("USER_NOT_FOUND", accept_language),
        )
    return user


def get_current_admin(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "FORBIDDEN", "message": "Admin access required."},
        )
    return current_user


def get_current_supporter(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    """Admins get supporter-tier access too, matching the frontend's
    `user.is_supporter || user.is_admin` gating (DashboardShell, MembersTeaser)."""
    if not current_user.is_supporter and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            # Translated, now that a user can meet this by not having paid rather than by
            # being in the wrong place (#478).
            detail=error("SUPPORTER_REQUIRED"),
        )
    return current_user


def get_optional_user(
    authorization: Annotated[Optional[str], Header()] = None,
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Return the current user if a valid Bearer token is present, otherwise None."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.removeprefix("Bearer ")
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        if user_id is None or token_type != "access":
            return None
    except JWTError:
        return None
    return db.get(User, user_id)


CurrentUser = Annotated[User, Depends(get_current_user)]
CurrentAdmin = Annotated[User, Depends(get_current_admin)]
CurrentSupporter = Annotated[User, Depends(get_current_supporter)]
OptionalUser = Annotated[Optional[User], Depends(get_optional_user)]
DB = Annotated[Session, Depends(get_db)]
