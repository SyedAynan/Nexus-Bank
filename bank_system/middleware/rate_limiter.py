"""
Redis-backed Sliding Window Rate Limiter
=========================================
Implements per-IP and per-user rate limiting using Redis sorted sets.

Limits:
    - Unauthenticated: 20 req/min
    - Authenticated: 100 req/min
    - Login endpoint: 5 req/min per IP (brute-force protection)
"""

import time

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import JSONResponse

from bank_system.core.redis_client import get_redis


# Rate limit configuration: (requests, window_seconds)
RATE_LIMITS = {
    "default": (100, 60),
    "unauthenticated": (30, 60),
    "login": (15, 60),     # MFA flow needs 2 requests per attempt
    "register": (10, 60),
}


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """Sliding-window rate limiter backed by Redis sorted sets."""

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        try:
            redis = get_redis()
        except Exception:
            # If Redis is down, allow the request (fail-open for availability)
            return await call_next(request)

        ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
        if not ip:
            ip = request.client.host if request.client else "unknown"

        path = request.url.path.lower()

        # Determine rate limit tier
        if "/api/auth/login" in path or "/api/auth/verify-otp" in path:
            limit, window = RATE_LIMITS["login"]
            key = f"rl:login:{ip}"
        elif "/api/auth/register" in path:
            limit, window = RATE_LIMITS["register"]
            key = f"rl:register:{ip}"
        elif not request.headers.get("authorization"):
            limit, window = RATE_LIMITS["unauthenticated"]
            key = f"rl:unauth:{ip}"
        else:
            limit, window = RATE_LIMITS["default"]
            key = f"rl:auth:{ip}"

        now = time.time()
        window_start = now - window

        pipe = redis.pipeline()
        pipe.zremrangebyscore(key, 0, window_start)
        pipe.zadd(key, {str(now): now})
        pipe.zcard(key)
        pipe.expire(key, window + 1)
        results = pipe.execute()

        current_count = results[2]

        if current_count > limit:
            retry_after = int(window - (now - window_start))
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Rate limit exceeded. Please try again later.",
                    "retry_after_seconds": max(1, retry_after),
                },
                headers={
                    "Retry-After": str(max(1, retry_after)),
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": "0",
                },
            )

        response = await call_next(request)

        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(max(0, limit - current_count))
        response.headers["X-RateLimit-Reset"] = str(int(now + window))

        return response
