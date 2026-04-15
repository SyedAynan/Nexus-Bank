"""
Risk Intelligence Engine
========================
High-level risk and intelligence layer built entirely in Python, on top of the
existing DSA-backed banking engine.

Responsibilities:
    - Real-time client risk scoring
    - Risk heatmap / distribution data
    - Monte Carlo style stress testing
    - Narrative risk / intelligence insights

DSA under the hood (via existing services):
    - Graph (ComplianceGraph in banking_service.compliance_graph)
    - Priority Queue (LoanPriorityQueue for urgency / propagation ordering)
    - Hash-based lookups (AccountHashTable via BankingService.account_table)
"""

from __future__ import annotations

import math
import random
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any


@dataclass
class ClientRiskBreakdown:
    client_id: str
    name: str
    behavioral_score: float
    exposure_score: float
    credit_volatility_score: float
    liquidity_stress_score: float

    @property
    def composite(self) -> float:
        # Weighted blend – can be tuned
        return round(
            self.behavioral_score * 0.35
            + self.exposure_score * 0.25
            + self.credit_volatility_score * 0.20
            + self.liquidity_stress_score * 0.20,
            1,
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "client_id": self.client_id,
            "name": self.name,
            "behavioral_score": self.behavioral_score,
            "exposure_score": self.exposure_score,
            "credit_volatility_score": self.credit_volatility_score,
            "liquidity_stress_score": self.liquidity_stress_score,
            "composite": self.composite,
        }


