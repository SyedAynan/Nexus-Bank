from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "NEXA — Beyond Fintech"
    environment: str = Field(default="development")
    debug: bool = Field(default=True)

    # Database
    database_url: str = Field(default="postgresql+psycopg2://nexa:nexa@db:5432/nexa")

    # Redis
    redis_url: str = Field(default="redis://redis:6379/0")

    # Security
    secret_key: str = Field(default="change-this-in-production")
    access_token_expires_minutes: int = 30
    refresh_token_expires_minutes: int = 60 * 24 * 7
    jwt_algorithm: str = "HS256"

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
