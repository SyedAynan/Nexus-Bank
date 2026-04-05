"""
NEXA API Integration Tests
============================
Tests for auth endpoints, protected routes, and role enforcement
using FastAPI TestClient.
"""
import os
import pytest

# Ensure test environment before importing app
os.environ.setdefault("DATABASE_URL", "sqlite:///./test_api.db")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/1")
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-testing-only")
os.environ.setdefault("ENVIRONMENT", "testing")

from fastapi.testclient import TestClient
from bank_system.main import app
from bank_system.core.db import Base, engine


@pytest.fixture(autouse=True)
def setup_db():
    """Create test tables, drop after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def registered_user(client):
    """Register a user and return credentials."""
    resp = client.post("/api/auth/register", json={
        "username": "testuser",
        "email": "test@nexa.dev",
        "password": "TestPass123!",
    })
    return {"username": "testuser", "password": "TestPass123!", "response": resp}


# ─── Health Check ───

class TestHealth:
    def test_healthcheck(self, client):
        resp = client.get("/api/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data.get("status") == "healthy" or "status" in data


# ─── Auth Endpoints ───

class TestAuth:
    def test_register_success(self, client):
        resp = client.post("/api/auth/register", json={
            "username": "newuser",
            "email": "new@nexa.dev",
            "password": "StrongPass1!",
        })
        # Should be 200 or 201
        assert resp.status_code in (200, 201), f"Registration failed: {resp.text}"

    def test_register_duplicate(self, client, registered_user):
        resp = client.post("/api/auth/register", json={
            "username": "testuser",
            "email": "test@nexa.dev",
            "password": "TestPass123!",
        })
        # Should reject duplicate
        assert resp.status_code in (400, 409, 422), f"Duplicate registration should fail: {resp.text}"

    def test_login_success(self, client, registered_user):
        resp = client.post("/api/auth/login", json={
            "username": "testuser",
            "password": "TestPass123!",
        })
        assert resp.status_code == 200, f"Login failed: {resp.text}"
        data = resp.json()
        assert "access_token" in data

    def test_login_wrong_password(self, client, registered_user):
        resp = client.post("/api/auth/login", json={
            "username": "testuser",
            "password": "WrongPassword!",
        })
        assert resp.status_code in (400, 401, 403)

    def test_login_nonexistent_user(self, client):
        resp = client.post("/api/auth/login", json={
            "username": "ghost",
            "password": "nope",
        })
        assert resp.status_code in (400, 401, 404)


# ─── Protected Routes ───

class TestProtectedRoutes:
    def _get_token(self, client, registered_user):
        resp = client.post("/api/auth/login", json={
            "username": registered_user["username"],
            "password": registered_user["password"],
        })
        if resp.status_code == 200:
            return resp.json().get("access_token")
        return None

    def test_accounts_without_token(self, client):
        resp = client.get("/api/banking/accounts")
        assert resp.status_code in (401, 403)

    def test_accounts_with_token(self, client, registered_user):
        token = self._get_token(client, registered_user)
        if not token:
            pytest.skip("Could not obtain token")
        resp = client.get("/api/banking/accounts",
                          headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200

    def test_admin_route_as_user(self, client, registered_user):
        token = self._get_token(client, registered_user)
        if not token:
            pytest.skip("Could not obtain token")
        resp = client.get("/api/admin/users",
                          headers={"Authorization": f"Bearer {token}"})
        # Regular user should be denied admin routes
        assert resp.status_code in (401, 403)

    def test_expired_token(self, client):
        fake_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZXhwIjoxfQ.invalid"
        resp = client.get("/api/banking/accounts",
                          headers={"Authorization": f"Bearer {fake_token}"})
        assert resp.status_code in (401, 403)
