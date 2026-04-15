"""
Fraud Detection Engine
======================
Implements multiple anomaly detection algorithms:
1. Z-Score deviation — flags transactions far from account's mean
2. Velocity check — too many transactions in short window (sliding window counter)
3. Round-number detector — suspiciously round amounts
4. Time-of-day anomaly — transactions at unusual hours for this account
5. Geographic/pattern jump — sudden large deviations from baseline
6. Graph-based suspicion — high-risk neighbors in transfer network

All scores are combined into a composite Fraud Risk Score (0-100).
"""

import statistics
from collections import defaultdict, deque
from datetime import datetime, timedelta


class FraudEngine:
    def __init__(self, banking_service):
        self.bank = banking_service
        # Sliding window: account_id -> deque of (timestamp, amount)
        self.velocity_windows = defaultdict(lambda: deque())
        self.VELOCITY_WINDOW_SECONDS = 3600  # 1 hour
        self.VELOCITY_MAX_TRANSACTIONS = 5  # flag if >5 txns/hour
        self.alerts = []  # Persistent alert log

    # ─────────────────────────────────────────────
    # MAIN SCORER
    # ─────────────────────────────────────────────
    def score_transaction(self, account_id, amount, txn_type, timestamp=None):
        """
        Score a single transaction and return a fraud risk report.
        Returns dict with composite score and individual signal scores.
        """
        if timestamp is None:
            timestamp = datetime.now()

        history = self.bank.get_transaction_history(account_id, limit=50)
        account = self.bank.get_account(account_id)

        signals = {}

        # 1. Z-Score anomaly
        signals["zscore"] = self._zscore_signal(amount, history, txn_type)

        # 2. Velocity check
        signals["velocity"] = self._velocity_signal(account_id, timestamp)

        # 3. Round number detector
        signals["round_number"] = self._round_number_signal(amount)

        # 4. Time-of-day anomaly
        signals["time_anomaly"] = self._time_anomaly_signal(timestamp, history)

        # 5. Large amount relative to balance
        signals["balance_ratio"] = self._balance_ratio_signal(amount, account, txn_type)

        # 6. Graph neighbor risk
        signals["graph_risk"] = self._graph_risk_signal(account_id)

        # Weighted composite score
        weights = {
            "zscore": 0.30,
            "velocity": 0.25,
            "round_number": 0.10,
            "time_anomaly": 0.10,
            "balance_ratio": 0.15,
            "graph_risk": 0.10,
        }
        composite = sum(signals[k] * weights[k] for k in signals)
        composite = min(100, round(composite, 1))

        # Update velocity window
        self._update_velocity(account_id, timestamp, amount)

        # Determine severity
        if composite >= 70:
            severity = "critical"
        elif composite >= 45:
            severity = "high"
        elif composite >= 25:
            severity = "medium"
        else:
            severity = "low"

        result = {
            "account_id": account_id,
            "amount": amount,
            "type": txn_type,
            "composite_score": composite,
            "severity": severity,
            "signals": signals,
            "timestamp": timestamp.isoformat(),
            "flagged": composite >= 45,
        }

        if result["flagged"]:
            self._record_alert(result)

        return result

    # ─────────────────────────────────────────────
    # INDIVIDUAL SIGNALS (each returns 0-100)
    # ─────────────────────────────────────────────
    def _zscore_signal(self, amount, history, txn_type):
        """Flag if amount is unusually far from this account's historical mean."""
        amounts = [t["amount"] for t in history if t["type"] == txn_type]
        if len(amounts) < 3:
            return 0  # Not enough history
        mean = statistics.mean(amounts)
        stdev = statistics.stdev(amounts)
        if stdev == 0:
            return 0
        z = abs(amount - mean) / stdev
        # z=1 → 20, z=2 → 50, z=3 → 80, z≥4 → 100
        return min(100, round(z * 25, 1))

    def _velocity_signal(self, account_id, timestamp):
        """Detect too many transactions in the sliding window."""
        window = self.velocity_windows[account_id]
        cutoff = timestamp - timedelta(seconds=self.VELOCITY_WINDOW_SECONDS)
        # Count recent entries
        recent = sum(1 for ts, _ in window if ts >= cutoff)
        if recent < self.VELOCITY_MAX_TRANSACTIONS:
            return 0
        excess = recent - self.VELOCITY_MAX_TRANSACTIONS
        return min(100, excess * 20)

    def _round_number_signal(self, amount):
        """Round numbers are common in fraud (10000, 5000, etc.)."""
        if amount <= 0:
            return 0
        # Check if divisible by large round numbers
        for divisor, score in [
            (10000, 60),
            (5000, 50),
            (1000, 35),
            (500, 20),
            (100, 10),
        ]:
            if amount % divisor == 0:
                return score
        return 0

    def _time_anomaly_signal(self, timestamp, history):
        """Flag if transaction happens at unusual hour for this account."""
        hour = timestamp.hour
        # Late night / early morning: 00:00 - 05:59
        if 0 <= hour <= 5:
            # Check if account has history at these hours
            late_night_count = sum(
                1 for t in history if int(t["timestamp"][11:13]) <= 5
            )
            if late_night_count == 0:
                return 65  # Never transacted at night
            return 20
        return 0

    def _balance_ratio_signal(self, amount, account, txn_type):
        """Withdrawing a large fraction of balance is suspicious."""
        if txn_type != "withdrawal" or not account:
            return 0
        balance = account.get("balance", 0)
        if balance <= 0:
            return 0
        ratio = amount / balance
        if ratio >= 0.9:
            return 90
        elif ratio >= 0.7:
            return 65
        elif ratio >= 0.5:
            return 40
        elif ratio >= 0.3:
            return 20
        return 0

    def _graph_risk_signal(self, account_id):
        """Use the compliance graph risk score as a signal."""
        risk_scores = self.bank.compliance_graph.compute_risk_scores()
        score = risk_scores.get(account_id, 0)
        return min(100, score * 1.5)

    def _update_velocity(self, account_id, timestamp, amount):
        """Add transaction to sliding window."""
        window = self.velocity_windows[account_id]
        window.append((timestamp, amount))
        # Prune old entries
        cutoff = timestamp - timedelta(seconds=self.VELOCITY_WINDOW_SECONDS)
        while window and window[0][0] < cutoff:
            window.popleft()

    def _record_alert(self, result):
        self.alerts.insert(
            0,
            {
                "alert_id": f"ALT{len(self.alerts) + 1:04d}",
                "account_id": result["account_id"],
                "amount": result["amount"],
                "type": result["type"],
                "score": result["composite_score"],
                "severity": result["severity"],
                "signals": result["signals"],
                "timestamp": result["timestamp"],
                "status": "open",  # open | reviewed | dismissed
            },
        )
        self.alerts = self.alerts[:200]  # Keep last 200

    def get_alerts(self, limit=50, severity=None):
        alerts = self.alerts
        if severity:
            alerts = [a for a in alerts if a["severity"] == severity]
        return alerts[:limit]

    def dismiss_alert(self, alert_id):
        for a in self.alerts:
            if a["alert_id"] == alert_id:
                a["status"] = "dismissed"
                return True
        return False

    def get_account_risk_profile(self, account_id):
        """Full risk profile for an account."""
        history = self.bank.get_transaction_history(account_id, limit=100)
        if not history:
            return {"account_id": account_id, "risk_level": "unknown", "score": 0}

        amounts = [t["amount"] for t in history]
        mean_amount = statistics.mean(amounts) if amounts else 0
        max_amount = max(amounts) if amounts else 0
        velocity_score = self._velocity_signal(account_id, datetime.now())
        graph_score = self._graph_risk_signal(account_id)

        score = min(100, (velocity_score * 0.4 + graph_score * 0.6))
        return {
            "account_id": account_id,
            "transaction_count": len(history),
            "mean_amount": round(mean_amount, 2),
            "max_amount": max_amount,
            "velocity_score": velocity_score,
            "graph_risk_score": graph_score,
            "composite_risk": round(score, 1),
            "risk_level": "high" if score >= 60 else "medium" if score >= 30 else "low",
        }

    def bulk_screen_accounts(self):
        """Screen all accounts and return ranked risk list."""
        accounts = self.bank.get_all_accounts()
        profiles = []
        for acc in accounts:
            profile = self.get_account_risk_profile(acc["account_id"])
            profile["owner_name"] = acc["owner_name"]
            profile["balance"] = acc["balance"]
            profiles.append(profile)
        profiles.sort(key=lambda x: x["composite_risk"], reverse=True)
        return profiles
