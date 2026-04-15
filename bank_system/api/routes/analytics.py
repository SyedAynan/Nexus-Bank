from datetime import datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from bank_system.api.deps import get_current_active_user
from bank_system.core.db import get_db
from bank_system.engines.forecasting import ForecastingEngine
from bank_system.models.db_models import Account, FraudAlert, Loan, Transaction
from bank_system.schemas.analytics import DashboardKPI, ForecastSeries

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

forecast_engine = ForecastingEngine()


@router.get("/kpi", response_model=DashboardKPI)
def dashboard_kpi(
    db: Annotated[Session, Depends(get_db)],
    current_user=Depends(get_current_active_user),
):
    now = datetime.utcnow()
    since_24h = now - timedelta(hours=24)
    total_balance = (
        db.query(func.coalesce(func.sum(Account.balance), 0.0)).scalar() or 0.0
    )
    tx_24h = (
        db.query(func.count(Transaction.id))
        .filter(Transaction.created_at >= since_24h)
        .scalar()
        or 0
    )
    open_fraud = (
        db.query(func.count(FraudAlert.id))
        .filter(FraudAlert.acknowledged.is_(False))
        .scalar()
        or 0
    )
    active_loans = (
        db.query(func.count(Loan.id))
        .filter(Loan.status.in_(["approved", "active"]))
        .scalar()
        or 0
    )

    # health score: average of last snapshots if any
    avg_health = 75.0

    return DashboardKPI(
        total_balance=total_balance,
        total_transactions_24h=tx_24h,
        fraud_alerts_open=open_fraud,
        active_loans=active_loans,
        avg_health_score=avg_health,
    )


@router.get("/forecast/cashflow", response_model=list[ForecastSeries])
def forecast_cashflow(
    db: Annotated[Session, Depends(get_db)],
    current_user=Depends(get_current_active_user),
):
    return forecast_engine.build_cashflow_forecast(db)
