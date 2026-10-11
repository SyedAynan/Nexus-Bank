"""
NEXA Notifications Integration Tests
=====================================
Tests for /api/notifications: user inbox, unread counts, mark-read,
admin create/broadcast/delete, and owner enforcement.

Users are created directly in the DB with MFA disabled so login
returns tokens immediately (no OTP step needed here).
"""
import os

# Ensure test environment before importing app
os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/1")
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-testing-only")
os.environ.setdefault("ENVIRONMENT", "testing")
os.environ.setdefault("DEMO_MODE", "true")

import pytest
from fastapi.testclient import TestClient

from bank_system.core.db import Base, SessionLocal, engine
from bank_system.core.security import hash_password, create_access_token
from bank_system.main import app
from bank_system.models.db_models import User, UserRole


@pytest.fixture()
def client():
    """Fresh tables per test with a TestClient."""
    Base.metadata.create_all(bind=engine)
    yield TestClient(app)
    Base.metadata.drop_all(bind=engine)


def _make_user(username: str, role: UserRole = UserRole.user) -> int:
    """Create a user directly in the DB (MFA disabled for direct login)."""
    db = SessionLocal()
    try:
        user = User(
            username=username,
            email=f"{username}@nexa.dev",
            hashed_password=hash_password("Pass123!"),
            role=role,
            mfa_enabled=False,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user.id
    finally:
        db.close()


def _auth(client: TestClient, username: str) -> dict:
    """Generate a valid JWT Authorization header for testing."""
    token = create_access_token(username)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def user_auth(client):
    _make_user("notif_user")
    return _auth(client, "notif_user")


@pytest.fixture()
def admin_auth(client):
    _make_user("notif_admin", UserRole.admin)
    return _auth(client, "notif_admin")


class TestInbox:
    def test_empty_inbox(self, client, user_auth):
        resp = client.get("/api/notifications/", headers=user_auth)
        assert resp.status_code == 200
        assert resp.json() == []

    def test_unread_count_empty(self, client, user_auth):
        resp = client.get("/api/notifications/count", headers=user_auth)
        assert resp.status_code == 200
        assert resp.json() == {"unread_count": 0}

    def test_requires_auth(self, client):
        assert client.get("/api/notifications/").status_code in (401, 403)
        assert client.get("/api/notifications/count").status_code in (401, 403)


class TestAdminCreate:
    def test_admin_create_for_user(self, client, admin_auth):
        user_id = _make_user("inbox_user")
        resp = client.post(
            "/api/notifications/",
            json={"title": "Hello", "message": "World", "type": "info", "user_id": user_id},
            headers=admin_auth,
        )
        assert resp.status_code == 201, resp.text
        assert resp.json()["user_id"] == user_id

    def test_user_sees_created_notification(self, client, admin_auth):
        user_id = _make_user("inbox_user2")
        client.post(
            "/api/notifications/",
            json={"title": "Deposit", "message": "+$10", "type": "transaction", "user_id": user_id},
            headers=admin_auth,
        )
        headers = _auth(client, "inbox_user2")
        inbox = client.get("/api/notifications/", headers=headers)
        assert inbox.status_code == 200
        items = inbox.json()
        assert len(items) == 1
        assert items[0]["title"] == "Deposit"
        assert items[0]["is_read"] is False
        count = client.get("/api/notifications/count", headers=headers)
        assert count.json() == {"unread_count": 1}

    def test_user_cannot_create(self, client, user_auth):
        resp = client.post(
            "/api/notifications/",
            json={"title": "x", "message": "y", "user_id": 1},
            headers=user_auth,
        )
        assert resp.status_code == 403

    def test_create_for_missing_user(self, client, admin_auth):
        resp = client.post(
            "/api/notifications/",
            json={"title": "x", "message": "y", "user_id": 99999},
            headers=admin_auth,
        )
        assert resp.status_code == 404


class TestBroadcast:
    def test_broadcast_reaches_all_users(self, client, admin_auth, user_auth):
        resp = client.post(
            "/api/notifications/",
            json={"title": "Announcement", "message": "Hi all", "type": "info"},
            headers=admin_auth,
        )
        assert resp.status_code == 201, resp.text
        for headers in (admin_auth, user_auth):
            inbox = client.get("/api/notifications/", headers=headers)
            assert any(n["title"] == "Announcement" for n in inbox.json())


class TestReadFlow:
    def _seed_one(self, client, admin_auth, username="reader_user"):
        user_id = _make_user(username)
        created = client.post(
            "/api/notifications/",
            json={"title": "T", "message": "M", "user_id": user_id},
            headers=admin_auth,
        )
        assert created.status_code == 201
        return created.json()["id"], _auth(client, username)

    def test_mark_read(self, client, admin_auth):
        notif_id, headers = self._seed_one(client, admin_auth)
        resp = client.patch(f"/api/notifications/{notif_id}/read", headers=headers)
        assert resp.status_code == 200
        count = client.get("/api/notifications/count", headers=headers)
        assert count.json() == {"unread_count": 0}

    def test_mark_all_read(self, client, admin_auth):
        user_id = _make_user("reader_user2")
        for i in range(3):
            client.post(
                "/api/notifications/",
                json={"title": f"T{i}", "message": "M", "user_id": user_id},
                headers=admin_auth,
            )
        headers = _auth(client, "reader_user2")
        resp = client.patch("/api/notifications/read-all", headers=headers)
        assert resp.status_code == 200, resp.text
        assert resp.json()["updated_count"] == 3
        count = client.get("/api/notifications/count", headers=headers)
        assert count.json() == {"unread_count": 0}

    def test_owner_enforcement(self, client, admin_auth, user_auth):
        notif_id, _ = self._seed_one(client, admin_auth, username="other_user")
        resp = client.get(f"/api/notifications/{notif_id}", headers=user_auth)
        assert resp.status_code == 403
        resp = client.patch(f"/api/notifications/{notif_id}/read", headers=user_auth)
        assert resp.status_code == 403

    def test_missing_notification(self, client, user_auth):
        assert client.get("/api/notifications/99999", headers=user_auth).status_code == 404


class TestAdminDelete:
    def test_delete(self, client, admin_auth):
        user_id = _make_user("doomed_user")
        created = client.post(
            "/api/notifications/",
            json={"title": "T", "message": "M", "user_id": user_id},
            headers=admin_auth,
        )
        notif_id = created.json()["id"]
        resp = client.delete(f"/api/notifications/{notif_id}", headers=admin_auth)
        assert resp.status_code == 200
        headers = _auth(client, "doomed_user")
        assert client.get(f"/api/notifications/{notif_id}", headers=headers).status_code == 404

    def test_user_cannot_delete(self, client, admin_auth, user_auth):
        user_id = _make_user("doomed_user2")
        created = client.post(
            "/api/notifications/",
            json={"title": "T", "message": "M", "user_id": user_id},
            headers=admin_auth,
        )
        resp = client.delete(f"/api/notifications/{created.json()['id']}", headers=user_auth)
        assert resp.status_code == 403
