import secrets
from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings


def _generate_secret_key() -> str:
    """Generate a cryptographically secure random key for development.
    In production, SECRET_KEY MUST be set via environment variable."""
    return secrets.token_urlsafe(64)


class Settings(BaseSettings):
    app_name: str = "NEXA — Beyond Fintech"
    environment: str = Field(default="development")
    debug: bool = Field(default=True)

    # Database
    database_url: str = Field(default="postgresql+psycopg2://nexa:nexa@db:5432/nexa")

    # Redis
    redis_url: str = Field(default="redis://redis:6379/0")

    # Security — NEVER use a static default in production
    secret_key: str = Field(default_factory=_generate_secret_key)
    access_token_expires_minutes: int = 30
    refresh_token_expires_minutes: int = 60 * 24 * 7
    jwt_algorithm: str = "HS256"

    # RS256 asymmetric JWT (optional — for production use)
    jwt_private_key_path: str = Field(default="")
    jwt_public_key_path: str = Field(default="")

    # Rate Limiting
    rate_limit_per_minute: int = Field(default=100)
    rate_limit_burst: int = Field(default=20)

    # Event Bus / Kafka (future)
    kafka_bootstrap_servers: str = Field(default="")
    event_bus_mode: str = Field(default="in-process")  # in-process | kafka

    # Neo4j (future — AML graph persistence)
    neo4j_uri: str = Field(default="")
    neo4j_user: str = Field(default="neo4j")
    neo4j_password: str = Field(default="")

    # ML Fraud Engine
    ml_model_dir: str = Field(default="bank_system/ml_models")
    fraud_ensemble_weights: str = Field(default="0.35,0.35,0.30")

    # Simulation
    simulation_tick_seconds: int = 5

    # Deployment
    frontend_url: str = Field(default="")
    demo_mode: bool = Field(default=False)

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
