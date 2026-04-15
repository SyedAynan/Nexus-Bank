"""
NEXA Bill Pay Service — Scheduled Payments + Recurring Transfers
Manages scheduled and recurring payment configurations.
"""

import logging
import time
from typing import Any

logger = logging.getLogger(__name__)


class BillPayService:
    """Scheduled payments and recurring transfer management."""

    def __init__(self):
        self._scheduled: list[dict] = []
        self._payees: list[dict] = [
            {
                "id": "payee-001",
                "name": "Electricity Company",
                "category": "utilities",
                "account": "UTIL-001",
                "logo": "⚡",
            },
            {
                "id": "payee-002",
                "name": "Water Authority",
                "category": "utilities",
                "account": "UTIL-002",
                "logo": "💧",
            },
            {
                "id": "payee-003",
                "name": "Internet Provider",
                "category": "telecom",
                "account": "TEL-001",
                "logo": "🌐",
            },
            {
                "id": "payee-004",
                "name": "Mobile Carrier",
                "category": "telecom",
                "account": "TEL-002",
                "logo": "📱",
            },
            {
                "id": "payee-005",
                "name": "Property Insurance",
                "category": "insurance",
                "account": "INS-001",
                "logo": "🏠",
            },
            {
                "id": "payee-006",
                "name": "Auto Insurance",
                "category": "insurance",
                "account": "INS-002",
                "logo": "🚗",
            },
            {
                "id": "payee-007",
                "name": "Credit Card Payment",
                "category": "finance",
                "account": "CC-001",
                "logo": "💳",
            },
            {
                "id": "payee-008",
                "name": "Gym Membership",
                "category": "lifestyle",
                "account": "GYM-001",
                "logo": "🏋️",
            },
        ]
        self._seed_demo()
        logger.info(f"BillPay: {len(self._scheduled)} scheduled payments initialized")

    def _seed_demo(self):
        """Seed demo scheduled payments."""
        now = time.time()
        self._scheduled = [
            {
                "id": "bill-001",
                "payee_id": "payee-001",
                "payee_name": "Electricity Company",
                "amount": 142.50,
                "frequency": "monthly",
                "next_date": "2026-03-15",
                "status": "active",
                "auto_pay": True,
                "created_at": now - 86400 * 30,
                "category": "utilities",
                "logo": "⚡",
                "last_paid": "2026-02-15",
                "total_paid": 1710.00,
            },
            {
                "id": "bill-002",
                "payee_id": "payee-003",
                "payee_name": "Internet Provider",
                "amount": 79.99,
                "frequency": "monthly",
                "next_date": "2026-03-01",
                "status": "active",
                "auto_pay": True,
                "created_at": now - 86400 * 60,
                "category": "telecom",
                "logo": "🌐",
                "last_paid": "2026-02-01",
                "total_paid": 959.88,
            },
            {
                "id": "bill-003",
                "payee_id": "payee-007",
                "payee_name": "Credit Card Payment",
                "amount": 500.00,
                "frequency": "monthly",
                "next_date": "2026-03-20",
                "status": "active",
                "auto_pay": False,
                "created_at": now - 86400 * 90,
                "category": "finance",
                "logo": "💳",
                "last_paid": "2026-02-20",
                "total_paid": 6000.00,
            },
            {
                "id": "bill-004",
                "payee_id": "payee-005",
                "payee_name": "Property Insurance",
                "amount": 245.00,
                "frequency": "quarterly",
                "next_date": "2026-04-01",
                "status": "active",
                "auto_pay": True,
                "created_at": now - 86400 * 120,
                "category": "insurance",
                "logo": "🏠",
                "last_paid": "2026-01-01",
                "total_paid": 980.00,
            },
        ]

    def get_payees(self) -> list[dict]:
        return self._payees

    def get_scheduled_payments(self, status: str | None = None) -> list[dict]:
        if status:
            return [p for p in self._scheduled if p["status"] == status]
        return self._scheduled

    def create_scheduled_payment(self, data: dict) -> dict:
        payment = {
            "id": f"bill-{int(time.time())}",
            "payee_id": data.get("payee_id", ""),
            "payee_name": data.get("payee_name", ""),
            "amount": data.get("amount", 0),
            "frequency": data.get("frequency", "monthly"),
            "next_date": data.get("next_date", ""),
            "status": "active",
            "auto_pay": data.get("auto_pay", False),
            "created_at": time.time(),
            "category": data.get("category", "other"),
            "logo": data.get("logo", "📄"),
            "last_paid": None,
            "total_paid": 0,
        }
        self._scheduled.append(payment)
        return payment

    def cancel_payment(self, payment_id: str) -> bool:
        for p in self._scheduled:
            if p["id"] == payment_id:
                p["status"] = "cancelled"
                return True
        return False

    def pause_payment(self, payment_id: str) -> bool:
        for p in self._scheduled:
            if p["id"] == payment_id:
                p["status"] = "paused"
                return True
        return False

    def resume_payment(self, payment_id: str) -> bool:
        for p in self._scheduled:
            if p["id"] == payment_id and p["status"] == "paused":
                p["status"] = "active"
                return True
        return False

    def get_summary(self) -> dict[str, Any]:
        active = [p for p in self._scheduled if p["status"] == "active"]
        return {
            "total_scheduled": len(self._scheduled),
            "active": len(active),
            "monthly_total": sum(
                p["amount"] for p in active if p["frequency"] == "monthly"
            ),
            "total_paid_all_time": sum(p.get("total_paid", 0) for p in self._scheduled),
            "auto_pay_count": sum(1 for p in active if p.get("auto_pay")),
            "categories": list(set(p.get("category", "other") for p in active)),
        }


# Singleton
billpay_service = BillPayService()
