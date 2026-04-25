"""
ML Fraud Detection Engine (v4.0)
================================
Three-layer fraud detection pipeline:
  Layer 1 (Real-time, <10ms): Rule engine + Isolation Forest + GBT classifier
  Layer 2 (Near-real-time):    LSTM behavioral model (future — requires TensorFlow)
  Layer 3 (Batch):             Model retraining with new labeled data

Replaces the pure rule-based FraudEngine with an ML-augmented ensemble.
Models are trained on synthetic banking data and updated via the retrain pipeline.
"""

import hashlib
import json
import logging
import math
import os
import pickle
import statistics
import time
from collections import defaultdict, deque
from datetime import datetime, timedelta
from typing import Any

import numpy as np

logger = logging.getLogger("nexa.ml_fraud")

# ---------------------------------------------------------------------------
# Feature Engineering
# ---------------------------------------------------------------------------

FEATURE_SCHEMA = {
    "transaction": [
        "amount",
        "amount_log",
        "is_round_100",
        "is_round_1000",
        "is_round_5000",
        "hour_of_day",
        "day_of_week",
        "is_weekend",
        "is_night",  # 00:00–05:59
    ],
    "velocity": [
        "txn_count_1h",
        "txn_count_24h",
        "amount_sum_1h",
        "amount_sum_24h",
    ],
    "behavioral": [
        "amount_zscore",
        "balance_ratio",
        "days_since_last_txn",
    ],
    "graph": [
        "out_degree",
        "in_degree",
        "neighbor_avg_risk",
    ],
}

# Total feature count
FEATURE_NAMES = [f for group in FEATURE_SCHEMA.values() for f in group]
N_FEATURES = len(FEATURE_NAMES)  # 22


class FeatureExtractor:
    """Extracts a fixed-length feature vector from a transaction context."""

    def __init__(self):
        self.velocity_windows: dict[str, deque] = defaultdict(lambda: deque())

    def extract(
        self,
        amount: float,
        txn_type: str,
        timestamp: datetime,
        account: dict | None,
        history: list[dict],
        graph_data: dict | None = None,
    ) -> np.ndarray:
        features = []

        # --- Transaction features ---
        features.append(amount)
        features.append(math.log1p(amount))
        features.append(1.0 if amount > 0 and amount % 100 == 0 else 0.0)
        features.append(1.0 if amount > 0 and amount % 1000 == 0 else 0.0)
        features.append(1.0 if amount > 0 and amount % 5000 == 0 else 0.0)
        features.append(float(timestamp.hour))
        features.append(float(timestamp.weekday()))
        features.append(1.0 if timestamp.weekday() >= 5 else 0.0)
        features.append(1.0 if 0 <= timestamp.hour <= 5 else 0.0)

        # --- Velocity features ---
        account_id = account.get("account_id", "") if account else ""
        window = self.velocity_windows[account_id]
        cutoff_1h = timestamp - timedelta(hours=1)
        cutoff_24h = timestamp - timedelta(hours=24)

        txn_count_1h = sum(1 for ts, _ in window if ts >= cutoff_1h)
        txn_count_24h = sum(1 for ts, _ in window if ts >= cutoff_24h)
        amount_sum_1h = sum(a for ts, a in window if ts >= cutoff_1h)
        amount_sum_24h = sum(a for ts, a in window if ts >= cutoff_24h)

        features.append(float(txn_count_1h))
        features.append(float(txn_count_24h))
        features.append(amount_sum_1h)
        features.append(amount_sum_24h)

        # Update window
        window.append((timestamp, amount))
        while window and window[0][0] < cutoff_24h:
            window.popleft()

        # --- Behavioral features ---
        amounts = [t["amount"] for t in history if t.get("type") == txn_type]
        if len(amounts) >= 3:
            mean = statistics.mean(amounts)
            stdev = statistics.stdev(amounts)
            zscore = abs(amount - mean) / stdev if stdev > 0 else 0.0
        else:
            zscore = 0.0
        features.append(zscore)

        balance = account.get("balance", 0) if account else 0
        balance_ratio = amount / balance if balance > 0 else 0.0
        features.append(balance_ratio)

        if history:
            try:
                last_ts = datetime.fromisoformat(history[0].get("timestamp", ""))
                days_since = (timestamp - last_ts).total_seconds() / 86400
            except (ValueError, TypeError):
                days_since = 0.0
        else:
            days_since = 0.0
        features.append(days_since)

        # --- Graph features ---
        gd = graph_data or {}
        features.append(float(gd.get("out_degree", 0)))
        features.append(float(gd.get("in_degree", 0)))
        features.append(float(gd.get("neighbor_avg_risk", 0)))

        return np.array(features, dtype=np.float64)


