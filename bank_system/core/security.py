"""
File: security.py
Module: bank_system.core.security

Purpose:
    Central security utilities for the NEXA platform — password hashing,
    JWT token creation/verification, httpOnly cookie management, and
    device fingerprinting. This module is the foundation of the entire
    authentication and authorization system.

Developer Journey:
    - v1: Used plain-text password comparison (!) — immediately fixed after
      learning about password hashing. This would have been a critical
      vulnerability allowing any database breach to expose all passwords.
    - v2: Adopted bcrypt via passlib for password hashing. bcrypt is designed
      to be intentionally slow, making brute-force attacks computationally
      expensive ($2b$ cost factor = ~250ms per hash).
    - v3: Added JWT access + refresh token pair with python-jose. Initially
      had no token expiration — tokens were valid forever. Fixed by adding
      `exp` claim and configurable TTL.
    - v4: Added httpOnly cookie support to prevent XSS attacks. Previously
      tokens were stored in localStorage, where any injected JavaScript
      could steal them. httpOnly cookies are invisible to JavaScript.

Security Architecture:
    Authentication Flow:
    1. User submits username + password
    2. bcrypt.verify() checks password against stored hash (constant-time)
    3. If MFA enabled → generate OTP, store in Redis with 5-min TTL
    4. After OTP verification → issue JWT access + refresh token pair
    5. Tokens set as httpOnly cookies + returned in JSON body (dual delivery)

    Token Lifecycle:
    - Access token: 30 min, scoped to /api path
    - Refresh token: 7 days, scoped to /api/auth path only
    - Each token pair shares a JTI (JWT ID) for session tracking
    - On refresh: old pair revoked, new pair issued (rotation)

Issue Faced:
    "Invalid credentials" error was traced to bcrypt version mismatch between
    passlib and bcrypt packages. passlib 1.7.4 requires bcrypt <4.1 for the
    internal $2b$ prefix handling. Pinned bcrypt>=4.0.1 in requirements.txt
    and verified verify_password() works correctly with the installed versions.
"""

import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from .config import get_settings

settings = get_settings()