class RiskIntelligenceEngine:
    """
    Thin orchestration layer that pulls data from:
        - BankingService (accounts, transactions, loans, compliance graph)
        - FraudEngine (behavioral / anomaly metrics)
        - AnalyticsEngine (volume / risk trend helpers)
        - LoanScoringEngine (credit / loan risk factors)
    and turns them into higher-level risk products for Imperial Capital.
    """

    def __init__(self, banking_service, fraud_engine, analytics_engine, loan_scorer):
        self.bank = banking_service
        self.fraud = fraud_engine
        self.analytics = analytics_engine
        self.loan_scorer = loan_scorer

    # ─────────────────────────────────────────────
    # REAL-TIME CLIENT RISK
    # ─────────────────────────────────────────────
    def get_live_client_risk(self, client_id: str) -> dict[str, Any]:
        """
        Compute a live risk snapshot for a single client (account owner).
        """
        account = self.bank.get_account(client_id)
        # Imperial uses account_id as client_id in many places; if not found,
        # try to resolve via hash-table owner index (if available).
        if not account:
            account = self._lookup_account_fuzzy(client_id)
        if not account:
            return {"client_id": client_id, "exists": False}

        acc_id = account["account_id"]
        name = account.get("owner_name", acc_id)

        behavioral = self._score_behavioral(acc_id)
        exposure = self._score_exposure(acc_id)
        credit_vol = self._score_credit_volatility(acc_id)
        liquidity = self._score_liquidity_stress(acc_id)

        breakdown = ClientRiskBreakdown(
            client_id=acc_id,
            name=name,
            behavioral_score=behavioral,
            exposure_score=exposure,
            credit_volatility_score=credit_vol,
            liquidity_stress_score=liquidity,
        )
        bucket = self._bucket_risk(breakdown.composite)

        return {
            "exists": True,
            "client": {"id": acc_id, "name": name},
            "scores": breakdown.to_dict(),
            "bucket": bucket,
        }

    def get_risk_heatmap(self) -> dict[str, Any]:
        """
        Aggregate risk distribution across all accounts for dashboards.
        Returns buckets: low / medium / high / critical.
        """
        accounts = self.bank.get_all_accounts()
        buckets = {"low": 0, "medium": 0, "high": 0, "critical": 0}
        samples: list[float] = []

        for acc in accounts:
            acc_id = acc["account_id"]
            breakdown = self.get_live_client_risk(acc_id)
            if not breakdown.get("exists"):
                continue
            score = breakdown["scores"]["composite"]
            samples.append(score)
            b = breakdown["bucket"]
            if b in buckets:
                buckets[b] += 1

        avg = round(sum(samples) / len(samples), 1) if samples else 0.0
        max_score = max(samples) if samples else 0.0
        return {
            "buckets": buckets,
            "average_score": avg,
            "max_score": max_score,
            "sample_size": len(samples),
        }

    # ─────────────────────────────────────────────
    # STRESS TESTING
    # ─────────────────────────────────────────────
    def run_stress_test(
        self, scenarios: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        """
        Simple Monte Carlo style stress testing over the current loan book and balances.

        scenarios:
            {
              "runs": 200,
              "rate_shock_bps": 300,
              "default_rate": 0.05,
              "liquidity_shock": 0.10
            }
        """
        scenarios = scenarios or {}
        runs = int(scenarios.get("runs", 200))
        base_default_rate = float(scenarios.get("default_rate", 0.03))
        rate_shock_bps = float(scenarios.get("rate_shock_bps", 200.0))
        liquidity_shock = float(scenarios.get("liquidity_shock", 0.10))

        loans = (
            getattr(self.bank, "processed_loans", []) + self.bank.get_pending_loans()
        )
        accounts = self.bank.get_all_accounts()
        total_loan_amount = sum(loan.get("amount", 0.0) for loan in loans) or 1.0
        total_balance = sum(a.get("balance", 0.0) for a in accounts) or 1.0

        capital_losses = []
        liquidity_gaps = []

        for _ in range(runs):
            # Randomise default rate around base default rate
            default_rate = max(
                0.0, random.gauss(base_default_rate, base_default_rate * 0.4)
            )
            shocked_rate = rate_shock_bps / 10000.0
            shocked_liquidity = liquidity_shock * random.uniform(0.8, 1.2)

            loss = total_loan_amount * default_rate * (1.0 + shocked_rate)
            gap = total_balance * shocked_liquidity

            capital_losses.append(loss)
            liquidity_gaps.append(gap)

        def _summary(values: list[float]) -> dict[str, float]:
            if not values:
                return {"avg": 0.0, "p95": 0.0, "max": 0.0}
            sorted_vals = sorted(values)
            n = len(sorted_vals)
            p95 = sorted_vals[int(0.95 * (n - 1))]
            return {
                "avg": round(sum(sorted_vals) / n, 2),
                "p95": round(p95, 2),
                "max": round(sorted_vals[-1], 2),
            }

        return {
            "runs": runs,
            "loan_book": round(total_loan_amount, 2),
            "deposit_base": round(total_balance, 2),
            "assumptions": {
                "base_default_rate": base_default_rate,
                "rate_shock_bps": rate_shock_bps,
                "liquidity_shock": liquidity_shock,
            },
            "capital_loss": _summary(capital_losses),
            "liquidity_gap": _summary(liquidity_gaps),
        }

    # ─────────────────────────────────────────────
    # NARRATIVE INSIGHTS
    # ─────────────────────────────────────────────
    def get_insights(self) -> dict[str, Any]:
        """
        Generate lightweight, heuristic-based insights suitable for
        the Imperial "intelligence" layer without heavy ML.
        """
        accounts = self.bank.get_all_accounts()
        heatmap = self.get_risk_heatmap()
        insights: list[str] = []

        if heatmap["buckets"]["high"] + heatmap["buckets"]["critical"] > 0:
            insights.append(
                "One or more clients exhibit elevated risk levels; review high and critical buckets."
            )

        # Concentration: top 10% of accounts vs total balance
        sorted_acc = sorted(accounts, key=lambda a: a.get("balance", 0.0), reverse=True)
        if sorted_acc:
            k = max(1, len(sorted_acc) // 10)
            top_slice = sorted_acc[:k]
            top_balance = sum(a.get("balance", 0.0) for a in top_slice)
            total_balance = sum(a.get("balance", 0.0) for a in sorted_acc) or 1.0
            share = top_balance / total_balance
            if share > 0.5:
                insights.append(
                    "Client assets are highly concentrated; top decile holds more than half of total balances."
                )

        # Simple growth heuristic from analytics
        vol = self.analytics.get_transaction_volume_chart(days=14)
        if vol["counts"]:
            first = vol["counts"][0]
            last = vol["counts"][-1]
            if last > first * 1.3 and last - first > 10:
                insights.append(
                    "Transaction activity has increased significantly over the last 14 days."
                )

        return {
            "heatmap": heatmap,
            "messages": insights,
        }

    # ─────────────────────────────────────────────
    # INTERNAL HELPERS
    # ─────────────────────────────────────────────
    def _lookup_account_fuzzy(self, client_id: str) -> dict[str, Any] | None:
        """
        Helper in case the caller passes an alias instead of exact account_id.
        """
        accounts = self.bank.get_all_accounts()
        for acc in accounts:
            if acc.get("account_id") == client_id:
                return acc
            if acc.get("owner_name") == client_id:
                return acc
        return None

    def _score_behavioral(self, account_id: str) -> float:
        """
        Behavioral score based on recent transaction variability and fraud engine signals.
        Lower anomaly => lower risk; score scaled 0-100 where higher = higher risk.
        """
        history = self.bank.get_transaction_history(account_id, limit=50)
        if not history:
            return 20.0  # very low activity => low but non-zero risk

        amounts = [t["amount"] for t in history]
        avg = sum(amounts) / len(amounts)
        var = sum((a - avg) ** 2 for a in amounts) / max(1, len(amounts) - 1)
        std = math.sqrt(var)

        # Normalised volatility factor
        volatility_factor = max(0.0, min(1.0, std / (avg + 1e-6)))

        # Use fraud engine velocity window size as another heuristic
        velocity = len(self.fraud.velocity_windows.get(account_id, []))
        velocity_factor = max(0.0, min(1.0, velocity / 10.0))

        score = 40.0 * volatility_factor + 60.0 * velocity_factor
        return round(max(0.0, min(100.0, score)), 1)

    def _score_exposure(self, account_id: str) -> float:
        """
        Exposure score based on position in the transfer/compliance graph.
        Higher connectivity and participation in cycles => higher risk.
        """
        graph = self.bank.compliance_graph
        graph_data = graph.get_graph_data()
        node = None
        for n in graph_data.get("nodes", []):
            if n.get("id") == account_id:
                node = n
                break

        if not node:
            return 25.0

        degree = node.get("degree", 0)
        risk = node.get("risk_score", 0)

        degree_factor = max(0.0, min(1.0, degree / 10.0))
        risk_factor = max(0.0, min(1.0, risk / 100.0))
        score = 50.0 * degree_factor + 50.0 * risk_factor
        return round(max(0.0, min(100.0, score)), 1)

    def _score_credit_volatility(self, account_id: str) -> float:
        """
        Use loan scoring engine and recent loan decisions as a proxy for
        credit volatility / uncertainty.
        """
        loans = [
            loan
            for loan in self.bank.processed_loans
            if loan.get("account_id") == account_id
        ]
        if not loans:
            return 20.0

        scores = []
        for loan in loans:
            credit_score = loan.get("credit_score", 650)
            report = self.loan_scorer.score_loan(
                account_id,
                loan.get("amount", 0.0),
                loan.get("purpose", "personal"),
                credit_score,
                urgency=loan.get("urgency", 0),
            )
            scores.append(100.0 - report.get("approval_score", 0.0))

        if not scores:
            return 30.0

        return round(sum(scores) / len(scores), 1)

    def _score_liquidity_stress(self, account_id: str) -> float:
        """
        Liquidity stress based on balance vs recent outflows.
        """
        acc = self.bank.get_account(account_id)
        if not acc:
            return 0.0

        balance = float(acc.get("balance", 0.0))
        history = self.bank.get_transaction_history(account_id, limit=50)
        if not history:
            return 10.0

        window_days = 14
        cutoff = datetime.now() - timedelta(days=window_days)
        outflows = 0.0
        for t in history:
            try:
                ts = datetime.fromisoformat(t["timestamp"])
            except Exception:
                continue
            if ts < cutoff:
                continue
            if t.get("type") in ("withdrawal", "transfer"):
                outflows += t.get("amount", 0.0)

        if outflows <= 0:
            return 15.0

        ratio = outflows / max(1.0, balance)
        ratio_factor = max(0.0, min(1.5, ratio))  # cap at 1.5
        score = 20.0 + 60.0 * ratio_factor
        return round(max(0.0, min(100.0, score)), 1)

    @staticmethod
    def _bucket_risk(score: float) -> str:
        if score < 30.0:
            return "low"
        if score < 60.0:
            return "medium"
        if score < 80.0:
            return "high"
        return "critical"
