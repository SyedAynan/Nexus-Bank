from datetime import datetime
from typing import List

from pydantic import BaseModel


class TimeSeriesPoint(BaseModel):
    timestamp: datetime
    value: float


class ForecastSeries(BaseModel):
    label: str
    points: List[TimeSeriesPoint]


class DashboardKPI(BaseModel):
    total_balance: float
    total_transactions_24h: int
    fraud_alerts_open: int
    active_loans: int
    avg_health_score: float

