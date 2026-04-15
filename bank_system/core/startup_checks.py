"""
NEXA Startup Validation
========================
Validates critical environment configuration before the app starts.
Fails fast on missing or insecure secrets in production.
"""

import logging
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


def validate_environment() -> None:
    """Run critical checks before the application starts serving traffic."""
    settings = get_settings()
    errors: list[str] = []
    warnings: list[str] = []

    # ── Check SECRET_KEY ──
    if settings.secret_key in INSECURE_SECRETS:
        if settings.environment == "production":
            errors.append(
                "SECRET_KEY is set to a known insecure default. "
                "Set a unique, random 64+ character key for production."
            )
        elif settings.environment not in ("development", "testing"):
            warnings.append(
                "SECRET_KEY is a development default — change before deploying to production."
            )

    # ── Check DATABASE_URL ──
    if "localhost" in settings.database_url and settings.environment == "production":
        warnings.append("DATABASE_URL points to localhost in production mode.")

    # ── Check DEBUG flag ──
    if settings.debug and settings.environment == "production":
        errors.append("DEBUG=true in production mode. Set DEBUG=false.")

    # ── Report ──
    for w in warnings:
        logger.warning(f"⚠️  {w}")

    if errors:
        for e in errors:
            logger.critical(f"🚫 FATAL: {e}")
        logger.critical("Startup aborted due to configuration errors.")
        sys.exit(1)

    logger.info("✅ Environment validation passed.")
