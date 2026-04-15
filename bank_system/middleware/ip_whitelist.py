"""
IP Whitelist Middleware for Admin Routes
=========================================
Restricts /api/admin/* endpoints to whitelisted IP addresses.
In development mode with an empty whitelist, all IPs are allowed.
Caches the whitelist for 60 seconds to reduce DB queries.
"""

import logging
import time

from fastapi import Request, Response
from sqlalchemy.orm import Session as DBSession
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import JSONResponse

from bank_system.core.config import get_settings
from bank_system.core.db import SessionLocal
from bank_system.models.db_models import IPWhitelist

logger = logging.getLogger("nexa.ip_whitelist")

# ── In-memory cache ──
_cached_ips: set[str] = set()
_cache_timestamp: float = 0
CACHE_TTL = 60  # seconds


def _refresh_whitelist() -> set[str]:
    """Fetch active whitelisted IPs from DB, cache them."""
    global _cached_ips, _cache_timestamp
    now = time.time()

    if now - _cache_timestamp < CACHE_TTL and _cached_ips is not None:
        return _cached_ips

    try:
        db: DBSession = SessionLocal()
        try:
            rows = (
                db.query(IPWhitelist.ip_address)
                .filter(IPWhitelist.is_active.is_(True))
                .all()
            )
            _cached_ips = {r[0] for r in rows}
        finally:
            db.close()
    except Exception as exc:
        logger.error(f"Failed to load IP whitelist: {exc}")
        # On error, keep the old cache to avoid locking out admins
        return _cached_ips

    _cache_timestamp = now
    return _cached_ips


def invalidate_whitelist_cache():
    """Call after any whitelist CRUD operation to force a refresh."""
    global _cache_timestamp
    _cache_timestamp = 0


class IPWhitelistMiddleware(BaseHTTPMiddleware):
    """Block non-whitelisted IPs from accessing admin endpoints."""

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        path = request.url.path.lower()

        # Only apply to admin routes
        if not path.startswith("/api/admin"):
            return await call_next(request)

        # Allow the IP whitelist management endpoints themselves
        # (so admins can add their IP before getting locked out)
        if "/ip-whitelist" in path:
            return await call_next(request)

        settings = get_settings()
        whitelist = _refresh_whitelist()

        # Dev bypass: empty whitelist in development = allow all
        if not whitelist:
            if settings.environment == "development":
                return await call_next(request)
            else:
                # Production with empty whitelist blocks all admin access
                logger.warning(
                    "Admin access blocked: no IPs in whitelist (production mode)"
                )
                return JSONResponse(
                    status_code=403,
                    content={
                        "detail": "Admin access restricted. Configure IP whitelist."
                    },
                )

        # Extract client IP
        ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
        if not ip:
            ip = request.client.host if request.client else "unknown"

        # Normalize localhost variants
        if ip in ("::1", "0.0.0.0"):
            ip = "127.0.0.1"

        if ip not in whitelist:
            logger.warning(f"Admin access blocked for IP {ip}")
            return JSONResponse(
                status_code=403,
                content={"detail": f"IP {ip} is not whitelisted for admin access."},
            )

        return await call_next(request)
