from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr

from bank_system.models.db_models import UserRole


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str
    type: str
    exp: int
    role: UserRole


class UserBase(BaseModel):
    username: str
    email: EmailStr


class UserCreate(UserBase):
    password: str
    # role is intentionally excluded — always assigned as UserRole.user
    # to prevent privilege escalation (only admins can promote via PATCH)


class UserRead(UserBase):
    id: int
    role: UserRole
    created_at: datetime

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    username: str
    password: str
    otp: Optional[str] = None


class MFAChallenge(BaseModel):
    mfa_required: bool = True
    delivery_channel: str = "otp_simulated"


class SessionRead(BaseModel):
    id: int
    device_name: Optional[str] = None
    ip_address: Optional[str] = None
    location: Optional[str] = None
    created_at: datetime
    last_active: Optional[datetime] = None
    is_current: bool = False

    class Config:
        from_attributes = True
