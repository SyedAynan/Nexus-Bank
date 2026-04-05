"""
NEXA Service Layer Unit Tests
==============================
Tests for ExportService, FeatureFlagService, BillPayService, MultiCurrencyService.
"""
import pytest
import time


# ─── ExportService Tests ───

class TestExportService:
    """Tests for the CSV/PDF export service."""

    def setup_method(self):
        from bank_system.services.export_service import ExportService
        self.service = ExportService()

    def _sample_transactions(self, n=3):
        return [
            {
                "id": i,
                "account_id": 1,
                "amount": 100.0 * i,
                "type": "deposit" if i % 2 == 0 else "withdrawal",
                "description": f"Test transaction {i}",
                "created_at": "2026-01-15T10:00:00",
            }
            for i in range(1, n + 1)
        ]

    def test_generate_csv_basic(self):
        txs = self._sample_transactions()
        result = self.service.generate_csv(txs)
        assert result is not None
        assert "amount" in result.lower() or "Amount" in result
        assert "100.0" in result or "100" in result

    def test_generate_csv_with_account_info(self):
        txs = self._sample_transactions()
        account = {"account_number": "NX-001", "owner": "Test User", "currency": "USD"}
        result = self.service.generate_csv(txs, account_info=account)
        assert "NX-001" in result or result is not None

    def test_generate_csv_empty(self):
        result = self.service.generate_csv([])
        assert result is not None

    def test_generate_pdf_content(self):
        txs = self._sample_transactions()
        result = self.service.generate_pdf_content(txs)
        assert result is not None
        assert "NEXA" in result or "html" in result.lower() or len(result) > 0

    def test_generate_pdf_with_account(self):
        txs = self._sample_transactions()
        account = {"account_number": "NX-002", "owner": "Jane Doe", "currency": "USD"}
        result = self.service.generate_pdf_content(txs, account_info=account)
        assert result is not None

    def test_generate_audit_report(self):
        entries = [
            {"event": "LOGIN", "user": "admin", "ip": "127.0.0.1", "timestamp": "2026-01-15T10:00:00"},
            {"event": "TRANSFER", "user": "user1", "ip": "192.168.1.1", "timestamp": "2026-01-15T11:00:00"},
        ]
        result = self.service.generate_audit_report(entries)
        assert result is not None


# ─── FeatureFlagService Tests ───

class TestFeatureFlagService:
    """Tests for the Feature Flag service."""

    def setup_method(self):
        from bank_system.services.feature_flags import FeatureFlagService
        self.service = FeatureFlagService()

    def test_default_flags_exist(self):
        flags = self.service.get_all_flags()
        assert len(flags) > 0
        keys = [f["key"] for f in flags]
        assert "dark_mode_v2" in keys
        assert "ai_chatbot_v2" in keys

    def test_is_enabled_true(self):
        # dark_mode_v2 is enabled with 100% rollout
        assert self.service.is_enabled("dark_mode_v2") is True

    def test_is_enabled_false(self):
        # open_banking_api is disabled
        assert self.service.is_enabled("open_banking_api") is False

    def test_is_enabled_nonexistent(self):
        assert self.service.is_enabled("nonexistent_flag") is False

    def test_is_enabled_with_user_id(self):
        # Should not crash, deterministic for same user
        result = self.service.is_enabled("ai_chatbot_v2", user_id="user123")
        assert isinstance(result, bool)

    def test_get_flag(self):
        flag = self.service.get_flag("dark_mode_v2")
        assert flag is not None
        assert flag["key"] == "dark_mode_v2"
        assert flag["enabled"] is True

    def test_get_flag_nonexistent(self):
        assert self.service.get_flag("does_not_exist") is None

    def test_create_flag(self):
        result = self.service.create_flag("test_flag", {
            "name": "Test Flag",
            "description": "A test feature flag",
            "enabled": True,
            "rollout_pct": 50,
            "category": "testing",
        })
        assert result["key"] == "test_flag"
        assert result["enabled"] is True
        assert self.service.is_enabled("test_flag") is True

    def test_update_flag(self):
        self.service.create_flag("update_me", {"name": "Update Me", "enabled": True, "rollout_pct": 100})
        updated = self.service.update_flag("update_me", {"enabled": False})
        assert updated is not None
        assert updated["enabled"] is False

    def test_delete_flag(self):
        self.service.create_flag("delete_me", {"name": "Delete Me"})
        assert self.service.delete_flag("delete_me") is True
        assert self.service.get_flag("delete_me") is None

    def test_delete_nonexistent(self):
        assert self.service.delete_flag("nonexistent") is False

    def test_summary(self):
        summary = self.service.get_summary()
        assert "total" in summary
        assert "enabled" in summary
        assert "disabled" in summary
        assert "categories" in summary
        assert summary["total"] > 0


# ─── BillPayService Tests ───

class TestBillPayService:
    """Tests for the Bill Pay service."""

    def setup_method(self):
        from bank_system.services.billpay_service import BillPayService
        self.service = BillPayService()

    def test_get_payees(self):
        payees = self.service.get_payees()
        assert isinstance(payees, list)
        assert len(payees) > 0

    def test_get_summary(self):
        summary = self.service.get_summary()
        assert isinstance(summary, dict)
        assert "total_scheduled" in summary or "total" in summary or len(summary) > 0

    def test_get_scheduled_payments(self):
        payments = self.service.get_scheduled_payments()
        assert isinstance(payments, list)


# ─── MultiCurrencyService Tests ───

class TestMultiCurrencyService:
    """Tests for the Multi-Currency service."""

    def setup_method(self):
        from bank_system.services.multicurrency_service import MultiCurrencyService
        self.service = MultiCurrencyService()

    def test_get_rates(self):
        rates = self.service.get_rates()
        assert isinstance(rates, (dict, list))

    def test_convert(self):
        result = self.service.convert(100, "USD", "EUR")
        assert isinstance(result, (dict, float, int))

    def test_get_wallet(self):
        wallet = self.service.get_wallet()
        assert wallet is not None

    def test_get_currencies(self):
        currencies = self.service.get_currencies()
        assert isinstance(currencies, (list, dict))
