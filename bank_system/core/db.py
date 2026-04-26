"""
File: db.py
Module: bank_system.core.db

Purpose:
    Database engine and session factory for SQLAlchemy ORM.
    Provides the database connection pool, session lifecycle management,
    and the declarative Base class that all ORM models inherit from.

Developer Journey:
    - v1: Used raw SQL queries with sqlite3 — error-prone and no ORM.
    - v2: Migrated to SQLAlchemy ORM for type-safe models and relationships.
      Initially used a single global session — caused threading issues.
    - v3: Implemented proper session factory with sessionmaker() and the
      get_db() dependency injection pattern recommended by FastAPI docs.
    - v4: Added connection pooling (pool_size, max_overflow) for PostgreSQL
      production performance. SQLite doesn't support pooling, so we
      conditionally configure based on the database URL.

Production Notes:
    - pool_pre_ping=True ensures stale connections are detected and replaced,
      preventing "connection closed" errors after database restarts.
    - pool_recycle=3600 rotates connections hourly to avoid firewall/proxy
      timeout issues common in cloud deployments (e.g., AWS RDS, Render).

Issue Faced:
    SQLite's "check_same_thread=False" is required for FastAPI because the
    ASGI server may access the DB from different threads. However, SQLite
    doesn't support concurrent writes — this caused data corruption in
    early testing with multiple users. PostgreSQL solved this completely.
"""

from contextlib import contextmanager

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from .config import get_settings

settings = get_settings()

# ── Engine Configuration ──
# These kwargs are passed to create_engine(). PostgreSQL and SQLite need
# different configurations for connection pooling and threading.
engine_kwargs = {
    # pool_pre_ping sends a lightweight "SELECT 1" before each checkout
    # to verify the connection is still alive. Prevents "broken pipe" errors.
    "pool_pre_ping": True,
    "future": True,  # Use SQLAlchemy 2.0 style engine
}

# SQLite does not support connection pool tuning — it's a file-based DB.
# PostgreSQL supports proper pooling for concurrent access.
if not settings.database_url.startswith("sqlite"):
    engine_kwargs.update(
        {
            "pool_size": 10,       # Maintain 10 persistent connections
            "max_overflow": 20,    # Allow 20 additional connections under load
            "pool_recycle": 3600,  # Recycle connections every hour
            "pool_timeout": 30,    # Wait max 30s for a connection from the pool
        }
    )
else:
    # SQLite-specific: allow multi-threaded access (required for FastAPI's ASGI server)
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(settings.database_url, **engine_kwargs)

# ── Session Factory ──
# sessionmaker creates a factory that produces new Session objects.
# autocommit=False: We explicitly call commit() — prevents accidental data loss.
# autoflush=False: We control when SQLAlchemy flushes to DB — better for batching.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)

# ── Declarative Base ──
# All ORM models inherit from this Base class. SQLAlchemy uses it to track
# which models exist and generate CREATE TABLE statements.
Base = declarative_base()


def get_db() -> Session:
    """FastAPI dependency that provides a database session per request.

    How it works:
        FastAPI calls this generator for each request that needs a DB session.
        The `yield` pauses execution, giving the route handler the session.
        After the response is sent (or an error occurs), `finally` closes it.

    Why this pattern:
        - Ensures every request gets a fresh session (no shared state)
        - Guarantees cleanup even if the route handler raises an exception
        - Works with FastAPI's Depends() injection system

    Learning Note:
        Initially used a global session instance shared across all requests.
        This caused "Session is closed" errors under concurrent load because
        one request would close the session while another was still using it.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def session_scope() -> Session:
    """Context manager for non-FastAPI code (scripts, background tasks).

    Provides automatic commit/rollback semantics:
        - Commits on success
        - Rolls back on exception
        - Always closes the session

    Usage:
        with session_scope() as db:
            db.add(User(...))
            # auto-commits on exit, auto-rolls-back on exception
    """
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