# ── Password Hashing Context ──
# bcrypt is the gold standard for password hashing because:
# 1. It includes a salt automatically (no need to manage salts separately)
# 2. It's intentionally slow (configurable cost factor) to resist brute-force
# 3. It produces different hashes for the same password (salt uniqueness)
# deprecated="auto" means passlib will re-hash passwords using the latest
# scheme if they were hashed with an older/weaker algorithm.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a plain-text password using bcrypt.

    How it works:
        bcrypt generates a random 16-byte salt, prepends it to the password,
        and runs the Blowfish cipher for 2^12 rounds (default cost factor).
        The output includes the algorithm ($2b$), cost factor, salt, and hash
        all in one string — e.g., "$2b$12$LJ3m4ys...".

    Learning Note:
        Initially stored passwords as SHA256 hashes — this is NOT secure for
        passwords because SHA256 is fast (billions of hashes/sec on GPU).
        bcrypt is designed to be slow (~250ms), making brute-force infeasible.
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its bcrypt hash.

    Security:
        passlib.verify() uses constant-time comparison internally to prevent
        timing attacks. A timing attack measures response time differences
        to guess characters of the hash — constant-time comparison eliminates
        this by always taking the same amount of time regardless of match.

    Issue Faced:
        Early implementation used `hashed_password == hash_password(plain)`,
        which ALWAYS returns False because bcrypt generates a unique salt each
        time. The correct approach is passlib's verify(), which extracts the
        salt from the stored hash and re-hashes the input with that same salt.
    """
    return pwd_context.verify(plain_password, hashed_password)


def _create_token(data: dict, expires_delta: timedelta) -> str:
    """Internal helper to create a signed JWT with expiration.

    How JWT works:
        A JWT has 3 parts: Header.Payload.Signature
        - Header: algorithm (HS256) + type (JWT)
        - Payload: our data (sub, role, exp, jti)
        - Signature: HMAC-SHA256(header + payload, SECRET_KEY)

        The server can verify the signature using the same SECRET_KEY,
        ensuring the token hasn't been tampered with.

    Why JTI (JWT ID):
        JTI is a unique identifier for each token, stored in the session_tokens
        database table. This allows us to revoke individual tokens (e.g., on
        logout or password change) — something that standard JWTs can't do
        because they're stateless by design.
    """
    to_encode = data.copy()
    expire = datetime.now(UTC) + expires_delta
    # Add unique JWT ID for session tracking and revocation
    if "jti" not in to_encode:
        to_encode["jti"] = uuid.uuid4().hex
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.jwt_algorithm)
    return encoded_jwt


def create_access_token(subject: str, extra: dict | None = None) -> str:
    """Create a short-lived access token (default: 30 minutes).

    The access token is used for API authentication on every request.
    Short TTL limits the damage if a token is somehow leaked.
    The `sub` (subject) claim contains the username for user identification.
    """
    payload: dict[str, Any] = {"sub": subject, "type": "access"}
    if extra:
        payload.update(extra)
    return _create_token(
        payload,
        expires_delta=timedelta(minutes=settings.access_token_expires_minutes),
    )


def create_refresh_token(subject: str, extra: dict | None = None) -> str:
    """Create a long-lived refresh token (default: 7 days).

    The refresh token is used ONLY to obtain new access tokens without
    re-entering credentials. It has a longer TTL but is scoped to the
    /api/auth path only (via cookie path restriction).

    Token Rotation:
        When a refresh token is used, it's revoked and a new pair is issued.
        This prevents refresh token reuse attacks — if an attacker steals a
        refresh token, it becomes invalid after the legitimate user refreshes.
    """
    payload: dict[str, Any] = {"sub": subject, "type": "refresh"}
    if extra:
        payload.update(extra)
    return _create_token(
        payload,
        expires_delta=timedelta(minutes=settings.refresh_token_expires_minutes),
    )


def decode_token(token: str) -> dict[str, Any]:
    """Decode and verify a JWT token.

    Verification includes:
        1. Signature check (was it signed with our SECRET_KEY?)
        2. Expiration check (is `exp` in the future?)
        3. Algorithm check (is it HS256 as expected?)

    Raises ValueError if the token is invalid, expired, or tampered with.
    """
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
        return payload
    except JWTError as exc:
        raise ValueError("Invalid token") from exc


def set_auth_cookies(response, access_token: str, refresh_token: str) -> None:
    """Set httpOnly cookies for access and refresh tokens.

    Why httpOnly cookies instead of localStorage:
        - localStorage is accessible to ANY JavaScript on the page, including
          injected scripts (XSS attacks). One successful XSS = all tokens stolen.
        - httpOnly cookies are INVISIBLE to JavaScript. The browser sends them
          automatically with each request, but document.cookie cannot read them.

    Security properties:
        - httpOnly=True: JavaScript cannot access the cookie (XSS protection)
        - secure=True (prod): Cookie only sent over HTTPS (prevents MITM)
        - samesite=Lax: Cookie sent on same-site requests + top-level navigations
          but NOT on cross-site AJAX (CSRF protection)
        - path scoped: Access token to /api, refresh to /api/auth only

    Developer Journey:
        Initially stored tokens in localStorage and sent via Authorization header.
        This worked but was vulnerable to XSS. Migrated to httpOnly cookies with
        header fallback for Swagger UI compatibility.
    """
    from .config import get_settings

    _settings = get_settings()
    is_prod = _settings.environment == "production"

    # Access token cookie — scoped to /api so it's sent with all API requests
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=is_prod,
        samesite="lax",
        path="/api",
        max_age=_settings.access_token_expires_minutes * 60,
    )

    # Refresh token cookie — scoped to /api/auth only (minimal exposure)
    # This means the refresh token is only sent when hitting auth endpoints,
    # reducing the attack surface if a non-auth endpoint is compromised.
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
    """Clear auth cookies on logout.

    Both cookies must be deleted with the SAME path they were set with,
    otherwise the browser won't match them for deletion.
    """
    response.delete_cookie(key="access_token", path="/api")
    response.delete_cookie(key="refresh_token", path="/api/auth")


def parse_device_name(user_agent: str) -> str:
    """Extract a human-friendly device name from User-Agent string.

    Used in session management to show users which devices are logged in.
    Example output: "Chrome — Windows" or "Safari — iPhone"

    This is a best-effort parser — User-Agent strings are not standardized
    and can be spoofed. It's used for display purposes only, never for
    security decisions.
    """
    if not user_agent:
        return "Unknown Device"

    ua = user_agent.lower()

    # Detect browser — order matters because Chrome's UA contains "safari"
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
