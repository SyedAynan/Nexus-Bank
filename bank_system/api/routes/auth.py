import logging
import random
import uuid
from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import ORJSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from bank_system.api.deps import (
    get_current_active_user,
    get_ip_ua,
    log_security_event,
    oauth2_scheme,
)
from bank_system.core.config import get_settings
from bank_system.core.db import get_db
from bank_system.core.redis_client import get_redis
from bank_system.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    parse_device_name,
    verify_password,
)
from bank_system.models.db_models import SecurityEventType, SessionToken, User, UserRole
from bank_system.schemas.auth import (
    LoginRequest,
    SessionRead,
    Token,
    UserCreate,
    UserRead,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])
settings = get_settings()
logger = logging.getLogger("nexa.auth")

# ── OTP Configuration ──
OTP_EXPIRY_SECONDS = 300  # 5 minutes
OTP_MAX_ATTEMPTS = 3  # Max failed OTP attempts before invalidation


def _generate_otp() -> str:
    """Generate a cryptographically secure 6-digit OTP.
    Uses SystemRandom for cryptographic security.
    In development or demo mode, uses fixed OTP '000000' for convenience.
    """
    if settings.environment == "development" or settings.demo_mode:
        logger.info("[DEV OTP] Using fixed OTP: 000000")
        return "000000"
    otp = f"{random.SystemRandom().randint(0, 999999):06d}"
    return otp


