from datetime import UTC, datetime
from enum import StrEnum

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy import (
    Enum as SAEnum,
)
from sqlalchemy.orm import relationship

from bank_system.core.db import Base


class UserRole(StrEnum):
    admin = "admin"
    analyst = "analyst"
    user = "user"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), default=UserRole.user, nullable=False)
    mfa_enabled = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    is_locked = Column(Boolean, default=False)
    failed_login_attempts = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)

    accounts = relationship("Account", back_populates="owner")


class SessionToken(Base):
    __tablename__ = "session_tokens"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    jti = Column(String(64), unique=True, nullable=False)
    token_type = Column(String(20), nullable=False)  # access | refresh
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    revoked = Column(Boolean, default=False, nullable=False)

    # Device tracking for session management
    device_name = Column(String(255), nullable=True)
    ip_address = Column(String(64), nullable=True)
    user_agent = Column(String(512), nullable=True)
    location = Column(String(255), nullable=True)
    last_active = Column(DateTime, default=lambda: datetime.now(UTC))


class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    account_number = Column(String(32), unique=True, index=True, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    account_type = Column(String(20), default="savings")
    balance = Column(Numeric(19, 4), default=0.0)
    currency = Column(String(10), default="USD")
    status = Column(String(20), default="active")  # active | frozen | closed
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)

    owner = relationship("User", back_populates="accounts")
    transactions = relationship(
        "Transaction",
        back_populates="account",
        order_by="Transaction.created_at",
        foreign_keys="[Transaction.account_id]",
    )


class TransactionType(StrEnum):
    deposit = "deposit"
    withdrawal = "withdrawal"
    transfer = "transfer"
    interest = "interest"
    emi = "emi"


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False, index=True)
    counterparty_account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)
    amount = Column(Numeric(19, 4), nullable=False)
    type = Column(SAEnum(TransactionType), nullable=False)
    description = Column(String(255), default="")
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), index=True)
    is_simulated = Column(Boolean, default=False)
    fraud_score = Column(Numeric(10, 4), default=0.0)
    risk_level = Column(String(10), default="low")

    account = relationship(
        "Account",
        foreign_keys=[account_id],
        back_populates="transactions",
    )


class LoanStatus(StrEnum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    active = "active"
    closed = "closed"


class Loan(Base):
    __tablename__ = "loans"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False, index=True)
    principal = Column(Numeric(19, 4), nullable=False)
    interest_rate = Column(Numeric(8, 4), nullable=False)
    term_months = Column(Integer, nullable=False)
    credit_score = Column(Integer, nullable=False)
    debt_to_income = Column(Numeric(8, 4), nullable=False)
    status = Column(SAEnum(LoanStatus), default=LoanStatus.pending)
    approval_probability = Column(Numeric(8, 4), default=0.0)
    risk_tier = Column(String(20), default="medium")
    emi_amount = Column(Numeric(19, 4), default=0.0)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))


class FraudAlertSeverity(StrEnum):
    low = "low"
    medium = "medium"
    high = "high"


class FraudAlert(Base):
    __tablename__ = "fraud_alerts"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    score = Column(Numeric(10, 4), nullable=False)
    severity = Column(SAEnum(FraudAlertSeverity), nullable=False)
    reason = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
    acknowledged = Column(Boolean, default=False)


class AMLNode(Base):
    __tablename__ = "aml_nodes"

    id = Column(Integer, primary_key=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), unique=True)
    risk_score = Column(Numeric(10, 4), default=0.0)
    last_updated = Column(DateTime, default=lambda: datetime.now(UTC))


class AMLEdge(Base):
    __tablename__ = "aml_edges"

    id = Column(Integer, primary_key=True)
    from_account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    to_account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    weight = Column(Numeric(10, 4), default=0.0)
    last_tx_at = Column(DateTime, default=lambda: datetime.now(UTC))

    __table_args__ = (UniqueConstraint("from_account_id", "to_account_id", name="uq_aml_edge_pair"),)


class SecurityEventType(StrEnum):
    login_success = "login_success"
    login_failure = "login_failure"
    mfa_challenge = "mfa_challenge"
    mfa_failure = "mfa_failure"
    account_lockout = "account_lockout"


class SecurityEvent(Base):
    __tablename__ = "security_events"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    username = Column(String(50), nullable=True)
    event_type = Column(SAEnum(SecurityEventType), nullable=False)
    ip_address = Column(String(64), nullable=True)
    user_agent = Column(String(255), nullable=True)
    location = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
    details = Column(Text, nullable=True)


class FinancialHealthSnapshot(Base):
    __tablename__ = "financial_health_snapshots"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    health_score = Column(Integer, nullable=False)
    risk_exposure = Column(Numeric(10, 4), nullable=False)
    savings_consistency = Column(Numeric(10, 4), nullable=False)
    spending_discipline = Column(Numeric(10, 4), nullable=False)
    recommendations = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))


class PortfolioHolding(Base):
    __tablename__ = "portfolio_holdings"

    id = Column(Integer, primary_key=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    asset_class = Column(String(50), nullable=False)  # equity, bond, cash, crypto, etc.
    allocation_pct = Column(Numeric(8, 4), nullable=False)
    expected_return = Column(Numeric(8, 4), nullable=False)
    risk = Column(Numeric(8, 4), nullable=False)


class ForecastSnapshot(Base):
    __tablename__ = "forecast_snapshots"

    id = Column(Integer, primary_key=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)
    horizon_days = Column(Integer, nullable=False)
    payload_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))


