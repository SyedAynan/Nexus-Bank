"""
Forecasting Engine
==================
Lightweight, deterministic cash-flow and liquidity forecaster built on
top of the existing transaction history.

Implements:
    - Rolling 30 / 90 / 180 day projections
    - Simple default / churn probability heuristics

DSA usage:
    - Time-series style queues (implicitly via ordered transaction history)
    - Sliding window averages for projections
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any


class ForecastingEngine:
    def __init__(self, banking_service):
        self.bank = banking_service

    def get_cashflow_forecast(self, horizons: list[int] | None = None) -> dict[str, Any]:
        """
        Compute rolling net cash-flow projections for a set of horizons in days.
        """
        if horizons is None:
            horizons = [30, 90, 180]

        # Build per-day net cashflow over the last 180 days
        history_days = max(horizons)
        today = datetime.now().date()
        buckets = {today - timedelta(days=i): 0.0 for i in range(history_days)}

        all_txns = self.bank.get_all_recent_transactions(limit=1000)
        for t in all_txns:
            try:
                ts = datetime.fromisoformat(t["timestamp"]).date()
            except Exception:
                continue
            if ts not in buckets:
                continue
            amt = float(t.get("amount", 0.0))
            typ = t.get("type")
            # Credit / deposit positive, withdrawal / transfer negative
            if typ in ("deposit", "credit"):
                buckets[ts] += amt
            elif typ in ("withdrawal", "debit", "transfer"):
                buckets[ts] -= amt

        # Convert to ordered list (oldest -> newest)
        ordered_days = sorted(buckets.keys())
        flows = [buckets[d] for d in ordered_days]

        def moving_average(window: int) -> float:
            if not flows:
                return 0.0
            w = min(window, len(flows))
            segment = flows[-w:]
            return sum(segment) / max(1, len(segment))

        forecast = {}
        for h in horizons:
            ma = moving_average(min(h, len(flows)))
            forecast[str(h)] = round(ma * h, 2)

        # Simple probability heuristics
        loan_book = self.bank.get_pending_loans() + getattr(self.bank, "processed_loans", [])
        total_loans = sum(loan.get("amount", 0.0) for loan in loan_book) or 1.0
        overdue_like = sum(
            loan.get("amount", 0.0)
            for loan in loan_book
            if str(loan.get("status", "")).lower() in ("overdue", "defaulted")
        )
        default_prob = max(0.01, min(0.5, overdue_like / total_loans))

        accounts = self.bank.get_all_accounts()
        low_balance_accounts = [a for a in accounts if a.get("balance", 0.0) < 1000]
        churn_prob = max(0.01, min(0.4, len(low_balance_accounts) / max(1, len(accounts))))

        return {
            "cashflow_forecast": forecast,
            "default_probability": round(default_prob, 3),
            "churn_probability": round(churn_prob, 3),
        }
