from datetime import datetime, timezone
from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from bank_system.core.db import get_db
from bank_system.core.security import decode_token
from bank_system.models.db_models import (
    SecurityEvent,
    SecurityEventType,
    User,
    UserRole,
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_ip_ua(request: Request) -> tuple[str | None, str | None]:
    ip = request.headers.get("x-forwarded-for") or request.client.host
    ua = request.headers.get("user-agent")
    return ip, ua


def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    try:
        payload = decode_token(token)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )

    username: str | None = payload.get("sub")

    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    user = db.query(User).filter(User.username == username).first()

    if not user or not user.is_active or user.is_locked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User inactive or locked",
        )

    return user


def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )
    return current_user


def role_required(*roles: UserRole):
    def _wrapper(
        current_user: Annotated[User, Depends(get_current_active_user)],
    ) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient privileges",
            )
        return current_user

    return _wrapper


def log_security_event(
    db: Session,
    *,
    user: User | None,
    username: str | None,
    event_type: SecurityEventType,
    ip: str | None,
    ua: str | None,
    details: str | None = None,
) -> None:
    evt = SecurityEvent(
        user_id=user.id if user else None,
        username=username,
        event_type=event_type,
        ip_address=ip,
        user_agent=ua,
        created_at=datetime.now(timezone.utc),
        details=details,
    )
    db.add(evt)
    db.commit()
