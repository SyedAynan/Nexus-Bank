"""
Structured Request Logging Middleware
=====================================
Logs every request with timing, status code, and request ID
in structured JSON format for observability.
"""

import logging
import time
import uuid

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

from bank_system.core.security import decode_token

logger = logging.getLogger("nexa.access")


class RequestLoggerMiddleware(BaseHTTPMiddleware):
    """Log requests in structured format with timing and request IDs."""

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        request_id = str(uuid.uuid4())[:8]
        request.state.request_id = request_id

        user_info = None
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                payload = decode_token(token)
                username = payload.get("sub")
                role = payload.get("role")
                if username and role:
                    user_info = f"{username} [{role}]"
            except Exception:
                pass

        start = time.perf_counter()

        response = await call_next(request)

        elapsed_ms = round((time.perf_counter() - start) * 1000, 2)

        ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
        if not ip:
            ip = request.client.host if request.client else "unknown"

        logger.info(
            "request_completed",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status": response.status_code,
                "duration_ms": elapsed_ms,
                "client_ip": ip,
                "user_agent": request.headers.get("user-agent", ""),
                "user_auth": user_info or "anonymous",
            },
        )

        response.headers["X-Request-ID"] = request_id
        return response