class IPWhitelist(Base):
    __tablename__ = "ip_whitelist"

    id = Column(Integer, primary_key=True)
    ip_address = Column(String(64), unique=True, nullable=False)
    label = Column(String(128), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
    is_active = Column(Boolean, default=True, nullable=False)


# ═══════════════════════════════════════════════════════════════════════════
# v4.0 — New Models for Architecture Upgrade
# ═══════════════════════════════════════════════════════════════════════════


class LedgerEntryType(StrEnum):
    debit = "debit"
    credit = "credit"


class LedgerEntry(Base):
    """
    Double-entry accounting ledger. Every financial operation creates exactly
    two entries: a debit (money out) and a credit (money in). The sum of all
    entries for an account equals its balance — no direct balance mutation.

    This replaces the old pattern of `account.balance += amount` with
    proper auditable, reconcilable ledger entries.
    """

    __tablename__ = "ledger_entries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False, index=True)
    entry_type = Column(SAEnum(LedgerEntryType), nullable=False)
    amount = Column(Numeric(19, 4), nullable=False)
    balance_after = Column(Numeric(19, 4), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), index=True)


class KYCStatus(StrEnum):
    pending = "pending"
    in_review = "in_review"
    approved = "approved"
    rejected = "rejected"
    expired = "expired"


class KYCVerification(Base):
    """
    KYC (Know Your Customer) identity verification pipeline.
    Tracks document submissions, provider responses, and risk assessments.
    Supports multiple providers: Onfido, Jumio, Sumsub, etc.
    """

    __tablename__ = "kyc_verifications"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    status = Column(SAEnum(KYCStatus), default=KYCStatus.pending, nullable=False)
    document_type = Column(String(50), nullable=True)  # passport, drivers_license, id_card
    document_hash = Column(String(64), nullable=True)  # SHA-256 of document for dedup
    provider = Column(String(50), nullable=True)  # onfido, jumio, sumsub
    provider_ref = Column(String(128), nullable=True)  # External reference ID
    risk_level = Column(String(10), default="medium")
    rejection_reason = Column(Text, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))


class FraudDecision(StrEnum):
    approve = "approve"
    flag = "flag"
    block = "block"


class FraudPrediction(Base):
    """
    ML model prediction audit trail. Stores every fraud score computation
    for regulatory explainability (required by EU AI Act, US SR 11-7).
    Includes model version, individual model scores, features used,
    and inference latency for performance monitoring.
    """

    __tablename__ = "fraud_predictions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False, index=True)
    model_version = Column(String(20), nullable=False)
    composite_score = Column(Numeric(6, 4), nullable=False)
    model_scores = Column(Text, nullable=False)  # JSON: {isolation_forest: 0.7, gbt: 0.3, ...}
    features_used = Column(Text, nullable=True)  # JSON: feature vector for reproducibility
    decision = Column(SAEnum(FraudDecision), nullable=False)
    latency_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), index=True)


class TransactionEvent(Base):
    """
    Event sourcing for transactions. Instead of storing only final state,
    we record every state change as an immutable event. This enables:
    - Full audit trail reconstruction
    - Time-travel debugging
    - Event replay for system recovery
    - CQRS read model rebuilding
    """

    __tablename__ = "transaction_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    aggregate_id = Column(String(64), nullable=False, index=True)  # Transaction or account ID
    event_type = Column(String(50), nullable=False)  # txn.initiated, txn.validated, txn.completed
    event_data = Column(Text, nullable=False)  # JSON payload
    sequence_num = Column(Integer, nullable=False)
    source_service = Column(String(50), default="banking-service")
    correlation_id = Column(String(64), nullable=True)  # Links related events across services
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), index=True)

    __table_args__ = (
        UniqueConstraint("aggregate_id", "sequence_num", name="uq_event_aggregate_seq"),
    )


class PaymentFrequency(StrEnum):
    daily = "daily"
    weekly = "weekly"
    biweekly = "biweekly"
    monthly = "monthly"
    quarterly = "quarterly"


class ScheduledPayment(Base):
    """
    Recurring payment scheduler. Supports daily, weekly, biweekly,
    monthly, and quarterly frequencies. Integrates with the transaction
    queue (DSA: Queue) for FIFO processing on trigger.
    """

    __tablename__ = "scheduled_payments"

    id = Column(Integer, primary_key=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False, index=True)
    recipient_account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)
    recipient_external = Column(String(255), nullable=True)  # External account/IBAN
    amount = Column(Numeric(19, 4), nullable=False)
    currency = Column(String(10), default="USD")
    frequency = Column(SAEnum(PaymentFrequency), nullable=False)
    description = Column(String(255), default="")
    next_run_at = Column(DateTime, nullable=False)
    last_run_at = Column(DateTime, nullable=True)
    run_count = Column(Integer, default=0)
    max_runs = Column(Integer, nullable=True)  # NULL = unlimited
    status = Column(String(20), default="active")  # active, paused, completed, cancelled
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))

