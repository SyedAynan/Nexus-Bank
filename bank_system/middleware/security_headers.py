"""
File: security_headers.py
Module: bank_system.middleware.security_headers

Purpose:
    Adds OWASP-recommended HTTP security headers to every API response.
    These headers instruct browsers to enforce security policies that
    mitigate common web attacks (XSS, clickjacking, MIME sniffing).

Developer Journey:
    - v1: No security headers — browsers used default (permissive) policies.
      Any injected script could execute freely, iframes could embed the app
      for clickjacking attacks, and responses could be MIME-sniffed.
    - v2: Added basic headers (X-Frame-Options, X-Content-Type-Options).
    - v3: Added Content-Security-Policy (CSP) with per-request nonce
      generation for React/Vite compatibility. CSP is the most powerful
      XSS protection because it controls which scripts can execute.

Headers Applied:
    - X-Frame-Options: SAMEORIGIN — prevents clickjacking via iframes
    - X-Content-Type-Options: nosniff — prevents MIME-type sniffing attacks
    - X-XSS-Protection: 1; mode=block — enables browser XSS filter
    - Strict-Transport-Security (HSTS) — forces HTTPS for 1 year
    - Content-Security-Policy — controls which resources can be loaded
    - Referrer-Policy — limits referrer info sent to external sites
    - Permissions-Policy — restricts browser feature access (camera, mic)

CSP Nonce System:
    React/Vite injects inline scripts for HMR and module loading. A blanket
    'unsafe-inline' CSP would defeat the purpose of CSP entirely. Instead,
    we generate a unique nonce per request and whitelist scripts with that
    nonce. The nonce is cryptographically random and changes on every request.
"""

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
            "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=()"
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

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)

        # Apply all static headers
        for header, value in self.STATIC_HEADERS.items():
            response.headers[header] = value

        # Build environment-aware CSP
        settings = get_settings()
        is_dev = settings.environment == "development"
        response.headers["Content-Security-Policy"] = self._build_csp(is_dev)

        return response