# ---------------------------------------------------------------------------
# Isolation Forest (Anomaly Detection)
# ---------------------------------------------------------------------------

class SimpleIsolationForest:
    """
    Lightweight Isolation Forest implementation for real-time anomaly detection.
    Does not require scikit-learn at import time; uses numpy only.

    The model builds an ensemble of random isolation trees. Anomalies are
    isolated in fewer splits on average, yielding higher anomaly scores.
    """

    def __init__(self, n_estimators: int = 100, max_samples: int = 256, contamination: float = 0.05):
        self.n_estimators = n_estimators
        self.max_samples = max_samples
        self.contamination = contamination
        self.trees: list[dict] = []
        self.threshold: float = 0.5
        self._fitted = False

    def fit(self, X: np.ndarray):
        """Train the forest on normal transaction data."""
        n_samples = X.shape[0]
        sub_size = min(self.max_samples, n_samples)

        self.trees = []
        for _ in range(self.n_estimators):
            indices = np.random.choice(n_samples, size=sub_size, replace=False)
            tree = self._build_tree(X[indices], depth=0, max_depth=int(np.ceil(np.log2(sub_size))))
            self.trees.append(tree)

        # Compute threshold from training data
        scores = self.score_samples(X)
        sorted_scores = np.sort(scores)[::-1]
        idx = max(1, int(self.contamination * len(sorted_scores)))
        self.threshold = sorted_scores[idx - 1]
        self._fitted = True
        logger.info(f"IsolationForest fitted: {n_samples} samples, threshold={self.threshold:.4f}")

    def _build_tree(self, X: np.ndarray, depth: int, max_depth: int) -> dict:
        n_samples, n_features = X.shape
        if depth >= max_depth or n_samples <= 1:
            return {"type": "leaf", "size": n_samples}

        feature = np.random.randint(n_features)
        col = X[:, feature]
        min_val, max_val = col.min(), col.max()
        if min_val == max_val:
            return {"type": "leaf", "size": n_samples}

        split = np.random.uniform(min_val, max_val)
        left_mask = col < split
        right_mask = ~left_mask

        return {
            "type": "split",
            "feature": feature,
            "split": split,
            "left": self._build_tree(X[left_mask], depth + 1, max_depth),
            "right": self._build_tree(X[right_mask], depth + 1, max_depth),
        }

    def _path_length(self, x: np.ndarray, node: dict, depth: int) -> float:
        if node["type"] == "leaf":
            n = node["size"]
            if n <= 1:
                return float(depth)
            # Average path length of unsuccessful search in BST
            return depth + 2.0 * (np.log(n - 1) + 0.5772156649) - 2.0 * (n - 1) / n

        if x[node["feature"]] < node["split"]:
            return self._path_length(x, node["left"], depth + 1)
        return self._path_length(x, node["right"], depth + 1)

    def score_samples(self, X: np.ndarray) -> np.ndarray:
        """Return anomaly scores (higher = more anomalous, range ~0-1)."""
        n = min(self.max_samples, X.shape[0]) if self._fitted else self.max_samples
        c_n = 2.0 * (np.log(n - 1) + 0.5772156649) - 2.0 * (n - 1) / n if n > 1 else 1.0

        scores = np.zeros(X.shape[0])
        for i, x in enumerate(X):
            avg_path = np.mean([self._path_length(x, tree, 0) for tree in self.trees])
            scores[i] = 2.0 ** (-avg_path / c_n)
        return scores

    def predict_score(self, x: np.ndarray) -> float:
        """Score a single sample. Returns 0-100 anomaly score."""
        if not self._fitted:
            return 0.0
        raw = self.score_samples(x.reshape(1, -1))[0]
        return round(min(100.0, raw * 100), 2)


# ---------------------------------------------------------------------------
# Gradient Boosted Classifier (uses sklearn if available, else stub)
# ---------------------------------------------------------------------------

