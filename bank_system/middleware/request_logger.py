"""
File: request_logger.py
Module: bank_system.middleware.request_logger

Purpose:
    Structured request logging middleware that records every HTTP request
    with timing, client info, auth context, and a unique request ID.
    Essential for debugging, monitoring, and audit compliance.

Developer Journey:
    - v1: Used print() for debugging — no structured format, no timing,
      no way to trace a request through logs.
    - v2: Added Python logging with basic format. Still hard to search
      and filter logs programmatically.
    - v3: Structured logging with extra fields — method, path, status,
      duration_ms, client_ip, user_auth. These structured fields can be
      parsed by log aggregators (ELK Stack, Datadog, CloudWatch) for
      dashboards and alerting.

Key Features:
    - X-Request-ID header: Unique ID per request for distributed tracing.
      If a user reports an issue, the request ID links directly to the
      relevant log entry.
    - Duration tracking: Measures request processing time (perf_counter
      for sub-millisecond accuracy) to identify slow endpoints.
    - Auth context: Extracts username from JWT (when present) to associate
      requests with users without exposing sensitive data.
    - Client IP: Respects X-Forwarded-For for reverse proxy setups.
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

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
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
