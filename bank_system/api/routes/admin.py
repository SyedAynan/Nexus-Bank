from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from bank_system.api.deps import role_required
from bank_system.core.db import get_db
from bank_system.core.redis_client import get_redis
from bank_system.engines.fraud import FraudEngine
from bank_system.models.db_models import SecurityEvent, User, UserRole


router = APIRouter(prefix="/api/admin", tags=["admin"])

fraud_engine = FraudEngine()


# ── Schemas ──

class UserUpdate(BaseModel):
    role: Optional[str] = None
    is_locked: Optional[bool] = None
    is_active: Optional[bool] = None


# ── User Management Endpoints ──

@router.get("/users")
def list_users(
    db: Annotated[Session, Depends(get_db)],
    current_admin=Depends(role_required(UserRole.admin)),
):
    """List all users (admin only)."""
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "role": u.role.value if hasattr(u.role, 'value') else u.role,
            "is_active": u.is_active,
            "is_locked": u.is_locked,
            "failed_login_attempts": u.failed_login_attempts,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users
    ]


@router.patch("/users/{user_id}")
def update_user(
    user_id: int,
    body: UserUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_admin=Depends(role_required(UserRole.admin)),
):
    """Update a user's role, lock status, or active status (admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if body.role is not None:
        try:
            user.role = UserRole(body.role)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid role: {body.role}")

    if body.is_locked is not None:
        user.is_locked = body.is_locked
        if not body.is_locked:
            user.failed_login_attempts = 0  # Reset on unlock

    if body.is_active is not None:
        user.is_active = body.is_active

    db.commit()
    return {"message": "User updated", "user_id": user_id}


# ── Existing Endpoints ──

@router.get("/live-users", response_model=List[str])
def live_users(
    current_admin=Depends(role_required(UserRole.admin)),
):
    redis = get_redis()
    return list(redis.smembers("live_users"))


@router.get("/fraud-alerts")
def fraud_alerts(
    db: Annotated[Session, Depends(get_db)],
    current_admin=Depends(role_required(UserRole.admin, UserRole.analyst)),
):
    return fraud_engine.get_open_alerts(db)


@router.get("/security-events")
def security_events(
    db: Annotated[Session, Depends(get_db)],
    current_admin=Depends(role_required(UserRole.admin)),
    limit: int = 100,
):
    events = (
        db.query(SecurityEvent)
        .order_by(SecurityEvent.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": e.id,
            "username": e.username,
            "type": e.event_type.value,
            "ip": e.ip_address,
            "user_agent": e.user_agent,
            "created_at": e.created_at.isoformat(),
            "details": e.details,
        }
        for e in events
    ]
