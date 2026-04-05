"""Initial schema — NEXA v3.0

Revision ID: 001_initial
Revises: None
Create Date: 2026-02-27
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Users
    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("username", sa.String(50), unique=True, index=True, nullable=False),
        sa.Column("email", sa.String(255), unique=True, index=True, nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("role", sa.Enum("admin", "analyst", "user", name="userrole"), default="user"),
        sa.Column("is_active", sa.Boolean, default=True),
        sa.Column("is_locked", sa.Boolean, default=False),
        sa.Column("failed_login_attempts", sa.Integer, default=0),
        sa.Column("mfa_secret", sa.String(32), nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )

    # Accounts
    op.create_table(
        "accounts",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("account_number", sa.String(32), unique=True, index=True, nullable=False),
        sa.Column("owner_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("account_type", sa.String(20), default="savings"),
        sa.Column("balance", sa.Numeric(19, 4), default=0.0),
        sa.Column("currency", sa.String(10), default="USD"),
        sa.Column("status", sa.String(20), default="active"),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )

    # Transactions
    op.create_table(
        "transactions",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("account_id", sa.Integer, sa.ForeignKey("accounts.id"), nullable=False, index=True),
        sa.Column("counterparty_account_id", sa.Integer, sa.ForeignKey("accounts.id"), nullable=True),
        sa.Column("amount", sa.Numeric(19, 4), nullable=False),
        sa.Column("type", sa.Enum("deposit", "withdrawal", "transfer", "emi", name="transactiontype"), nullable=False),
        sa.Column("description", sa.String(255), default=""),
        sa.Column("created_at", sa.DateTime, index=True),
        sa.Column("is_simulated", sa.Boolean, default=False),
        sa.Column("fraud_score", sa.Numeric(10, 4), default=0.0),
        sa.Column("risk_level", sa.String(10), default="low"),
    )

    # Loans
    op.create_table(
        "loans",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("account_id", sa.Integer, sa.ForeignKey("accounts.id"), nullable=False, index=True),
        sa.Column("principal", sa.Numeric(19, 4), nullable=False),
        sa.Column("interest_rate", sa.Numeric(8, 4), nullable=False),
        sa.Column("term_months", sa.Integer, nullable=False),
        sa.Column("credit_score", sa.Integer, nullable=False),
        sa.Column("debt_to_income", sa.Numeric(8, 4), nullable=False),
        sa.Column("status", sa.Enum("pending", "approved", "rejected", "active", "closed", name="loanstatus"), default="pending"),
        sa.Column("approval_probability", sa.Numeric(8, 4), default=0.0),
        sa.Column("risk_tier", sa.String(20), default="medium"),
        sa.Column("emi_amount", sa.Numeric(19, 4), default=0.0),
        sa.Column("created_at", sa.DateTime),
    )

    # Fraud Alerts
    op.create_table(
        "fraud_alerts",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("transaction_id", sa.Integer, sa.ForeignKey("transactions.id"), nullable=False),
        sa.Column("account_id", sa.Integer, sa.ForeignKey("accounts.id"), nullable=False),
        sa.Column("score", sa.Numeric(10, 4), nullable=False),
        sa.Column("severity", sa.Enum("low", "medium", "high", "critical", name="fraudalertseverity"), nullable=False),
        sa.Column("reason", sa.Text, nullable=False),
        sa.Column("created_at", sa.DateTime),
        sa.Column("acknowledged", sa.Boolean, default=False),
    )

    # Security Events
    op.create_table(
        "security_events",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id"), nullable=True),
        sa.Column("username", sa.String(50), nullable=True),
        sa.Column("event_type", sa.Enum("login_success", "login_failure", "logout", "registration", "mfa_setup", "password_change", "account_locked", name="securityeventtype"), nullable=False),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("user_agent", sa.String(512), nullable=True),
        sa.Column("created_at", sa.DateTime),
        sa.Column("details", sa.Text, nullable=True),
    )

    # AML Nodes
    op.create_table(
        "aml_nodes",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("account_id", sa.Integer, sa.ForeignKey("accounts.id"), unique=True),
        sa.Column("risk_score", sa.Numeric(10, 4), default=0.0),
        sa.Column("last_updated", sa.DateTime),
    )

    # AML Edges
    op.create_table(
        "aml_edges",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("from_account_id", sa.Integer, sa.ForeignKey("accounts.id"), nullable=False),
        sa.Column("to_account_id", sa.Integer, sa.ForeignKey("accounts.id"), nullable=False),
        sa.Column("weight", sa.Numeric(10, 4), default=0.0),
        sa.Column("last_tx_at", sa.DateTime),
        sa.UniqueConstraint("from_account_id", "to_account_id", name="uq_aml_edge"),
    )

    # Financial Health Snapshots
    op.create_table(
        "financial_health_snapshots",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("health_score", sa.Integer, nullable=False),
        sa.Column("risk_exposure", sa.Numeric(10, 4), nullable=False),
        sa.Column("savings_consistency", sa.Numeric(10, 4), nullable=False),
        sa.Column("spending_discipline", sa.Numeric(10, 4), nullable=False),
        sa.Column("recommendations", sa.Text, nullable=False),
        sa.Column("created_at", sa.DateTime),
    )

    # Portfolio Insights
    op.create_table(
        "portfolio_insights",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("account_id", sa.Integer, sa.ForeignKey("accounts.id"), nullable=False),
        sa.Column("asset_class", sa.String(50), nullable=False),
        sa.Column("allocation_pct", sa.Numeric(8, 4), nullable=False),
        sa.Column("expected_return", sa.Numeric(8, 4), nullable=False),
        sa.Column("risk", sa.Numeric(8, 4), nullable=False),
    )

    # Forecast Snapshots
    op.create_table(
        "forecast_snapshots",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("label", sa.String(50), nullable=False),
        sa.Column("timestamp", sa.DateTime, nullable=False),
        sa.Column("value", sa.Numeric(19, 4), nullable=False),
        sa.Column("created_at", sa.DateTime),
    )


def downgrade() -> None:
    op.drop_table("forecast_snapshots")
    op.drop_table("portfolio_insights")
    op.drop_table("financial_health_snapshots")
    op.drop_table("aml_edges")
    op.drop_table("aml_nodes")
    op.drop_table("security_events")
    op.drop_table("fraud_alerts")
    op.drop_table("loans")
    op.drop_table("transactions")
    op.drop_table("accounts")
    op.drop_table("users")

    # Clean up enums
    sa.Enum(name="userrole").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="transactiontype").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="loanstatus").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="fraudalertseverity").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="securityeventtype").drop(op.get_bind(), checkfirst=True)
