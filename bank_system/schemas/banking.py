from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from bank_system.models.db_models import LoanStatus, TransactionType


class AccountCreate(BaseModel):
    account_type: str = "savings"
    currency: str = "USD"
    initial_deposit: float = 0.0


class AccountRead(BaseModel):
    id: int
    account_number: str
    account_type: str
    balance: float
    currency: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class TransactionCreate(BaseModel):
    account_id: int
    counterparty_account_id: Optional[int] = None
    amount: float = Field(gt=0)
    type: TransactionType
    description: str = ""


class TransactionRead(BaseModel):
    id: int
    account_id: int
    counterparty_account_id: Optional[int]
    amount: float
    type: TransactionType
    description: str
    created_at: datetime
    is_simulated: bool
    fraud_score: float
    risk_level: str

    class Config:
        from_attributes = True


class LoanCreate(BaseModel):
    account_id: int
    principal: float
    interest_rate: float
    term_months: int
    credit_score: int
    debt_to_income: float


class LoanRead(BaseModel):
    id: int
    account_id: int
    principal: float
    interest_rate: float
    term_months: int
    credit_score: int
    debt_to_income: float
    status: LoanStatus
    approval_probability: float
    risk_tier: str
    emi_amount: float
    created_at: datetime

    class Config:
        from_attributes = True

