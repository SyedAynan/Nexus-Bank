"""
File: deps.py
Module: bank_system.api.deps

Purpose:
    FastAPI dependency injection functions used across all API routes.
    Provides: user authentication, role-based access control (RBAC),
    security event logging, and request metadata extraction.

    These dependencies are injected into route handlers via FastAPI's
    Depends() system, ensuring consistent auth checks without code duplication.

Developer Journey:
    - v1: Auth checks were copy-pasted into every route handler — 50+ lines
      of duplicated token parsing and user lookup logic. Bugs in one place
      weren't fixed everywhere.
    - v2: Extracted into get_current_user() dependency — single source of truth.
    - v3: Added role_required() for RBAC — admin-only endpoints no longer need
      manual role checks in every handler.
    - v4: Migrated from header-only auth to cookie-first with header fallback.
      This was necessary for the httpOnly cookie security upgrade while
      maintaining backward compatibility with Swagger UI and Postman.

Auth Token Resolution Order:
    1. httpOnly cookie (most secure — browser sends automatically)
    2. Authorization: Bearer header (fallback for API clients, Swagger UI)
    This dual approach allows the frontend to use secure cookies while
    developers can still test via Swagger docs with Bearer tokens.
"""

from datetime import UTC, datetime
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

# ── OAuth2 Scheme ──
# auto_error=False: Don't raise 401 automatically when no Authorization header
# is present. We handle this ourselves in _extract_token() because the token
# might be in a cookie instead of a header.
# Issue Faced: Setting auto_error=True caused 401 errors for cookie-authenticated
# requests because the OAuth2 scheme only checks the Authorization header.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def get_ip_ua(request: Request) -> tuple[str | None, str | None]:
    """Extract client IP address and User-Agent from the request.

    Uses X-Forwarded-For header first (set by reverse proxies like Nginx,
    Kubernetes Ingress, or Cloudflare) to get the real client IP.
    Falls back to request.client.host for direct connections.

    These values are logged in security events for audit trails and used
    in session management to identify devices.
    """
    ip = request.headers.get("x-forwarded-for") or request.client.host
    ua = request.headers.get("user-agent")
    return ip, ua


def _extract_token(request: Request, header_token: str | None) -> str:
    """Extract JWT token from httpOnly cookie first, then Authorization header.

    Priority: cookie > header (cookie is more secure, header is for Swagger/API clients)

    Why this order:
        - Cookies are automatically sent by the browser and are httpOnly
          (invisible to JavaScript), making them resistant to XSS attacks.
        - Authorization headers require JavaScript to set them, which means
          the token must be accessible to JavaScript (stored in localStorage),
          making them vulnerable to XSS.
        - We keep header support for: Swagger UI testing, Postman, mobile apps,
          and any API client that can't use cookies.

    Developer Journey:
        Initially only supported Authorization header. When we migrated to
        httpOnly cookies for XSS protection, we needed to keep header support
        for backward compatibility. This function bridges both approaches.
    """
    # 1. Try httpOnly cookie (preferred — most secure)
    cookie_token = request.cookies.get("access_token")
    if cookie_token:
        return cookie_token

    # 2. Fall back to Authorization header (Swagger UI, external API clients)
    if header_token:
        return header_token

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    request: Request,
    token: Annotated[str | None, Depends(oauth2_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    """Core authentication dependency — resolves the current user from JWT.

    How it works:
        1. Extract token from cookie or header via _extract_token()
        2. Decode and verify JWT signature + expiration
        3. Extract username from the `sub` (subject) claim
        4. Look up user in database and verify they're active + not locked

    This is injected into every protected route via:
        current_user: Annotated[User, Depends(get_current_user)]

    Issue Faced:
        "Invalid credentials" errors were traced to this function when the
        OAuth2 scheme's auto_error=True rejected requests that had cookies
        but no Authorization header. Fixed by setting auto_error=False and
        handling token extraction ourselves.
    """
    resolved_token = _extract_token(request, token)

    try:
        payload = decode_token(resolved_token)
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
    """Wrapper dependency that ensures the user is active.

    Used in routes that require an authenticated AND active user.
    Separating this from get_current_user allows flexibility —
    some admin routes might need to work with inactive users.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )
    return current_user


def role_required(*roles: UserRole):
    """Factory for role-based access control (RBAC) dependencies.

    Usage:
        @router.get("/admin/users")
        def list_users(user: User = Depends(role_required(UserRole.admin))):
            ...

    How it works:
        Returns a dependency function that checks if the current user's role
        is in the allowed roles list. If not, returns 403 Forbidden.

    Developer Journey:
        Initially checked roles manually in each handler:
            if current_user.role != "admin": raise HTTPException(403)
        This was error-prone — easy to forget in new endpoints.
        role_required() makes it declarative and impossible to forget.
    """
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
    """Log a security-relevant event for audit trail.

    Events logged include: login success/failure, MFA challenges, account
    lockouts, password resets, and suspicious activity.

    Why this matters:
        - Compliance: Financial regulations (SOX, PCI-DSS) require audit logs
          of all authentication events.
        - Forensics: When investigating breaches, these logs show exactly what
          happened, from which IP, at what time.
        - Monitoring: Patterns like repeated login failures from the same IP
          can trigger automated alerts.

    The `user` parameter is optional because failed login attempts may
    not have a matching user (e.g., wrong username).
    """
    evt = SecurityEvent(
        user_id=user.id if user else None,
        username=username,
        event_type=event_type,
        ip_address=ip,
        user_agent=ua,
        created_at=datetime.now(UTC),
        details=details,
    )
    db.add(evt)
    db.commit()
