from typing import Dict, List

from sqlalchemy.orm import Session

from bank_system.models.db_models import Account, PortfolioHolding
from bank_system.schemas.intelligence import PortfolioInsight


class PortfolioEngine:
    def get_insights_for_account(
        self, db: Session, account_id: int
    ) -> List[PortfolioInsight]:
        holdings = (
            db.query(PortfolioHolding)
            .filter(PortfolioHolding.account_id == account_id)
            .all()
        )
        if not holdings:
            # synthesize a conservative allocation
            holdings = [
                PortfolioHolding(
                    account_id=account_id,
                    asset_class="cash",
                    allocation_pct=70.0,
                    expected_return=1.0,
                    risk=0.1,
                ),
                PortfolioHolding(
                    account_id=account_id,
                    asset_class="equity",
                    allocation_pct=20.0,
                    expected_return=7.0,
                    risk=0.7,
                ),
                PortfolioHolding(
                    account_id=account_id,
                    asset_class="bond",
                    allocation_pct=10.0,
                    expected_return=3.0,
                    risk=0.3,
                ),
            ]
            db.add_all(holdings)
            db.commit()

        return [
            PortfolioInsight(
                asset_class=h.asset_class,
                allocation_pct=h.allocation_pct,
                expected_return=h.expected_return,
                risk=h.risk,
            )
            for h in holdings
        ]

    def summarize_portfolio(self, db: Session, user_id: int) -> Dict[str, float]:
        accounts = db.query(Account).filter(Account.owner_id == user_id).all()
        if not accounts:
            return {
                "expected_return": 0.0,
                "risk": 0.0,
            }
        # simplified: assume each account uses same synthetic allocation
        base = 5.0
        risk = 0.5 if len(accounts) > 1 else 0.7
        return {"expected_return": base, "risk": risk}

