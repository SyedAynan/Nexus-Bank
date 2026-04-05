"""
Security Tests — RBAC, Auth, and Access Control
"""

import pytest
from bank_system.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from bank_system.models.db_models import UserRole


class TestPasswordHashing:
    def test_hash_and_verify(self):
        password = "SecureP@ssw0rd!"
        hashed = hash_password(password)
        assert hashed != password
        assert verify_password(password, hashed) is True
        assert verify_password("wrong_password", hashed) is False

    def test_different_hashes(self):
        """Same password should produce different hashes (bcrypt salt)."""
        h1 = hash_password("test123")
        h2 = hash_password("test123")
        assert h1 != h2  # Different salts

    def test_empty_password(self):
        hashed = hash_password("")
        assert verify_password("", hashed) is True
        assert verify_password("notempty", hashed) is False


class TestJWTTokens:
    def test_create_and_decode_access_token(self):
        token = create_access_token("admin", extra={"role": "admin"})
        payload = decode_token(token)
        assert payload["sub"] == "admin"
        assert payload["type"] == "access"
        assert payload["role"] == "admin"

    def test_create_and_decode_refresh_token(self):
        token = create_refresh_token("user1", extra={"role": "user"})
        payload = decode_token(token)
        assert payload["sub"] == "user1"
        assert payload["type"] == "refresh"

    def test_invalid_token_raises(self):
        with pytest.raises(ValueError, match="Invalid token"):
            decode_token("invalid.token.here")

    def test_token_contains_expiry(self):
        token = create_access_token("user")
        payload = decode_token(token)
        assert "exp" in payload


class TestRBAC:
    def test_user_roles_exist(self):
        assert UserRole.admin.value == "admin"
        assert UserRole.analyst.value == "analyst"
        assert UserRole.user.value == "user"

    def test_role_comparison(self):
        assert UserRole.admin != UserRole.user
        assert UserRole("admin") == UserRole.admin