class GradientBoostClassifier:
    """
    Wrapper around sklearn's GradientBoostingClassifier for fraud classification.
    Falls back to a simple logistic-like scorer if sklearn is not available.
    """

    def __init__(self):
        self.model = None
        self._fitted = False
        self._use_sklearn = False

        try:
            from sklearn.ensemble import GradientBoostingClassifier as GBC
            self.model = GBC(
                n_estimators=100,
                max_depth=5,
                learning_rate=0.1,
                subsample=0.8,
                random_state=42,
            )
            self._use_sklearn = True
            logger.info("GradientBoostClassifier: using sklearn backend")
        except ImportError:
            logger.warning("sklearn not available — GBT will use simple fallback scorer")

    def fit(self, X: np.ndarray, y: np.ndarray):
        """Train on labeled fraud data. y: 0=legitimate, 1=fraud."""
        if self._use_sklearn and self.model is not None:
            self.model.fit(X, y)
            self._fitted = True
            logger.info(f"GBT fitted on {X.shape[0]} samples, {int(y.sum())} positive")
        else:
            self._fitted = True

    def predict_score(self, x: np.ndarray) -> float:
        """Return fraud probability 0-100."""
        if not self._fitted:
            return 0.0

        if self._use_sklearn and self.model is not None:
            proba = self.model.predict_proba(x.reshape(1, -1))[0][1]
            return round(proba * 100, 2)

        # Fallback: weighted feature heuristic
        if len(x) >= N_FEATURES:
            # Use z-score (idx 13), balance_ratio (idx 14), night (idx 8), velocity (idx 9)
            score = (
                min(x[13], 4) * 15  # zscore capped at 4 → 60 max
                + x[14] * 20        # balance ratio → 20 max
                + x[8] * 10         # night flag → 10
                + min(x[9], 5) * 2  # velocity count → 10 max
            )
            return round(min(100.0, max(0.0, score)), 2)
        return 0.0


# ---------------------------------------------------------------------------
# ML Fraud Engine (Ensemble)
# ---------------------------------------------------------------------------

MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "ml_models")


