"""
NEXA — Beyond Fintech | Demo Seed Data
================================
Creates realistic demo data for showcasing the application:
- 5 users (admin, analyst, 3 customers)
- 10 bank accounts across users
- 50+ transactions with realistic patterns
- Fraud alerts, security events, loans
"""

import random
from datetime import datetime, timedelta

from bank_system.core.db import SessionLocal
from bank_system.core.security import hash_password
from bank_system.models.db_models import (
    Account, FraudAlert, Loan, SecurityEvent, SecurityEventType, Transaction, User, UserRole,
)


def seed_if_empty() -> None:
    db = SessionLocal()
    try:
        # Skip if already seeded
        if db.query(User).count() > 1:
            return

        # ── Users ──
        users_data = [
            ("admin", "admin@nexa.demo", "admin123", UserRole.admin),
            ("sarah_analyst", "sarah@nexa.demo", "analyst123", UserRole.analyst),
            ("john_doe", "john@nexa.demo", "user123", UserRole.user),
            ("emily_chen", "emily@nexa.demo", "user123", UserRole.user),
            ("marcus_williams", "marcus@nexa.demo", "user123", UserRole.user),
        ]

        users = {}
        for username, email, password, role in users_data:
            existing = db.query(User).filter_by(username=username).first()
            if existing:
                users[username] = existing
                continue
            user = User(
                username=username,
                email=email,
                hashed_password=hash_password(password),
                role=role,
                created_at=datetime.utcnow() - timedelta(days=random.randint(30, 365)),
            )
            db.add(user)
            db.flush()
            users[username] = user

        db.commit()

        # ── Accounts ──
        accounts_data = [
            ("NB-ADM-001", "admin", "savings", 250000.00),
            ("NB-ADM-002", "admin", "checking", 85000.00),
            ("NB-JHN-001", "john_doe", "savings", 42000.00),
            ("NB-JHN-002", "john_doe", "checking", 12500.00),
            ("NB-JHN-003", "john_doe", "investment", 180000.00),
            ("NB-EML-001", "emily_chen", "savings", 95000.00),
            ("NB-EML-002", "emily_chen", "checking", 32000.00),
            ("NB-MRC-001", "marcus_williams", "savings", 18000.00),
            ("NB-MRC-002", "marcus_williams", "checking", 5500.00),
            ("NB-SAR-001", "sarah_analyst", "savings", 67000.00),
        ]

        accounts = {}
        for acc_num, owner, acc_type, balance in accounts_data:
            existing = db.query(Account).filter_by(account_number=acc_num).first()
            if existing:
                accounts[acc_num] = existing
                continue
            acc = Account(
                account_number=acc_num,
                owner_id=users[owner].id,
                account_type=acc_type,
                balance=balance,
                currency="USD",
                created_at=datetime.utcnow() - timedelta(days=random.randint(10, 200)),
            )
            db.add(acc)
            db.flush()
            accounts[acc_num] = acc

        db.commit()

        # ── Transactions (60 realistic ones) ──
        tx_templates = [
            ("deposit", 1500.00, "Monthly salary deposit"),
            ("deposit", 3200.00, "Freelance payment"),
            ("deposit", 500.00, "Interest credit"),
            ("deposit", 12000.00, "Wire transfer received"),
            ("deposit", 250.00, "Refund - Amazon"),
            ("withdrawal", 850.00, "Rent payment"),
            ("withdrawal", 120.00, "Utility bill - Electric"),
            ("withdrawal", 65.00, "Internet subscription"),
            ("withdrawal", 200.00, "Grocery store"),
            ("withdrawal", 45.00, "Gas station"),
            ("transfer", 2000.00, "Transfer to savings"),
            ("transfer", 500.00, "Transfer to investment"),
            ("deposit", 8500.00, "Quarterly bonus"),
            ("withdrawal", 1200.00, "Insurance premium"),
            ("withdrawal", 350.00, "Restaurant - team dinner"),
        ]

        acc_list = list(accounts.values())
        now = datetime.utcnow()

        for i in range(60):
            template = random.choice(tx_templates)
            src_acc = random.choice(acc_list)
            days_ago = random.randint(0, 90)
            fraud_score = round(random.uniform(0, 0.3), 4)

            # Occasionally create suspicious transactions
            if i % 15 == 0:
                fraud_score = round(random.uniform(0.6, 0.95), 4)

            risk = "low"
            if fraud_score > 0.7:
                risk = "high"
            elif fraud_score > 0.4:
                risk = "medium"

            counter_acc = None
            if template[0] == "transfer":
                other = [a for a in acc_list if a.id != src_acc.id]
                if other:
                    counter_acc = random.choice(other)

            tx = Transaction(
                account_id=src_acc.id,
                counterparty_account_id=counter_acc.id if counter_acc else None,
                amount=round(template[1] * random.uniform(0.5, 2.0), 2),
                type=template[0],
                description=template[2],
                created_at=now - timedelta(days=days_ago, hours=random.randint(0, 23)),
                fraud_score=fraud_score,
                risk_level=risk,
            )
            db.add(tx)

        db.commit()

        # ── Loans ──
        loan_data = [
            ("NB-JHN-001", 25000, 5.5, 36, 720, 0.35, "approved", 0.85, "low"),
            ("NB-EML-001", 150000, 4.2, 360, 780, 0.28, "active", 0.92, "low"),
            ("NB-MRC-001", 10000, 8.9, 24, 620, 0.55, "pending", 0.45, "medium"),
            ("NB-JHN-002", 5000, 12.0, 12, 680, 0.42, "approved", 0.72, "low"),
            ("NB-MRC-002", 50000, 7.5, 48, 590, 0.68, "rejected", 0.25, "high"),
        ]

        for acc_num, principal, rate, term, credit, dti, status, prob, risk in loan_data:
            if acc_num not in accounts:
                continue
            loan = Loan(
                account_id=accounts[acc_num].id,
                principal=principal,
                interest_rate=rate,
                term_months=term,
                credit_score=credit,
                debt_to_income=dti,
                status=status,
                approval_probability=prob,
                risk_tier=risk,
                created_at=now - timedelta(days=random.randint(5, 60)),
            )
            db.add(loan)

        db.commit()

        # ── Fraud Alerts ──
        high_risk_txs = db.query(Transaction).filter(
            Transaction.fraud_score > 0.5
        ).limit(5).all()

        for tx in high_risk_txs:
            severity = "critical" if tx.fraud_score > 0.8 else "high" if tx.fraud_score > 0.6 else "medium"
            reasons = [
                "Unusual transaction amount detected",
                "Transaction outside normal operating hours",
                "Velocity anomaly: multiple rapid transactions",
                "Geographic mismatch with account profile",
                "Amount exceeds historical pattern by 3σ",
            ]
            alert = FraudAlert(
                transaction_id=tx.id,
                account_id=tx.account_id,
                score=tx.fraud_score,
                severity=severity,
                reason=random.choice(reasons),
                created_at=tx.created_at + timedelta(minutes=2),
            )
            db.add(alert)

        db.commit()

        # ── Security Events ──
        event_types = [
            (SecurityEventType.login_success, "admin", "Successful admin login"),
            (SecurityEventType.login_success, "john_doe", "Successful login from Chrome/Windows"),
            (SecurityEventType.login_failure, "emily_chen", "Incorrect password - attempt 1"),
            (SecurityEventType.login_failure, "emily_chen", "Incorrect password - attempt 2"),
            (SecurityEventType.login_success, "emily_chen", "Successful login after retry"),
            (SecurityEventType.login_success, "marcus_williams", "New user registration"),
            (SecurityEventType.mfa_challenge, "admin", "MFA enabled for admin account"),
            (SecurityEventType.login_success, "john_doe", "Password changed successfully"),
            (SecurityEventType.login_success, "sarah_analyst", "Analyst login from office IP"),
            (SecurityEventType.login_failure, "unknown_user", "Brute force attempt detected"),
            (SecurityEventType.login_failure, "unknown_user", "Rate limited - IP blocked"),
            (SecurityEventType.account_lockout, "unknown_user", "Account locked after 5 failures"),
        ]

        for event_type, username, details in event_types:
            event = SecurityEvent(
                username=username,
                event_type=event_type,
                ip_address=f"192.168.{random.randint(1, 255)}.{random.randint(1, 255)}",
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0",
                created_at=now - timedelta(days=random.randint(0, 30), hours=random.randint(0, 23)),
                details=details,
            )
            db.add(event)

        db.commit()

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
