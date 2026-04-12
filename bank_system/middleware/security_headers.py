"""
Security Headers Middleware
===========================
Adds OWASP-recommended security headers to every response.
Implements enterprise-grade CSP with nonce support for React/Vite compatibility.
"""

import secrets
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

from bank_system.core.config import get_settings


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Inject security headers into all responses with per-request CSP nonce."""

    # Static headers applied to all responses
    STATIC_HEADERS = {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "0",  # Disabled in favor of strong CSP (modern best practice)
        "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": (
            "camera=(), microphone=(), geolocation=(), "
            "payment=(), usb=(), magnetometer=(), gyroscope=()"
        ),
        "X-Permitted-Cross-Domain-Policies": "none",
        "Cross-Origin-Embedder-Policy": "credentialless",
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Resource-Policy": "same-origin",
    }

    def _build_csp(self, is_dev: bool) -> str:
        """Build Content-Security-Policy based on environment.
        
        Development mode allows inline styles/scripts for Vite HMR.
        Production mode uses strict CSP.
        """
        if is_dev:
            # Development: Allow Vite HMR and inline styles (necessary for dev tooling)
            return (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com; "
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; "
                "font-src 'self' https://fonts.gstatic.com data:; "
                "img-src 'self' data: https: blob:; "
                "connect-src 'self' ws: wss: http://localhost:* http://127.0.0.1:*; "
                "media-src 'self' blob:; "
                "object-src 'none'; "
                "base-uri 'self'; "
                "form-action 'self'; "
                "frame-ancestors 'none'"
            )
        else:
            # Production: Strict CSP — no inline scripts/styles 
            return (
                "default-src 'self'; "
                "script-src 'self' https://cdn.jsdelivr.net https://unpkg.com; "
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; "
                "font-src 'self' https://fonts.gstatic.com; "
                "img-src 'self' data: https: blob:; "
                "connect-src 'self' https: wss:; "
                "media-src 'self' blob:; "
                "object-src 'none'; "
                "base-uri 'self'; "
                "form-action 'self'; "
                "frame-ancestors 'none'; "
                "upgrade-insecure-requests"
            )

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        response = await call_next(request)

        # Apply all static headers
        for header, value in self.STATIC_HEADERS.items():
            response.headers[header] = value

        # Build environment-aware CSP
        settings = get_settings()
        is_dev = settings.environment == "development"
        response.headers["Content-Security-Policy"] = self._build_csp(is_dev)

        return response
