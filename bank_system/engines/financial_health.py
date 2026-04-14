from typing import List

from sqlalchemy.orm import Session

from bank_system.models.db_models import Account, FinancialHealthSnapshot, Transaction, TransactionType
from bank_system.schemas.intelligence import FinancialHealthSummary


class FinancialHealthEngine:
    def compute_for_user(self, db: Session, user_id: int) -> FinancialHealthSummary:
        accounts = db.query(Account).filter(Account.owner_id == user_id).all()
        if not accounts:
            snap = FinancialHealthSnapshot(
                user_id=user_id,
                health_score=0,
                risk_exposure=0.0,
                savings_consistency=0.0,
                spending_discipline=0.0,
                recommendations="Create your first savings account to start building financial history.",
            )
            db.add(snap)
            db.commit()
            db.refresh(snap)
            return FinancialHealthSummary(
                health_score=0,
                risk_exposure=0.0,
                savings_consistency=0.0,
                spending_discipline=0.0,
                recommendations=snap.recommendations,
                created_at=snap.created_at,
            )

        balances = [a.balance for a in accounts]
        total_balance = sum(balances)
        risk_exposure = 0.0 if total_balance <= 0 else min(1.0, len(accounts) / 5.0)

        txs: List[Transaction] = (
            db.query(Transaction)
            .join(Account)
            .filter(Account.owner_id == user_id)
            .order_by(Transaction.created_at.desc())
            .limit(200)
            .all()
        )
        deposits = [t for t in txs if t.type == TransactionType.deposit]
        withdrawals = [t for t in txs if t.type == TransactionType.withdrawal]
        savings_consistency = min(1.0, len(deposits) / 20.0)
        spending_discipline = 1.0 - min(1.0, len(withdrawals) / 40.0)

        base = 50
        base += int(20 * savings_consistency)
        base += int(20 * spending_discipline)
        base -= int(10 * risk_exposure)
        health_score = max(0, min(100, base))

        if health_score >= 80:
            rec = "Excellent habits. Consider increasing investments in growth assets."
        elif health_score >= 60:
            rec = "Good position. Automate monthly savings and track discretionary spend."
        elif health_score >= 40:
            rec = "Review high-cost debt and set up a realistic savings plan."
        else:
            rec = "High risk. Focus on emergency fund, reduce debt, and limit new credit."

        snap = FinancialHealthSnapshot(
            user_id=user_id,
            health_score=health_score,
            risk_exposure=risk_exposure,
            savings_consistency=savings_consistency,
            spending_discipline=spending_discipline,
            recommendations=rec,
        )
        db.add(snap)
        db.commit()
        db.refresh(snap)
        return FinancialHealthSummary(
            health_score=health_score,
            risk_exposure=risk_exposure,
            savings_consistency=savings_consistency,
            spending_discipline=spending_discipline,
            recommendations=rec,
            created_at=snap.created_at,
        )