class MLFraudEngine:
    """
    Production ML fraud detection engine.

    Combines:
    1. Rule-based signals (from existing FraudEngine)
    2. Isolation Forest anomaly detection
    3. Gradient Boosted Trees classifier

    Ensemble: final_score = w1*rules + w2*isolation_forest + w3*gbt
    Weights are configurable and can be tuned per-deployment.
    """

    def __init__(self, banking_service=None):
        self.bank = banking_service
        self.feature_extractor = FeatureExtractor()
        self.isolation_forest = SimpleIsolationForest(
            n_estimators=100,
            max_samples=256,
            contamination=0.05,
        )
        self.gbt_classifier = GradientBoostClassifier()

        # Ensemble weights (tunable)
        self.weights = {
            "rules": 0.35,
            "isolation_forest": 0.35,
            "gbt": 0.30,
        }

        # Model metadata
        self.model_version = "v4.0.0"
        self.predictions_log: list[dict] = []

        # Train on synthetic data at startup
        self._train_on_synthetic_data()

    def _train_on_synthetic_data(self):
        """Generate synthetic banking transaction data and train models."""
        np.random.seed(42)
        n_normal = 1000
        n_fraud = 50

        # Normal transactions: moderate amounts, business hours, low velocity
        normal = np.column_stack([
            np.random.lognormal(mean=6, sigma=1.5, size=n_normal),    # amount
            np.random.normal(6, 1.5, size=n_normal),                   # amount_log
            np.random.binomial(1, 0.3, size=n_normal),                 # is_round_100
            np.random.binomial(1, 0.1, size=n_normal),                 # is_round_1000
            np.random.binomial(1, 0.02, size=n_normal),                # is_round_5000
            np.random.normal(14, 3, size=n_normal).clip(8, 20),        # hour (business)
            np.random.randint(0, 7, size=n_normal),                    # day_of_week
            np.zeros(n_normal),                                        # is_weekend
            np.zeros(n_normal),                                        # is_night
            np.random.poisson(1.5, size=n_normal),                     # txn_count_1h
            np.random.poisson(8, size=n_normal),                       # txn_count_24h
            np.random.lognormal(6, 1, size=n_normal),                  # amount_sum_1h
            np.random.lognormal(8, 1, size=n_normal),                  # amount_sum_24h
            np.random.normal(0.5, 0.5, size=n_normal).clip(0, 2),     # zscore
            np.random.uniform(0, 0.3, size=n_normal),                  # balance_ratio
            np.random.exponential(1, size=n_normal),                   # days_since_last
            np.random.poisson(3, size=n_normal),                       # out_degree
            np.random.poisson(3, size=n_normal),                       # in_degree
            np.random.uniform(0, 20, size=n_normal),                   # neighbor_risk
            np.zeros((n_normal, 3)),                                   # padding
        ]).astype(np.float64)[:, :N_FEATURES]

        # Fraudulent transactions: large amounts, odd hours, high velocity
        fraud = np.column_stack([
            np.random.lognormal(mean=9, sigma=1, size=n_fraud),        # large amounts
            np.random.normal(9, 1, size=n_fraud),                      # amount_log
            np.random.binomial(1, 0.7, size=n_fraud),                  # round numbers
            np.random.binomial(1, 0.5, size=n_fraud),                  # round 1000
            np.random.binomial(1, 0.3, size=n_fraud),                  # round 5000
            np.random.normal(3, 2, size=n_fraud).clip(0, 5),           # odd hours
            np.random.randint(0, 7, size=n_fraud),                     # day
            np.random.binomial(1, 0.5, size=n_fraud),                  # weekend
            np.ones(n_fraud),                                          # is_night
            np.random.poisson(8, size=n_fraud),                        # high velocity
            np.random.poisson(25, size=n_fraud),                       # high 24h count
            np.random.lognormal(9, 1, size=n_fraud),                   # high sum_1h
            np.random.lognormal(11, 1, size=n_fraud),                  # high sum_24h
            np.random.normal(3, 1, size=n_fraud).clip(2, 6),           # high zscore
            np.random.uniform(0.5, 1.0, size=n_fraud),                 # high balance_ratio
            np.random.exponential(0.1, size=n_fraud),                  # rapid txns
            np.random.poisson(8, size=n_fraud),                        # high out_degree
            np.random.poisson(2, size=n_fraud),                        # low in_degree
            np.random.uniform(40, 80, size=n_fraud),                   # high neighbor risk
            np.zeros((n_fraud, 3)),                                    # padding
        ]).astype(np.float64)[:, :N_FEATURES]

        X = np.vstack([normal, fraud])
        y = np.concatenate([np.zeros(n_normal), np.ones(n_fraud)])

        # Train models
        self.isolation_forest.fit(X)
        self.gbt_classifier.fit(X, y)

        logger.info(
            f"ML fraud models trained: {n_normal} normal + {n_fraud} fraud samples, "
            f"{N_FEATURES} features"
        )

    def score_transaction(
        self,
        account_id: str,
        amount: float,
        txn_type: str,
        timestamp: datetime | None = None,
        rule_score: float = 0.0,
        rule_signals: dict | None = None,
    ) -> dict[str, Any]:
        """
        Score a transaction using the ML ensemble.

        Parameters:
            account_id: Account identifier
            amount: Transaction amount
            txn_type: deposit, withdrawal, transfer
            timestamp: Transaction time (defaults to now)
            rule_score: Score from the existing rule-based FraudEngine (0-100)
            rule_signals: Individual signal scores from rule engine

        Returns:
            Complete fraud assessment with ensemble score and model breakdown.
        """
        if timestamp is None:
            timestamp = datetime.now()

        start_time = time.time()

        # Get context from banking service
        history = []
        account = None
        graph_data = {}

        if self.bank:
            history = self.bank.get_transaction_history(account_id, limit=50)
            account = self.bank.get_account(account_id)
            try:
                risk_scores = self.bank.compliance_graph.compute_risk_scores()
                graph_info = self.bank.compliance_graph.get_graph_data()
                nodes = graph_info.get("nodes", [])
                edges = graph_info.get("edges", [])

                out_deg = sum(1 for e in edges if e.get("from") == account_id)
                in_deg = sum(1 for e in edges if e.get("to") == account_id)
                neighbor_risk = risk_scores.get(account_id, 0)

                graph_data = {
                    "out_degree": out_deg,
                    "in_degree": in_deg,
                    "neighbor_avg_risk": neighbor_risk,
                }
            except Exception:
                pass

        # Extract features
        features = self.feature_extractor.extract(
            amount=amount,
            txn_type=txn_type,
            timestamp=timestamp,
            account=account,
            history=history,
            graph_data=graph_data,
        )

        # --- Layer 1: Real-time scoring ---
        if_score = self.isolation_forest.predict_score(features)
        gbt_score = self.gbt_classifier.predict_score(features)

        # Ensemble
        ensemble_score = (
            self.weights["rules"] * rule_score
            + self.weights["isolation_forest"] * if_score
            + self.weights["gbt"] * gbt_score
        )
        ensemble_score = round(min(100.0, ensemble_score), 2)

        latency_ms = round((time.time() - start_time) * 1000, 1)

        # Determine severity
        if ensemble_score >= 70:
            severity = "critical"
            decision = "block"
        elif ensemble_score >= 45:
            severity = "high"
            decision = "flag"
        elif ensemble_score >= 25:
            severity = "medium"
            decision = "flag"
        else:
            severity = "low"
            decision = "approve"

        result = {
            "account_id": account_id,
            "amount": amount,
            "type": txn_type,
            "timestamp": timestamp.isoformat(),
            "model_version": self.model_version,
            "ensemble_score": ensemble_score,
            "severity": severity,
            "decision": decision,
            "flagged": ensemble_score >= 45,
            "model_scores": {
                "rule_engine": round(rule_score, 2),
                "isolation_forest": if_score,
                "gradient_boost": gbt_score,
            },
            "weights": self.weights.copy(),
            "feature_count": N_FEATURES,
            "latency_ms": latency_ms,
        }

        # Log prediction for audit trail
        self._log_prediction(result)

        return result

    def _log_prediction(self, result: dict):
        """Store prediction for ML audit trail and model monitoring."""
        self.predictions_log.append({
            "timestamp": result["timestamp"],
            "account_id": result["account_id"],
            "amount": result["amount"],
            "ensemble_score": result["ensemble_score"],
            "model_scores": result["model_scores"],
            "decision": result["decision"],
            "latency_ms": result["latency_ms"],
            "model_version": result["model_version"],
        })
        # Keep last 1000 predictions in memory
        if len(self.predictions_log) > 1000:
            self.predictions_log = self.predictions_log[-1000:]

    def get_model_stats(self) -> dict:
        """Return model performance statistics for monitoring dashboard."""
        if not self.predictions_log:
            return {
                "model_version": self.model_version,
                "total_predictions": 0,
                "avg_latency_ms": 0,
            }

        scores = [p["ensemble_score"] for p in self.predictions_log]
        latencies = [p["latency_ms"] for p in self.predictions_log]
        flagged = sum(1 for p in self.predictions_log if p["ensemble_score"] >= 45)

        return {
            "model_version": self.model_version,
            "total_predictions": len(self.predictions_log),
            "flagged_count": flagged,
            "flag_rate": round(flagged / len(self.predictions_log) * 100, 2),
            "avg_score": round(statistics.mean(scores), 2),
            "max_score": round(max(scores), 2),
            "avg_latency_ms": round(statistics.mean(latencies), 2),
            "p95_latency_ms": round(sorted(latencies)[int(len(latencies) * 0.95)], 2),
            "weights": self.weights,
            "feature_count": N_FEATURES,
            "feature_names": FEATURE_NAMES,
        }

    def save_models(self, path: str | None = None):
        """Persist trained models to disk."""
        save_dir = path or MODEL_DIR
        os.makedirs(save_dir, exist_ok=True)

        with open(os.path.join(save_dir, "isolation_forest.pkl"), "wb") as f:
            pickle.dump(self.isolation_forest, f)

        if self.gbt_classifier._use_sklearn and self.gbt_classifier.model:
            with open(os.path.join(save_dir, "gbt_classifier.pkl"), "wb") as f:
                pickle.dump(self.gbt_classifier.model, f)

        meta = {
            "model_version": self.model_version,
            "weights": self.weights,
            "feature_names": FEATURE_NAMES,
            "saved_at": datetime.now().isoformat(),
        }
        with open(os.path.join(save_dir, "model_meta.json"), "w") as f:
            json.dump(meta, f, indent=2)

        logger.info(f"Models saved to {save_dir}")

    def load_models(self, path: str | None = None):
        """Load trained models from disk."""
        load_dir = path or MODEL_DIR
        try:
            with open(os.path.join(load_dir, "isolation_forest.pkl"), "rb") as f:
                self.isolation_forest = pickle.load(f)

            gbt_path = os.path.join(load_dir, "gbt_classifier.pkl")
            if os.path.exists(gbt_path):
                with open(gbt_path, "rb") as f:
                    self.gbt_classifier.model = pickle.load(f)
                    self.gbt_classifier._fitted = True
                    self.gbt_classifier._use_sklearn = True

            logger.info(f"Models loaded from {load_dir}")
        except FileNotFoundError:
            logger.warning(f"No saved models found at {load_dir}, using freshly trained")
