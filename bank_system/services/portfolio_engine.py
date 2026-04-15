"""
Portfolio Aggregation Engine
============================
Simulated multi-asset portfolio layer built entirely in Python.

Since the core system is banking-first (accounts + transactions), this
engine derives a synthetic private-wealth portfolio view from:
    - Account balances
    - Recent transaction descriptions and magnitudes

It produces:
    - Allocation by asset class
    - Diversification index
    - Simple Value-at-Risk style metric
"""

from __future__ import annotations

from typing import Any


class PortfolioEngine:
    ASSET_CLASSES = [
        "equities",
        "bonds",
        "alternatives",
        "real_estate",
        "private_equity",
    ]

    def __init__(self, banking_service):
        self.bank = banking_service

    def get_portfolio_metrics(self) -> dict[str, Any]:
        """
        Derive a synthetic portfolio allocation across asset classes.
        For now this is a deterministic mapping from balances:
            - top balances tilt to real estate & private equity
            - mid balances tilt to equities & bonds
            - lower balances tilt to alternatives / cash equivalents
        """
        accounts = self.bank.get_all_accounts()
        total_balance = sum(a.get("balance", 0.0) for a in accounts) or 1.0

        # Allocate each account's balance across asset classes heuristically
        allocation = {k: 0.0 for k in self.ASSET_CLASSES}
        for acc in accounts:
            bal = float(acc.get("balance", 0.0))
            if bal <= 0:
                continue
            weight = bal / total_balance

            if bal > 200000:
                allocation["real_estate"] += weight * 0.4
                allocation["private_equity"] += weight * 0.3
                allocation["equities"] += weight * 0.2
                allocation["bonds"] += weight * 0.1
            elif bal > 50000:
                allocation["equities"] += weight * 0.4
                allocation["bonds"] += weight * 0.3
                allocation["alternatives"] += weight * 0.2
                allocation["real_estate"] += weight * 0.1
            else:
                allocation["bonds"] += weight * 0.4
                allocation["alternatives"] += weight * 0.3
                allocation["equities"] += weight * 0.2
                allocation["real_estate"] += weight * 0.1

        # Normalise to sum to 1
        total_alloc = sum(allocation.values()) or 1.0
        for k in allocation:
            allocation[k] = allocation[k] / total_alloc

        # Diversification index: 1 - sum(p_i^2)
        div_index = 1.0 - sum(p**2 for p in allocation.values())

        # Simple VaR-like metric: assume portfolio volatility scaling from diversification
        # Higher diversification -> lower risk factor.
        base_volatility = 0.25  # arbitrary base annualised volatility
        volatility = base_volatility * (1.2 - div_index)
        var_95 = 1.65 * volatility  # 1.65 ~ 95% one-sided normal quantile

        return {
            "allocation": {k: round(v, 4) for k, v in allocation.items()},
            "diversification_index": round(div_index, 4),
            "value_at_risk_95": round(var_95, 4),
        }
