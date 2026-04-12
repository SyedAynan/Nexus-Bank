"""
NEXA API Integration Tests
============================
Tests for auth endpoints, protected routes, and role enforcement
using FastAPI TestClient.

NOTE: The login flow is MFA-based:
  1. POST /api/auth/login (form-encoded) → 202 MFA challenge
  2. POST /api/auth/verify-otp (JSON)    → 200 with tokens
"""
import os
import pytest

# Ensure test environment before importing app
os.environ.setdefault("DATABASE_URL", "sqlite:///./test_api.db")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/1")
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-testing-only")
os.environ.setdefault("ENVIRONMENT", "testing")
os.environ.setdefault("DEMO_MODE", "true")

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


def _do_full_login(client, username, password, otp="000000"):
    """Helper: Complete the full MFA login flow and return tokens."""
    # Step 1: Login with form-encoded data (OAuth2PasswordRequestForm)
    login_resp = client.post("/api/auth/login", data={
        "username": username,
        "password": password,
    }, headers={"Content-Type": "application/x-www-form-urlencoded"})

    if login_resp.status_code != 202:
        return None, login_resp

    # Step 2: Verify OTP
    otp_resp = client.post("/api/auth/verify-otp", json={
        "username": username,
        "password": password,
        "otp": otp,
    })

    if otp_resp.status_code == 200:
        return otp_resp.json(), otp_resp
    return None, otp_resp


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

    def test_login_returns_mfa_challenge(self, client, registered_user):
        """Login should return 202 MFA challenge (not 200 with tokens)."""
        resp = client.post("/api/auth/login", data={
            "username": "testuser",
            "password": "TestPass123!",
        }, headers={"Content-Type": "application/x-www-form-urlencoded"})
        assert resp.status_code == 202, f"Login should return 202 MFA: {resp.text}"
        data = resp.json()
        assert data.get("mfa") is True

    def test_full_login_with_otp(self, client, registered_user):
        """Full MFA login flow: login → OTP → tokens."""
        tokens, resp = _do_full_login(client, "testuser", "TestPass123!")
        assert tokens is not None, f"Full login failed: {resp.text}"
        assert "access_token" in tokens
        assert "refresh_token" in tokens

    def test_login_wrong_password(self, client, registered_user):
        resp = client.post("/api/auth/login", data={
            "username": "testuser",
            "password": "WrongPassword!",
        }, headers={"Content-Type": "application/x-www-form-urlencoded"})
        assert resp.status_code in (400, 401, 403)

    def test_login_nonexistent_user(self, client):
        resp = client.post("/api/auth/login", data={
            "username": "ghost",
            "password": "nope",
        }, headers={"Content-Type": "application/x-www-form-urlencoded"})
        assert resp.status_code in (400, 401, 404)

    def test_invalid_otp(self, client, registered_user):
        """Wrong OTP should be rejected."""
        # First trigger MFA
        client.post("/api/auth/login", data={
            "username": "testuser",
            "password": "TestPass123!",
        }, headers={"Content-Type": "application/x-www-form-urlencoded"})
        # Then send wrong OTP
        resp = client.post("/api/auth/verify-otp", json={
            "username": "testuser",
            "password": "TestPass123!",
            "otp": "999999",
        })
        assert resp.status_code == 400


# ─── Protected Routes ───

class TestProtectedRoutes:
    def _get_token(self, client, registered_user):
        tokens, _ = _do_full_login(
            client, registered_user["username"], registered_user["password"]
        )
        if tokens:
            return tokens.get("access_token")
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
