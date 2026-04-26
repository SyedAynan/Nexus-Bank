"""
File: startup_checks.py
Module: bank_system.core.startup_checks

Purpose:
    Pre-flight validation that runs before the FastAPI app starts serving
    traffic. Detects misconfiguration (insecure secrets, debug mode in prod)
    and fails fast with clear error messages instead of subtle runtime bugs.

Developer Journey:
    - v1: No startup validation — the app started happily with SECRET_KEY="secret"
      in production. Tokens were trivially forgeable. Discovered this only
      after a security review.
    - v2: Added this module to check for known insecure defaults and
      environment mismatches. In production, the app now refuses to start
      if SECRET_KEY is a known default or if DEBUG=true.
    - v3: Loosened checks for Railway/Render PaaS deployments — SECRET_KEY
      auto-generation is acceptable (platform persists env vars), but SQLite
      on ephemeral filesystems is now detected as fatal.

Design Decision:
    Errors (fatal) vs Warnings (informational):
    - ERRORS cause sys.exit(1) — app refuses to start. Used for security-critical
      issues that would compromise the system if ignored.
    - WARNINGS are logged but don't block startup. Used for non-ideal but
      non-critical configurations (e.g., localhost DB URL in staging).

    This "fail-fast" approach is critical for production deployments because
    it's much better to fail at deployment time than to run with a security
    vulnerability that goes unnoticed.
"""

import logging
import os
import sys

from bank_system.core.config import get_settings

logger = logging.getLogger("nexa.startup")

# Default insecure secrets that MUST be changed in production
INSECURE_SECRETS = {
    "dev-only-change-in-production-kT9xM2vP7qR4wN6yB3fH8jL5sA0dC1eG",
    "change-this-in-production",
    "your-secret-key-here",
    "secret",
    "",
}

# Detect Render platform — ephemeral filesystem (SQLite = data loss)
_IS_RENDER = bool(os.environ.get("RENDER"))


def validate_environment() -> None:
    """Run critical checks before the application starts serving traffic.

    Render specific:
        - SQLite is FATAL on Render (ephemeral filesystem = data loss)
        - Auto-generated SECRET_KEY is acceptable (Render persists env vars)
        - DEMO_MODE is logged but not blocked (allows seeding on first deploy)
    """
    settings = get_settings()
    errors: list[str] = []
    warnings: list[str] = []

    is_paas = _IS_RENDER
    platform_name = "Render" if _IS_RENDER else "unknown"

    if is_paas:
        logger.info(f"🚀 Detected PaaS platform: {platform_name}")

    # ── Check SECRET_KEY ──
    if settings.secret_key in INSECURE_SECRETS:
        if settings.environment == "production":
            errors.append(
                "SECRET_KEY is set to a known insecure default. "
                "Set a unique, random 64+ character key for production. "
                "Generate with: openssl rand -base64 64"
            )
        elif settings.environment not in ("development", "testing"):
            warnings.append("SECRET_KEY is a development default — change before deploying to production.")

    # ── Check DATABASE_URL ──
    db_url = settings.database_url
    if db_url.startswith("sqlite"):
        if is_paas or settings.environment == "production":
            errors.append(
                f"DATABASE_URL is SQLite ({db_url}) but the filesystem is ephemeral on {platform_name}. "
                "All data will be LOST on every deploy. "
                "Set DATABASE_URL to a PostgreSQL connection string "
                "(Neon, Supabase, Railway PostgreSQL, or Render PostgreSQL)."
            )
    elif "localhost" in db_url and settings.environment == "production":
        warnings.append("DATABASE_URL points to localhost in production mode.")

    # ── Check DEBUG flag ──
    if settings.debug and settings.environment == "production":
        # Downgrade to warning on PaaS (common misconfiguration, not security-critical on its own)
        if is_paas:
            warnings.append(
                "DEBUG=true in production mode on " + platform_name + ". "
                "Set DEBUG=false in environment variables."
            )
        else:
            errors.append("DEBUG=true in production mode. Set DEBUG=false.")

    # ── Check FRONTEND_URL for CORS ──
    frontend_url = os.environ.get("FRONTEND_URL", "").strip()
    if settings.environment == "production" and not frontend_url:
        warnings.append(
            "FRONTEND_URL is not set. CORS will only allow localhost origins. "
            "Set FRONTEND_URL to your Vercel deployment URL for cross-origin support."
        )

    # ── Report ──
    for w in warnings:
        logger.warning(f"⚠️  {w}")

    if errors:
        for e in errors:
            logger.critical(f"🚫 FATAL: {e}")
        logger.critical("Startup aborted due to configuration errors.")
        sys.exit(1)

    logger.info("✅ Environment validation passed.")

