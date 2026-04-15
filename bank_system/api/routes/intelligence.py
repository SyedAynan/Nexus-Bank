from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from bank_system.api.deps import get_current_active_user, role_required
from bank_system.core.db import get_db
from bank_system.engines.aml import AMLEngine
from bank_system.engines.financial_health import FinancialHealthEngine
from bank_system.engines.portfolio import PortfolioEngine
from bank_system.models.db_models import Account, UserRole
from bank_system.schemas.intelligence import (
    AMLNetworkView,
    FinancialHealthSummary,
    PortfolioInsight,
)

router = APIRouter(prefix="/api/intelligence", tags=["intelligence"])

health_engine = FinancialHealthEngine()
portfolio_engine = PortfolioEngine()
aml_engine = AMLEngine()


@router.get("/financial-health", response_model=FinancialHealthSummary)
def financial_health(
    db: Annotated[Session, Depends(get_db)],
    current_user=Depends(get_current_active_user),
):
    return health_engine.compute_for_user(db, current_user.id)


@router.get("/portfolio", response_model=list[PortfolioInsight])
def portfolio(
    account_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user=Depends(get_current_active_user),
):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    if current_user.role == UserRole.user and account.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return portfolio_engine.get_insights_for_account(db, account_id)


@router.get("/aml/network", response_model=AMLNetworkView)
def aml_network(
    db: Annotated[Session, Depends(get_db)],
    current_user=Depends(role_required(UserRole.admin, UserRole.analyst)),
):
    res = aml_engine.run_network_scan(db)
    return AMLNetworkView(
        nodes=[
            {"account_id": n["account_id"], "risk_score": n["risk_score"]}
            for n in res["nodes"]
        ],
        edges=[
            {
                "from_account_id": e["from_account_id"],
                "to_account_id": e["to_account_id"],
                "weight": e["weight"],
            }
            for e in res["edges"]
        ],
    )
