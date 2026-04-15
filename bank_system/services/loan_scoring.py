"""
AI Loan Scoring Engine
======================
Multi-factor loan scoring model that combines:
1. Credit score (traditional)
2. Account behavior analysis (spending patterns, balance history)
3. Debt-to-income ratio estimation
4. Loan purpose risk category
5. Account tenure & transaction velocity
6. Graph network risk exposure

Produces: approval probability, interest rate recommendation,
          max approved amount, and detailed factor breakdown.

Note: Uses deterministic scoring model (no external ML libs needed).
"""

import statistics
from datetime import datetime


class LoanScoringEngine:
    # Risk multipliers by loan purpose
    PURPOSE_RISK = {
        "home": 0.85,
        "home renovation": 0.87,
        "car": 0.88,
        "car purchase": 0.88,
        "education": 0.82,
        "business": 0.78,
        "business expansion": 0.78,
        "personal": 0.72,
        "medical": 0.90,
        "debt consolidation": 0.70,
        "vacation": 0.60,
        "investment": 0.65,
    }
    BASE_RATE = 8.5  # Base annual interest rate %

    def __init__(self, banking_service):
        self.bank = banking_service

    def score_loan(self, account_id, amount, purpose, credit_score, urgency=0):
        """
        Run full AI scoring on a loan application.
        Returns comprehensive scoring report.
        """
        account = self.bank.get_account(account_id)
        history = self.bank.get_transaction_history(account_id, limit=100)

        factors = {}

        # 1. Credit score factor (0-100)
        factors["credit_score"] = self._score_credit(credit_score)

        # 2. Account behavior factor
        factors["account_behavior"] = self._score_behavior(history)

        # 3. Balance sufficiency factor
        factors["balance_health"] = self._score_balance(account, amount)

        # 4. Loan-to-income ratio factor (estimated from transaction history)
        factors["lti_ratio"] = self._score_lti(history, amount)

        # 5. Purpose risk factor
        factors["purpose_risk"] = self._score_purpose(purpose)

        # 6. Account tenure factor
        factors["tenure"] = self._score_tenure(account)

        # 7. Network risk (graph exposure)
        factors["network_risk"] = self._score_network(account_id)

        # Weighted composite approval score
        weights = {
            "credit_score": 0.35,
            "account_behavior": 0.20,
            "balance_health": 0.15,
            "lti_ratio": 0.10,
            "purpose_risk": 0.10,
            "tenure": 0.05,
            "network_risk": 0.05,
        }
        composite = sum(factors[k] * weights[k] for k in factors)
        composite = round(composite, 1)

        # Approval decision
        if composite >= 72:
            decision = "approve"
            confidence = "high"
        elif composite >= 55:
            decision = "approve"
            confidence = "medium"
        elif composite >= 40:
            decision = "conditional"
            confidence = "low"
        else:
            decision = "reject"
            confidence = "high"

        # Recommended interest rate
        rate = self._recommend_rate(composite, credit_score, purpose)

        # Maximum recommended amount
        max_amount = self._recommend_max_amount(composite, account, history, amount)

        # Risk tier
        tier = (
            "A"
            if composite >= 80
            else "B"
            if composite >= 65
            else "C"
            if composite >= 50
            else "D"
        )

        return {
            "account_id": account_id,
            "requested_amount": amount,
            "approved_amount": max_amount if decision != "reject" else 0,
            "decision": decision,
            "confidence": confidence,
            "composite_score": composite,
            "risk_tier": tier,
            "recommended_rate": rate,
            "factors": factors,
            "factor_weights": weights,
            "purpose": purpose,
            "credit_score": credit_score,
            "urgency": urgency,
            "scored_at": datetime.now().isoformat(),
            "recommendations": self._generate_recommendations(
                factors, composite, decision
            ),
        }

    def _score_credit(self, credit_score):
        """FICO 300-850 → 0-100 linear scale."""
        return round(max(0, min(100, (credit_score - 300) / 5.5)), 1)

    def _score_behavior(self, history):
        """Analyze transaction regularity and consistency."""
        if len(history) < 3:
            return 50  # Neutral for thin history
        deposits = [t["amount"] for t in history if t["type"] == "deposit"]
        withdrawals = [t["amount"] for t in history if t["type"] == "withdrawal"]
        if not deposits:
            return 30
        # Reward consistent deposit behavior
        dep_cv = (
            (statistics.stdev(deposits) / statistics.mean(deposits))
            if len(deposits) > 1
            else 1
        )
        # Low coefficient of variation = consistent = good
        behavior_score = max(0, 100 - dep_cv * 40)
        # Penalize if withdrawals consistently exceed deposits
        if withdrawals:
            dep_total = sum(deposits)
            with_total = sum(withdrawals)
            ratio = with_total / dep_total if dep_total > 0 else 2
            if ratio > 0.9:
                behavior_score *= 0.7
        return round(behavior_score, 1)

    def _score_balance(self, account, loan_amount):
        """Current balance vs loan amount."""
        if not account:
            return 40
        balance = account.get("balance", 0)
        # Ideally balance >= 20% of loan (emergency buffer)
        buffer_ratio = balance / loan_amount if loan_amount > 0 else 1
        if buffer_ratio >= 0.5:
            return 90
        elif buffer_ratio >= 0.2:
            return 70
        elif buffer_ratio >= 0.1:
            return 50
        return 25

    def _score_lti(self, history, loan_amount):
        """Estimate loan-to-income ratio from deposit history."""
        deposits = [t["amount"] for t in history if t["type"] == "deposit"]
        if not deposits:
            return 40
        # Estimate monthly income from average deposits
        estimated_monthly = statistics.mean(deposits) * max(1, len(deposits) / 12)
        # Loan should be < 36x monthly income (3 years)
        months_to_repay = (
            loan_amount / estimated_monthly if estimated_monthly > 0 else 999
        )
        if months_to_repay <= 12:
            return 95
        elif months_to_repay <= 24:
            return 80
        elif months_to_repay <= 36:
            return 65
        elif months_to_repay <= 60:
            return 45
        return 20

    def _score_purpose(self, purpose):
        """Return purpose risk multiplier as score."""
        key = purpose.lower().strip()
        multiplier = self.PURPOSE_RISK.get(key, 0.70)
        return round(multiplier * 100, 1)

    def _score_tenure(self, account):
        """Older accounts are more trustworthy."""
        if not account:
            return 50
        try:
            created = datetime.fromisoformat(account["created_at"])
            days = (datetime.now() - created).days
            if days >= 365:
                return 95
            elif days >= 180:
                return 75
            elif days >= 90:
                return 60
            elif days >= 30:
                return 45
            return 30
        except Exception:
            return 50

    def _score_network(self, account_id):
        """Lower graph risk = better loan score."""
        risk_scores = self.bank.compliance_graph.compute_risk_scores()
        risk = risk_scores.get(account_id, 0)
        return round(max(0, 100 - risk * 1.5), 1)

    def _recommend_rate(self, composite, credit_score, purpose):
        """Calculate recommended interest rate."""
        key = purpose.lower().strip()
        purpose_adj = (1 - self.PURPOSE_RISK.get(key, 0.70)) * 4  # 0-1.2% adj
        credit_adj = max(0, (700 - credit_score) / 100)  # penalty for low credit
        score_adj = max(0, (70 - composite) / 20)  # penalty for low score
        rate = self.BASE_RATE + purpose_adj + credit_adj + score_adj
        return round(min(29.9, max(4.5, rate)), 2)

    def _recommend_max_amount(self, composite, account, history, requested):
        """Recommend a maximum safe loan amount."""
        deposits = [t["amount"] for t in history if t["type"] == "deposit"]
        estimated_monthly = statistics.mean(deposits) * 2 if deposits else 1000
        # Max = monthly_income * composite_score / 100 * 24 months
        max_safe = estimated_monthly * (composite / 100) * 24
        # Cap at requested if score is high enough
        if composite >= 70:
            return round(min(requested, max_safe * 1.2), 2)
        return round(min(requested, max_safe), 2)

    def _generate_recommendations(self, factors, composite, decision):
        """Generate human-readable improvement recommendations."""
        recs = []
        if factors["credit_score"] < 60:
            recs.append("Improve credit score by paying down existing debts on time.")
        if factors["account_behavior"] < 50:
            recs.append(
                "Maintain more consistent deposit patterns over the next 3-6 months."
            )
        if factors["balance_health"] < 50:
            recs.append(
                "Build up account balance to at least 20% of requested loan amount."
            )
        if factors["lti_ratio"] < 50:
            recs.append("Consider requesting a smaller loan amount relative to income.")
        if factors["network_risk"] < 60:
            recs.append("Reduce high-value transfers to flagged accounts.")
        if not recs and decision == "approve":
            recs.append("Strong application — no major areas of concern.")
        return recs

    def batch_score(self, applications):
        """
        Score multiple loan applications at once.
        applications: list of dicts with account_id, amount, purpose, credit_score
        Returns sorted list by composite_score desc.
        """
        results = []
        for app in applications:
            try:
                r = self.score_loan(
                    app["account_id"],
                    float(app["amount"]),
                    app.get("purpose", "personal"),
                    int(app.get("credit_score", 650)),
                    int(app.get("urgency", 0)),
                )
                results.append(r)
            except Exception as e:
                results.append({"error": str(e), **app})
        results.sort(key=lambda x: x.get("composite_score", 0), reverse=True)
        return results

    def what_if(self, account_id, amount, purpose, current_credit_score):
        """
        What-if simulator: show how score changes with improved credit score.
        Returns scenarios at +50, +100, +150 credit score improvements.
        """
        scenarios = []
        for delta in [0, 25, 50, 100, 150]:
            sim_credit = min(850, current_credit_score + delta)
            r = self.score_loan(account_id, amount, purpose, sim_credit)
            scenarios.append(
                {
                    "credit_score": sim_credit,
                    "delta": delta,
                    "composite_score": r["composite_score"],
                    "decision": r["decision"],
                    "rate": r["recommended_rate"],
                    "approved_amount": r["approved_amount"],
                    "tier": r["risk_tier"],
                }
            )
        return scenarios

    def score_all_pending(self):
        """Auto-score all pending loan applications."""
        loans = self.bank.get_pending_loans()
        results = []
        for loan in loans:
            r = self.score_loan(
                loan["account_id"],
                loan["amount"],
                loan.get("purpose", "personal"),
                loan.get("credit_score", 650),
                loan.get("urgency", 0),
            )
            r["loan_id"] = loan["loan_id"]
            r["owner_name"] = loan["owner_name"]
            results.append(r)
        results.sort(key=lambda x: x["composite_score"], reverse=True)
        return results

    def compare_applications(self, app_list):
        """
        Side-by-side comparison of up to 4 applications.
        app_list: list of dicts with scoring inputs
        Returns parallel arrays suitable for radar/bar chart.
        """
        scored = self.batch_score(app_list)
        factor_keys = [
            "credit_score",
            "account_behavior",
            "balance_health",
            "lti_ratio",
            "purpose_risk",
            "tenure",
            "network_risk",
        ]
        return {
            "applications": [
                {
                    "label": s.get("owner_name", s["account_id"]),
                    "composite": s["composite_score"],
                    "decision": s["decision"],
                    "rate": s["recommended_rate"],
                    "tier": s["risk_tier"],
                    "factors": [s.get("factors", {}).get(k, 0) for k in factor_keys],
                }
                for s in scored
                if "error" not in s
            ],
            "factor_labels": [
                "Credit",
                "Behavior",
                "Balance",
                "LTI",
                "Purpose",
                "Tenure",
                "Network",
            ],
        }
