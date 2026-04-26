"""
File: config.py
Module: bank_system.core.config

Purpose:
    Centralized configuration management for the entire NEXA platform.
    All environment-specific settings (database URLs, JWT secrets, rate limits)
    are loaded from environment variables via pydantic-settings, with sensible
    defaults for local development.

Developer Journey:
    - v1: Started with hardcoded values scattered across files.
    - v2: Moved to python-dotenv for .env loading — simple but unvalidated.
    - v3: Migrated to pydantic-settings (BaseSettings) for type-safe, validated
      configuration with automatic env var binding. This was a major improvement
      because pydantic catches misconfiguration at startup rather than at runtime.
    - v4: Added RS256 key paths and Kafka config placeholders for future
      production upgrades (asymmetric JWT + event-driven architecture).

Production Notes:
    - SECRET_KEY MUST be set via env var in production. The default_factory generates
      a random key for development, but this means sessions break on restarts.
    - DATABASE_URL should point to PostgreSQL in production. SQLite was used
      initially for rapid prototyping but lacks concurrent write support.
"""

import secrets
from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings


def _generate_secret_key() -> str:
    """Generate a cryptographically secure random key for development.

    In production, SECRET_KEY MUST be set via environment variable.
    Using a generated key means all JWTs become invalid on server restart,
    which is acceptable for local development but not for production.

    Security Note:
        Initially used a static default like "my-secret-key" — this is a critical
        vulnerability. Switched to secrets.token_urlsafe() to prevent accidental
        use of weak keys in any environment.
    """
    return secrets.token_urlsafe(64)


class Settings(BaseSettings):
    """Application configuration loaded from environment variables.

    How it works:
        pydantic-settings automatically maps env vars to fields by name.
        For example, DATABASE_URL env var → database_url field.
        The .env file is loaded as a fallback when env vars aren't set.

    Learning Note:
        Initially used os.getenv() everywhere — fragile and unvalidated.
        pydantic-settings validates types at startup, catching misconfig early.
    """

    app_name: str = "NEXA — Beyond Fintech"
    environment: str = Field(default="development")
    debug: bool = Field(default=True)

    # ── Database ──
    # Evolution: SQLite (prototype) → PostgreSQL (production)
    # PostgreSQL is required for: row locking (SELECT FOR UPDATE), concurrent
    # writes, proper ACID transactions, and production reliability.
    database_url: str = Field(default="postgresql+psycopg2://nexa:nexa@db:5432/nexa")

    # ── Redis ──
    # Used for: OTP storage, rate limiting, session tracking, live user count.
    # Falls back to in-memory FakeRedis when unavailable (dev convenience).
    redis_url: str = Field(default="redis://redis:6379/0")

    # ── JWT Security ──
    # NEVER use a static default in production — tokens would be forgeable.
    # Issue faced: "Invalid credentials" errors traced to SECRET_KEY mismatch
    # between backend restarts (because generated keys are ephemeral).
    secret_key: str = Field(default_factory=_generate_secret_key)
    access_token_expires_minutes: int = 30
    refresh_token_expires_minutes: int = 60 * 24 * 7  # 7 days

    # HS256 is symmetric (same key for sign + verify). Fine for monoliths.
    # RS256 is asymmetric (private key signs, public key verifies) — needed
    # when multiple services need to verify tokens independently.
    jwt_algorithm: str = "HS256"

    # RS256 asymmetric JWT (optional — for microservice production use)
    jwt_private_key_path: str = Field(default="")
    jwt_public_key_path: str = Field(default="")

    # ── Rate Limiting ──
    # Sliding window rate limiter backed by Redis sorted sets.
    # Initially had no rate limiting — added after learning about brute-force attacks.
    rate_limit_per_minute: int = Field(default=100)
    rate_limit_burst: int = Field(default=20)

    # ── Event Bus / Kafka (future architecture) ──
    # Currently "in-process" — events are dispatched synchronously.
    # Designed for drop-in replacement with Apache Kafka for horizontal scaling.
    kafka_bootstrap_servers: str = Field(default="")
    event_bus_mode: str = Field(default="in-process")  # in-process | kafka

    # ── Neo4j (future — AML graph persistence) ──
    # Anti-Money Laundering requires graph traversal to detect circular fund flows.
    neo4j_uri: str = Field(default="")
    neo4j_user: str = Field(default="neo4j")
    neo4j_password: str = Field(default="")

    # ── ML Fraud Engine ──
    # Ensemble of 3 models: Isolation Forest, Random Forest, rule-based scorer.
    ml_model_dir: str = Field(default="bank_system/ml_models")
    fraud_ensemble_weights: str = Field(default="0.35,0.35,0.30")

    # Simulation
    simulation_tick_seconds: int = 5

    # ── Deployment ──
    # FRONTEND_URL is used for CORS origin whitelist.
    # Issue faced: CORS errors in production because frontend URL wasn't set.
    frontend_url: str = Field(default="")
    demo_mode: bool = Field(default=False)

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return cached Settings singleton.

    Uses @lru_cache so the .env file is only read once per process lifetime.
    This is important because pydantic-settings reads and validates all env
    vars on every Settings() call — caching avoids repeated I/O.
    """
    return Settings()
