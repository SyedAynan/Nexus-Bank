import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from .config import get_settings

settings = get_settings()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def _create_token(data: dict, expires_delta: timedelta) -> str:
    to_encode = data.copy()
    expire = datetime.now(UTC) + expires_delta
    # Add unique JWT ID for session tracking
    if "jti" not in to_encode:
        to_encode["jti"] = uuid.uuid4().hex
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.jwt_algorithm)
    return encoded_jwt


def create_access_token(subject: str, extra: dict | None = None) -> str:
    payload: dict[str, Any] = {"sub": subject, "type": "access"}
    if extra:
        payload.update(extra)
    return _create_token(
        payload,
        expires_delta=timedelta(minutes=settings.access_token_expires_minutes),
    )


def create_refresh_token(subject: str, extra: dict | None = None) -> str:
    payload: dict[str, Any] = {"sub": subject, "type": "refresh"}
    if extra:
        payload.update(extra)
    return _create_token(
        payload,
        expires_delta=timedelta(minutes=settings.refresh_token_expires_minutes),
    )


def decode_token(token: str) -> dict[str, Any]:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
        return payload
    except JWTError as exc:
        raise ValueError("Invalid token") from exc


def set_auth_cookies(response, access_token: str, refresh_token: str) -> None:
    """Set httpOnly cookies for access and refresh tokens.

    Security properties:
    - httpOnly: JS cannot read tokens (XSS protection)
    - secure: only sent over HTTPS in production
    - samesite=Lax: CSRF protection while allowing navigation
    - path scoped: access token to /api, refresh to /api/auth/refresh
    """
    from .config import get_settings

    _settings = get_settings()
    is_prod = _settings.environment == "production"

    # Access token cookie — scoped to /api
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=is_prod,
        samesite="lax",
        path="/api",
        max_age=_settings.access_token_expires_minutes * 60,
    )

    # Refresh token cookie — scoped to /api/auth/refresh only
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=is_prod,
        samesite="lax",
        path="/api/auth",
        max_age=_settings.refresh_token_expires_minutes * 60,
    )


def clear_auth_cookies(response) -> None:
    """Clear auth cookies on logout."""
    response.delete_cookie(key="access_token", path="/api")
    response.delete_cookie(key="refresh_token", path="/api/auth")


def parse_device_name(user_agent: str) -> str:
    """Extract a human-friendly device name from User-Agent string."""
    if not user_agent:
        return "Unknown Device"

    ua = user_agent.lower()

    # Detect browser
    browser = "Unknown Browser"
    if "edg/" in ua or "edge" in ua:
        browser = "Edge"
    elif "opr/" in ua or "opera" in ua:
        browser = "Opera"
    elif "chrome" in ua and "chromium" not in ua:
        browser = "Chrome"
    elif "firefox" in ua:
        browser = "Firefox"
    elif "safari" in ua and "chrome" not in ua:
        browser = "Safari"

    # Detect OS
    os_name = "Unknown OS"
    if "windows nt 10" in ua or "windows nt 11" in ua:
        os_name = "Windows"
    elif "macintosh" in ua or "mac os" in ua:
        os_name = "MacOS"
    elif "linux" in ua and "android" not in ua:
        os_name = "Linux"
    elif "android" in ua:
        os_name = "Android"
    elif "iphone" in ua:
        os_name = "iPhone"
    elif "ipad" in ua:
        os_name = "iPad"

    return f"{browser} — {os_name}"
