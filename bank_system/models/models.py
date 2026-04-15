"""
Models: Core data models for the banking system.
These are plain Python classes (not DB-backed) for simplicity.
"""

import uuid
from datetime import datetime

from werkzeug.security import generate_password_hash, check_password_hash


def gen_id(prefix=""):
    return prefix + str(uuid.uuid4())[:8].upper()


class Account:
    def __init__(self, owner_name, email, account_type="savings", initial_deposit=0.0):
        self.account_id = gen_id("ACC")
        self.owner_name = owner_name
        self.email = email
        self.account_type = account_type  # savings | checking | business
        self.balance = initial_deposit
        self.status = "active"  # active | frozen | closed
        self.created_at = datetime.now().isoformat()
        self.account_number = int(uuid.uuid4().int % 1_000_000_000)

    def to_dict(self):
        return {
            "account_id": self.account_id,
            "account_number": self.account_number,
            "owner_name": self.owner_name,
            "email": self.email,
            "account_type": self.account_type,
            "balance": self.balance,
            "status": self.status,
            "created_at": self.created_at,
        }


class LoanApplication:
    def __init__(
        self, account_id, owner_name, amount, purpose, credit_score, urgency=0
    ):
        self.loan_id = gen_id("LOAN")
        self.account_id = account_id
        self.owner_name = owner_name
        self.amount = amount
        self.purpose = purpose
        self.credit_score = credit_score  # 300-850
        self.urgency = urgency  # 0=normal, 10=urgent
        self.status = "pending"  # pending | approved | rejected
        self.applied_at = datetime.now().isoformat()
        self.processed_at = None

    def to_dict(self):
        return {
            "loan_id": self.loan_id,
            "account_id": self.account_id,
            "owner_name": self.owner_name,
            "amount": self.amount,
            "purpose": self.purpose,
            "credit_score": self.credit_score,
            "urgency": self.urgency,
            "status": self.status,
            "applied_at": self.applied_at,
            "processed_at": self.processed_at,
        }


class User:
    ROLES = ["admin", "staff", "auditor"]

    def __init__(self, username, password, role="staff"):
        self.user_id = gen_id("USR")
        self.username = username
        self.password_hash = generate_password_hash(password)
        self.role = role
        self.created_at = datetime.now().isoformat()

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "username": self.username,
            "role": self.role,
            "created_at": self.created_at,
        }


class AuditLog:
    def __init__(self, user, action, details, severity="info"):
        self.log_id = gen_id("LOG")
        self.user = user
        self.action = action
        self.details = details
        self.severity = severity  # info | warning | critical
        self.timestamp = datetime.now().isoformat()

    def to_dict(self):
        return {
            "log_id": self.log_id,
            "user": self.user,
            "action": self.action,
            "details": self.details,
            "severity": self.severity,
            "timestamp": self.timestamp,
        }
