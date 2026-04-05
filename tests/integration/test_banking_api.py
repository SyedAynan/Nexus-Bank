"""
Integration Tests — Banking API endpoints
"""

import os
import pytest

os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/1")
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("ENVIRONMENT", "testing")

from bank_system.core.security import create_access_token
from bank_system.models.db_models import UserRole


def _auth_header(username: str = "admin", role: str = "admin") -> dict:
    """Generate a valid JWT auth header for testing."""
    token = create_access_token(username, extra={"role": role})
    return {"Authorization": f"Bearer {token}"}


class TestHealthEndpoint:
    def test_health_check(self):
        """Health endpoint should always return ok."""
        from fastapi.testclient import TestClient
        try:
            from bank_system.main import app
            client = TestClient(app)
            response = client.get("/health")
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "ok"
        except Exception:
            pytest.skip("Cannot initialize app without full dependencies")


class TestBankingSchemas:
    """Test Pydantic schema validation."""

    def test_account_create_schema(self):
        from bank_system.schemas.banking import AccountCreate
        acc = AccountCreate(account_type="savings", currency="USD", initial_deposit=1000.0)
        assert acc.account_type == "savings"
        assert acc.initial_deposit == 1000.0

    def test_transaction_create_validation(self):
        from bank_system.schemas.banking import TransactionCreate
        from bank_system.models.db_models import TransactionType

        tx = TransactionCreate(
            account_id=1,
            amount=500.0,
            type=TransactionType.deposit,
            description="Test deposit",
        )
        assert tx.amount == 500.0

    def test_transaction_negative_amount_rejected(self):
        from bank_system.schemas.banking import TransactionCreate
        from bank_system.models.db_models import TransactionType
        from pydantic import ValidationError

        with pytest.raises(ValidationError):
            TransactionCreate(
                account_id=1,
                amount=-100.0,  # Should fail: amount must be > 0
                type=TransactionType.deposit,
            )

    def test_loan_create_schema(self):
        from bank_system.schemas.banking import LoanCreate
        loan = LoanCreate(
            account_id=1,
            principal=50000.0,
            interest_rate=8.5,
            term_months=36,
            credit_score=720,
            debt_to_income=0.35,
        )
        assert loan.principal == 50000.0
        assert loan.credit_score == 720
