"""
Test configuration and fixtures for NEXA test suite.
"""

import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Override env before importing app modules
os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/1")
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-testing-only")
os.environ.setdefault("ENVIRONMENT", "testing")

from bank_system.core.db import Base
from bank_system.models.db_models import User, Account, UserRole
from bank_system.core.security import hash_password


# Test database engine (SQLite for fast unit tests)
TEST_DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./test.db")
test_engine = create_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(autouse=True)
def setup_test_db():
    """Create tables before each test, drop after."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db_session():
    """Provide a transactional database session for tests."""
    session = TestSessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture
def admin_user(db_session):
    """Create and return an admin user."""
    user = User(
        username="test_admin",
        email="admin@test.com",
        hashed_password=hash_password("admin123"),
        role=UserRole.admin,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def regular_user(db_session):
    """Create and return a regular user."""
    user = User(
        username="test_user",
        email="user@test.com",
        hashed_password=hash_password("user123"),
        role=UserRole.user,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_account(db_session, admin_user):
    """Create and return a test bank account."""
    acc = Account(
        account_number="NB-TEST-001",
        owner_id=admin_user.id,
        account_type="savings",
        balance=10000.0,
        currency="USD",
    )
    db_session.add(acc)
    db_session.commit()
    db_session.refresh(acc)
    return acc
