"""
File: engine.py
Module: bank_system.simulation.engine

Purpose:
    Background transaction simulation engine that generates realistic
    banking activity for demonstration and testing. Creates random deposits,
    withdrawals, and EMI deductions at configurable intervals, scores them
    through the fraud detection engine, and broadcasts updates via WebSocket.

Developer Journey:
    - v1: Inline loop in main.py — generated transactions synchronously,
      blocking the entire API during simulation ticks. Every 5 seconds,
      the entire server froze for 100-200ms while the DB operation ran.
    - v2: Moved to an asyncio background task. But SQLAlchemy operations
      are synchronous (blocking I/O), so they still blocked the event loop.
      This caused WebSocket disconnects and API timeouts (BUG-010).
    - v3 (BUG-010 fix): Wrapped synchronous DB operations in asyncio.to_thread()
      to offload them to a thread pool. The event loop stays responsive
      for WebSocket broadcasts and API requests while DB work runs in a thread.
    - v4 (BUG-023 fix): Added balance check before EMI deductions to prevent
      negative balances. Previously, EMIs were deducted even if the account
      had insufficient funds.

Error Recovery:
    Uses exponential backoff (15s, 30s, 60s, 120s max) on consecutive errors.
    This prevents the simulation from hammering a failing database with rapid
    retries while still recovering automatically when the issue resolves.
"""

import asyncio
import logging
import random
from datetime import UTC, datetime

from sqlalchemy.orm import Session

from bank_system.core.config import get_settings
from bank_system.core.db import SessionLocal
from bank_system.core.realtime import get_ws_manager
from bank_system.engines.aml import AMLEngine
from bank_system.engines.fraud import FraudEngine
from bank_system.models.db_models import (
    Account,
    Loan,
    LoanStatus,
    Transaction,
    TransactionType,
)

settings = get_settings()
fraud_engine = FraudEngine()
aml_engine = AMLEngine()

logger = logging.getLogger(__name__)


def _run_simulation_tick() -> dict | None:
    """Synchronous DB work isolated in a plain function so it can be
    dispatched to a thread via ``asyncio.to_thread`` (BUG-010 fix)."""
    db: Session = SessionLocal()
    try:
        accounts = db.query(Account).all()
        if not accounts:
            return None

        account = random.choice(accounts)
        amount = round(random.uniform(10, 500), 2)

        tx_type = random.choice([TransactionType.deposit, TransactionType.withdrawal])

        if tx_type == TransactionType.withdrawal and float(account.balance) < amount:
            tx_type = TransactionType.deposit

        if tx_type == TransactionType.deposit:
            account.balance = float(account.balance) + amount
        else:
            account.balance = float(account.balance) - amount

        tx = Transaction(
            account_id=account.id,
            amount=amount,
            type=tx_type,
            description="Simulated activity",
            is_simulated=True,
        )

        db.add(tx)
        db.commit()
        db.refresh(tx)

        score = fraud_engine.score_transaction(db, tx)

        # ── EMI Deductions (with balance check — BUG-023 fix) ──
        active_loans = db.query(Loan).filter(Loan.status == LoanStatus.active).all()
        for loan in active_loans:
            acct = db.query(Account).get(loan.account_id)
            if acct and float(acct.balance) >= float(loan.emi_amount):
                acct.balance = float(acct.balance) - float(loan.emi_amount)
                emi_tx = Transaction(
                    account_id=acct.id,
                    amount=float(loan.emi_amount),
                    type=TransactionType.emi,
                    description="Simulated EMI deduction",
                    is_simulated=True,
                )
                db.add(emi_tx)

        db.commit()

        aml_engine.run_network_scan(db)

        return {
            "type": "tick",
            "sim_time": datetime.now(UTC).isoformat(),
            "account_id": account.id,
            "balance": float(account.balance),
            "tx_amount": amount,
            "tx_type": tx_type.value,
            "fraud_score": float(score.composite_score),
            "fraud_severity": score.severity,
        }
    finally:
        db.close()


async def simulation_loop():
    """Background simulation loop with error recovery and exponential backoff.
    BUG-010: DB operations are offloaded to a thread so the async event loop
    stays responsive for WebSocket broadcasts and API requests."""
    logger.info("Simulation engine started.")
    consecutive_errors = 0
    max_backoff = 120  # Max 2-minute backoff

    ws_manager = get_ws_manager()

    while True:
        try:
            await asyncio.sleep(settings.simulation_tick_seconds)

            # BUG-010 fix: run synchronous DB work in a thread
            payload = await asyncio.to_thread(_run_simulation_tick)

            if payload:
                await ws_manager.broadcast(payload)

            # Reset error counter on success
            consecutive_errors = 0

        except Exception as e:
            consecutive_errors += 1
            backoff = min(15 * (2**consecutive_errors), max_backoff)
            logger.error(f"Simulation error (attempt {consecutive_errors}): {e}. Retrying in {backoff}s.")
            await asyncio.sleep(backoff)
