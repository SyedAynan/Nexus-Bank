from datetime import datetime
from typing import List

from pydantic import BaseModel


class FinancialHealthSummary(BaseModel):
    health_score: int
    risk_exposure: float
    savings_consistency: float
    spending_discipline: float
    recommendations: str
    created_at: datetime


class PortfolioInsight(BaseModel):
    asset_class: str
    allocation_pct: float
    expected_return: float
    risk: float


class AMLNodeView(BaseModel):
    account_id: int
    risk_score: float


class AMLEdgeView(BaseModel):
    from_account_id: int
    to_account_id: int
    weight: float


class AMLNetworkView(BaseModel):
    nodes: List[AMLNodeView]
    edges: List[AMLEdgeView]

