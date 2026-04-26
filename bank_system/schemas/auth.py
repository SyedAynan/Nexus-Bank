"""
File: auth.py
Module: bank_system.schemas.auth

Purpose:
    Pydantic models (schemas) for authentication request/response validation.
    These define the exact shape of data entering and leaving auth endpoints,
    providing automatic validation, serialization, and OpenAPI documentation.

Developer Journey:
    - v1: No validation — routes accepted raw dicts. Type errors caused
      500 Internal Server Errors instead of helpful 422 Validation Errors.
    - v2: Added Pydantic models for type-safe request/response handling.
      Pydantic validates types, required fields, and constraints automatically.
    - v3: Added SessionRead for session management UI, MFAChallenge for
      the multi-factor authentication flow.
    - v4: Added ForgotPasswordRequest and ResetPasswordRequest for the
      password reset flow with Redis-backed OTP verification.

Design Decision:
    UserCreate intentionally excludes `role` field — all new users are assigned
    UserRole.user by default. Only admins can promote users via a separate
    PATCH endpoint. This prevents privilege escalation attacks where an
    attacker could register with role="admin".
"""

from datetime import datetime

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
    otp: str | None = None


class MFAChallenge(BaseModel):
    mfa_required: bool = True
    delivery_channel: str = "otp_simulated"


class SessionRead(BaseModel):
    id: int
    device_name: str | None = None
    ip_address: str | None = None
    location: str | None = None
    created_at: datetime
    last_active: datetime | None = None
    is_current: bool = False

    class Config:
        from_attributes = True


class ForgotPasswordRequest(BaseModel):
    email: str  # accepts email or username


class ResetPasswordRequest(BaseModel):
    email: str  # email or username used in forgot-password
    otp: str
    new_password: str