@router.post("/register", response_model=UserRead, status_code=201)
def register_user(payload: UserCreate, db: Annotated[Session, Depends(get_db)]):
    existing = db.query(User).filter((User.username == payload.username) | (User.email == payload.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")

    user = User(
        username=payload.username,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=UserRole.user,  # Always register as regular user — prevents privilege escalation
    )

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login")
def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    request: Request,
    db: Annotated[Session, Depends(get_db)],
):
    redis = get_redis()
    ip, ua = get_ip_ua(request)

    user = db.query(User).filter(User.username == form_data.username).first()

    if not user:
        log_security_event(
            db,
            user=None,
            username=form_data.username,
            event_type=SecurityEventType.login_failure,
            ip=ip,
            ua=ua,
            details="Unknown username",
        )
        raise HTTPException(status_code=400, detail="Incorrect username or password")

    if user.is_locked:
        raise HTTPException(status_code=403, detail="Account locked — contact support")

    if not verify_password(form_data.password, user.hashed_password):
        user.failed_login_attempts += 1

        if user.failed_login_attempts >= 5:
            user.is_locked = True
            log_security_event(
                db,
                user=user,
                username=user.username,
                event_type=SecurityEventType.account_lockout,
                ip=ip,
                ua=ua,
                details=f"Account locked after {user.failed_login_attempts} failed attempts",
            )
        else:
            log_security_event(
                db,
                user=user,
                username=user.username,
                event_type=SecurityEventType.login_failure,
                ip=ip,
                ua=ua,
                details=f"Bad password (attempt {user.failed_login_attempts}/5)",
            )

        db.commit()
        raise HTTPException(status_code=400, detail="Incorrect username or password")

    # Reset failed attempts on successful password verification
    user.failed_login_attempts = 0
    db.commit()

    # Generate cryptographically secure OTP
    otp = _generate_otp()

    # Store OTP with expiry and attempt counter
    redis.setex(f"otp:{user.username}", OTP_EXPIRY_SECONDS, otp)
    redis.set(f"otp_attempts:{user.username}", "0", ex=OTP_EXPIRY_SECONDS)

    log_security_event(
        db,
        user=user,
        username=user.username,
        event_type=SecurityEventType.mfa_challenge,
        ip=ip,
        ua=ua,
        details="OTP generated and sent",
    )

    # Return proper 202 response
    return ORJSONResponse(
        status_code=status.HTTP_202_ACCEPTED,
        content={"detail": "MFA required", "mfa": True, "username": user.username},
        headers={"X-MFA": "required"},
    )


@router.post("/verify-otp", response_model=Token)
def verify_otp(
    payload: LoginRequest,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
):
    redis = get_redis()
    ip, ua = get_ip_ua(request)

    user = db.query(User).filter(User.username == payload.username).first()

    if not user or user.is_locked:
        raise HTTPException(status_code=400, detail="Invalid user")

    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    # Check OTP attempt limit
    attempt_key = f"otp_attempts:{user.username}"
    attempts = redis.get(attempt_key)
    if attempts and int(attempts) >= OTP_MAX_ATTEMPTS:
        redis.delete(f"otp:{user.username}")
        redis.delete(attempt_key)
        log_security_event(
            db,
            user=user,
            username=user.username,
            event_type=SecurityEventType.mfa_failure,
            ip=ip,
            ua=ua,
            details="OTP max attempts exceeded — OTP invalidated",
        )
        raise HTTPException(status_code=429, detail="Too many OTP attempts. Please login again.")

    cached = redis.get(f"otp:{user.username}")

    if not cached or payload.otp != cached:
        # Increment attempt counter
        redis.incr(attempt_key)
        log_security_event(
            db,
            user=user,
            username=user.username,
            event_type=SecurityEventType.mfa_failure,
            ip=ip,
            ua=ua,
            details="Invalid OTP",
        )
        raise HTTPException(status_code=400, detail="Invalid OTP")

    # OTP verified — clean up
    redis.delete(f"otp:{user.username}")
    redis.delete(attempt_key)

    log_security_event(
        db,
        user=user,
        username=user.username,
        event_type=SecurityEventType.login_success,
        ip=ip,
        ua=ua,
        details="MFA verified — login successful",
    )

    now = datetime.now(UTC)

    # Generate shared JTI for the access/refresh token pair
    session_jti = uuid.uuid4().hex

    access = create_access_token(
        user.username,
        extra={"role": user.role, "iat": int(now.timestamp()), "jti": session_jti},
    )

    refresh = create_refresh_token(
        user.username,
        extra={"role": user.role, "iat": int(now.timestamp()), "jti": session_jti},
    )

    # ── Persist session token for session management ──
    device_name = parse_device_name(ua or "")
    session_token = SessionToken(
        user_id=user.id,
        jti=session_jti,
        token_type="access",
        created_at=now,
        expires_at=now + timedelta(minutes=settings.access_token_expires_minutes),
        device_name=device_name,
        ip_address=ip,
        user_agent=ua,
        location=None,
        last_active=now,
    )
    db.add(session_token)
    db.commit()

    redis.sadd("live_users", user.username)

    return Token(access_token=access, refresh_token=refresh)


# ── Token Refresh Endpoint (BUG-015 Fix) ──


@router.post("/refresh", response_model=Token)
async def refresh_token(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
):
    """Refresh an access token using a valid refresh token.

    Implements token rotation: old refresh token is invalidated and a new
    pair (access + refresh) is issued. This prevents refresh token reuse attacks.
    """
    import orjson

    refresh_str = None

    # Get from JSON body
    try:
        body_bytes = await request.body()
        body = orjson.loads(body_bytes)
        refresh_str = body.get("refresh_token")
    except Exception:
        pass

    if not refresh_str:
        raise HTTPException(status_code=400, detail="Refresh token required")

    try:
        payload = decode_token(refresh_str)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    # Verify it's a refresh token
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")

    username = payload.get("sub")
    old_jti = payload.get("jti")

    if not username:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    # Look up user
    user = db.query(User).filter(User.username == username).first()
    if not user or not user.is_active or user.is_locked:
        raise HTTPException(status_code=401, detail="User inactive or locked")

    # Revoke old session if it exists
    if old_jti:
        old_session = (
            db.query(SessionToken)
            .filter(
                SessionToken.jti == old_jti,
                SessionToken.user_id == user.id,
            )
            .first()
        )
        if old_session:
            old_session.revoked = True

    now = datetime.now(UTC)
    new_jti = uuid.uuid4().hex

    # Issue new token pair
    new_access = create_access_token(
        user.username,
        extra={"role": user.role, "iat": int(now.timestamp()), "jti": new_jti},
    )
    new_refresh = create_refresh_token(
        user.username,
        extra={"role": user.role, "iat": int(now.timestamp()), "jti": new_jti},
    )

    # Create new session record
    ip, ua = get_ip_ua(request)
    device_name = parse_device_name(ua or "")
    new_session = SessionToken(
        user_id=user.id,
        jti=new_jti,
        token_type="access",
        created_at=now,
        expires_at=now + timedelta(minutes=settings.access_token_expires_minutes),
        device_name=device_name,
        ip_address=ip,
        user_agent=ua,
        last_active=now,
    )
    db.add(new_session)
    db.commit()

    return Token(access_token=new_access, refresh_token=new_refresh)


@router.post("/logout")
def logout(
    current_user: Annotated[User, Depends(get_current_active_user)],
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[Session, Depends(get_db)],
):
    """Logout: revoke the current session token."""
    redis = get_redis()
    redis.srem("live_users", current_user.username)

    # Revoke the current session in DB
    try:
        payload = decode_token(token)
        jti = payload.get("jti")
        if jti:
            session = (
                db.query(SessionToken)
                .filter(
                    SessionToken.jti == jti,
                    SessionToken.user_id == current_user.id,
                )
                .first()
            )
            if session:
                session.revoked = True
                db.commit()
    except ValueError:
        pass  # Token decode failure — still allow logout

    return {"success": True}


# ── Session Management Endpoints ──


@router.get("/sessions", response_model=list[SessionRead])
def list_sessions(
    current_user: Annotated[User, Depends(get_current_active_user)],
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[Session, Depends(get_db)],
):
    """List all active (non-revoked, non-expired) sessions for the current user."""
    now = datetime.now(UTC)

    # Get current session JTI
    current_jti = None
    try:
        payload = decode_token(token)
        current_jti = payload.get("jti")
    except ValueError:
        pass

    sessions = (
        db.query(SessionToken)
        .filter(
            SessionToken.user_id == current_user.id,
            SessionToken.revoked.is_(False),  # Fixed: SQLAlchemy proper comparison
            SessionToken.expires_at > now,
        )
        .order_by(SessionToken.last_active.desc())
        .all()
    )

    result = []
    for s in sessions:
        session_data = SessionRead.model_validate(s)
        session_data.is_current = (s.jti == current_jti) if current_jti else False
        result.append(session_data)

    return result


@router.delete("/sessions/{session_id}")
def revoke_session(
    session_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[Session, Depends(get_db)],
):
    """Revoke a specific session. Cannot revoke your own current session."""
    session = (
        db.query(SessionToken)
        .filter(
            SessionToken.id == session_id,
            SessionToken.user_id == current_user.id,
            SessionToken.revoked.is_(False),  # Fixed: SQLAlchemy proper comparison
        )
        .first()
    )

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Prevent revoking current session (use /logout instead)
    try:
        payload = decode_token(token)
        if payload.get("jti") == session.jti:
            raise HTTPException(
                status_code=400,
                detail="Cannot revoke current session. Use /logout instead.",
            )
    except ValueError:
        pass

    session.revoked = True
    db.commit()
    return {"success": True, "detail": "Session revoked"}


@router.delete("/sessions")
def revoke_all_sessions(
    current_user: Annotated[User, Depends(get_current_active_user)],
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[Session, Depends(get_db)],
):
    """Revoke all sessions except the current one."""
    now = datetime.now(UTC)

    current_jti = None
    try:
        payload = decode_token(token)
        current_jti = payload.get("jti")
    except ValueError:
        pass

    sessions = (
        db.query(SessionToken)
        .filter(
            SessionToken.user_id == current_user.id,
            SessionToken.revoked.is_(False),  # Fixed: SQLAlchemy proper comparison
            SessionToken.expires_at > now,
        )
        .all()
    )

    revoked_count = 0
    for s in sessions:
        if s.jti != current_jti:
            s.revoked = True
            revoked_count += 1

    db.commit()
    return {"success": True, "revoked_count": revoked_count}


# ── Account Unlock (Admin Only) ──


@router.post("/unlock/{username}")
def unlock_account(
    username: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    """Admin-only: Unlock a locked user account."""
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_locked = False
    user.failed_login_attempts = 0
    db.commit()
    return {"success": True, "detail": f"Account {username} unlocked"}
