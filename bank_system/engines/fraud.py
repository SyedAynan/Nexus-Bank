from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np
from sklearn.ensemble import IsolationForest
from sqlalchemy.orm import Session

from bank_system.models.db_models import (
    FraudAlert,
    FraudAlertSeverity,
    Transaction,
)


@dataclass
class FraudScore:
    composite_score: float
    severity: str
    flagged: bool
    reason: str


class FraudEngine:
    def __init__(self) -> None:
        # Simple IsolationForest on amount and recency features
        self.model = IsolationForest(
            n_estimators=200,
            contamination=0.05,
            random_state=42,
        )
        self._trained = False

    def _build_features(self, txs: list[Transaction]) -> np.ndarray:
        if not txs:
            return np.zeros((0, 2))

        amounts = np.array([float(abs(t.amount)) for t in txs])
        ages = np.array([(txs[-1].created_at - t.created_at).total_seconds() / 3600.0 for t in txs])

        return np.vstack([amounts, ages]).T

    def train(self, db: Session) -> None:
        txs = db.query(Transaction).order_by(Transaction.created_at.desc()).limit(500).all()

        X = self._build_features(txs)

        if len(X) >= 10:
            self.model.fit(X)
            self._trained = True

    def score_transaction(self, db: Session, tx: Transaction) -> FraudScore:
        if not self._trained:
            self.train(db)

        X = np.array([[float(abs(tx.amount)), 0.0]])

        if self._trained:
            score_raw = -float(self.model.decision_function(X)[0])
        else:
            score_raw = abs(tx.amount) / 10_000.0

        composite = max(0.0, min(1.0, score_raw))

        if composite > 0.85:
            severity = "high"
        elif composite > 0.6:
            severity = "medium"
        else:
            severity = "low"

        flagged = composite > 0.6
        reason = "Amount anomaly vs historical pattern" if self._trained else "Heuristic scoring"

        if flagged:
            alert = FraudAlert(
                transaction_id=tx.id,
                account_id=tx.account_id,
                score=composite,
                severity=FraudAlertSeverity[severity],
                reason=reason,
            )
            db.add(alert)
            db.commit()

        return FraudScore(
            composite_score=composite,
            severity=severity,
            flagged=flagged,
            reason=reason,
        )

    def get_open_alerts(self, db: Session, limit: int = 50) -> list[dict[str, Any]]:
        alerts = (
            db.query(FraudAlert)
            .filter(FraudAlert.acknowledged.is_(False))
            .order_by(FraudAlert.created_at.desc())
            .limit(limit)
            .all()
        )

        return [
            {
                "id": a.id,
                "transaction_id": a.transaction_id,
                "account_id": a.account_id,
                "score": a.score,
                "severity": a.severity.value,
                "reason": a.reason,
                "created_at": a.created_at.isoformat(),
            }
            for a in alerts
        ]
