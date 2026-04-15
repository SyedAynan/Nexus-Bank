from datetime import datetime, timedelta

import numpy as np
from sqlalchemy.orm import Session
from statsmodels.tsa.holtwinters import ExponentialSmoothing

from bank_system.models.db_models import ForecastSnapshot, Transaction, TransactionType
from bank_system.schemas.analytics import ForecastSeries, TimeSeriesPoint


class ForecastingEngine:
    def build_cashflow_forecast(
        self, db: Session, horizon_days: int = 30
    ) -> list[ForecastSeries]:
        now = datetime.utcnow()
        since = now - timedelta(days=90)
        txs = (
            db.query(Transaction)
            .filter(Transaction.created_at >= since)
            .order_by(Transaction.created_at)
            .all()
        )
        if not txs:
            base = [
                TimeSeriesPoint(timestamp=now + timedelta(days=i), value=0.0)
                for i in range(horizon_days)
            ]
            return [ForecastSeries(label="net_flow", points=base)]

        daily = {}
        for tx in txs:
            day = tx.created_at.date()
            sign = 1.0
            if tx.type in (TransactionType.withdrawal, TransactionType.emi):
                sign = -1.0
            daily.setdefault(day, 0.0)
            daily[day] += sign * tx.amount

        days_sorted = sorted(daily.keys())
        y = np.array([daily[d] for d in days_sorted])
        try:
            model = ExponentialSmoothing(y, trend="add", seasonal=None)
            fit = model.fit(optimized=True)
            forecast_vals = fit.forecast(horizon_days)
        except Exception:
            forecast_vals = np.repeat(y.mean(), horizon_days)

        series = [
            TimeSeriesPoint(timestamp=now + timedelta(days=i), value=float(v))
            for i, v in enumerate(forecast_vals)
        ]
        snap = ForecastSnapshot(
            account_id=None,
            horizon_days=horizon_days,
            payload_json="",
        )
        db.add(snap)
        db.commit()
        return [ForecastSeries(label="net_flow", points=series)]
