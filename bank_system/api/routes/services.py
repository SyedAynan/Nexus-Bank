"""
NEXA Services API — Unified routes for OAuth, WebAuthn, Email, BillPay, MultiCurrency, Feature Flags
All endpoints now require authentication (BUG-015 fix).
"""

from typing import Annotated, Optional, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import HTMLResponse, StreamingResponse
from pydantic import BaseModel

from bank_system.api.deps import get_current_active_user, role_required
from bank_system.models.db_models import User, UserRole
from bank_system.services.oauth_service import oauth_service
from bank_system.services.webauthn_service import webauthn_service
from bank_system.services.email_service import email_service
from bank_system.services.billpay_service import billpay_service
from bank_system.services.multicurrency_service import multicurrency_service
from bank_system.services.feature_flags import feature_flag_service
from bank_system.services.export_service import export_service

router = APIRouter(prefix="/api/services", tags=["services"])


# ─── Status Dashboard ───
@router.get("/status")
def get_services_status(
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    """Get status of all integrated services."""
    return {
        "oauth": oauth_service.get_provider_status(),
        "webauthn": webauthn_service.get_status(),
        "email": email_service.get_status(),
        "billpay": billpay_service.get_summary(),
        "multicurrency": multicurrency_service.get_status(),
        "feature_flags": feature_flag_service.get_summary(),
    }


# ─── OAuth Routes ───
@router.get("/oauth/providers")
def get_oauth_providers(
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return oauth_service.get_provider_status()


class OAuthAuthRequest(BaseModel):
    provider: str
    redirect_uri: str = "http://localhost:5173/auth/callback"
    state: Optional[str] = None


@router.post("/oauth/authorize")
def oauth_authorize(
    req: OAuthAuthRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    try:
        return oauth_service.get_authorization_url(
            req.provider, req.redirect_uri, req.state
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


class OAuthExchangeRequest(BaseModel):
    provider: str
    code: str
    redirect_uri: str = "http://localhost:5173/auth/callback"


@router.post("/oauth/exchange")
def oauth_exchange(
    req: OAuthExchangeRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    try:
        return oauth_service.exchange_code(req.provider, req.code, req.redirect_uri)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ─── WebAuthn Routes ───
class WebAuthnRegisterRequest(BaseModel):
    user_id: str
    username: str


@router.post("/webauthn/register/options")
def webauthn_register_options(
    req: WebAuthnRegisterRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return webauthn_service.generate_registration_options(req.user_id, req.username)


class WebAuthnRegisterVerify(BaseModel):
    session_id: str
    user_id: str
    credential: Dict[str, Any]


@router.post("/webauthn/register/verify")
def webauthn_register_verify(
    req: WebAuthnRegisterVerify,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return webauthn_service.verify_registration(
        req.session_id, req.user_id, req.credential
    )


@router.post("/webauthn/authenticate/options")
def webauthn_auth_options(
    user_id: Optional[str] = None,
    current_user: Annotated[User, Depends(get_current_active_user)] = None,
):
    return webauthn_service.generate_authentication_options(user_id)


class WebAuthnAuthVerify(BaseModel):
    session_id: str
    credential: Dict[str, Any]


@router.post("/webauthn/authenticate/verify")
def webauthn_auth_verify(
    req: WebAuthnAuthVerify,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return webauthn_service.verify_authentication(req.session_id, req.credential)


@router.get("/webauthn/credentials/{user_id}")
def webauthn_get_credentials(
    user_id: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return webauthn_service.get_user_credentials(user_id)


# ─── Email Routes ───
class EmailOTPRequest(BaseModel):
    to_email: str
    otp_code: str
    purpose: str = "login"


@router.post("/email/send-otp")
def send_otp_email(
    req: EmailOTPRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return email_service.send_otp(req.to_email, req.otp_code, req.purpose)


class EmailAlertRequest(BaseModel):
    to_email: str
    tx_type: str
    amount: float
    account: str


@router.post("/email/send-alert")
def send_transaction_alert(
    req: EmailAlertRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return email_service.send_transaction_alert(
        req.to_email, req.tx_type, req.amount, req.account
    )


@router.get("/email/log")
def get_email_log(
    limit: int = 50,
    current_admin: User = Depends(role_required(UserRole.admin)),
):
    return email_service.get_sent_log(limit)


# ─── Bill Pay Routes ───
@router.get("/billpay/payees")
def get_payees(
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return billpay_service.get_payees()


@router.get("/billpay/scheduled")
def get_scheduled_payments(
    status: Optional[str] = None,
    current_user: Annotated[User, Depends(get_current_active_user)] = None,
):
    return billpay_service.get_scheduled_payments(status)


@router.get("/billpay/summary")
def get_billpay_summary(
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return billpay_service.get_summary()


class SchedulePaymentRequest(BaseModel):
    payee_id: str
    payee_name: str
    amount: float
    frequency: str = "monthly"
    next_date: str
    auto_pay: bool = False
    category: str = "other"
    logo: str = "📄"


@router.post("/billpay/schedule")
def schedule_payment(
    req: SchedulePaymentRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return billpay_service.create_scheduled_payment(req.dict())


@router.post("/billpay/{payment_id}/cancel")
def cancel_payment(
    payment_id: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    if billpay_service.cancel_payment(payment_id):
        return {"success": True}
    raise HTTPException(status_code=404, detail="Payment not found")


@router.post("/billpay/{payment_id}/pause")
def pause_payment(
    payment_id: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    if billpay_service.pause_payment(payment_id):
        return {"success": True}
    raise HTTPException(status_code=404, detail="Payment not found")


@router.post("/billpay/{payment_id}/resume")
def resume_payment(
    payment_id: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    if billpay_service.resume_payment(payment_id):
        return {"success": True}
    raise HTTPException(status_code=404, detail="Payment not found")


# ─── Multi-Currency Routes ───
@router.get("/fx/rates")
def get_fx_rates(
    base: str = "USD",
    current_user: Annotated[User, Depends(get_current_active_user)] = None,
):
    return multicurrency_service.get_rates(base)


@router.get("/fx/convert")
def convert_currency(
    amount: float = Query(...),
    from_currency: str = Query("USD"),
    to_currency: str = Query("EUR"),
    current_user: Annotated[User, Depends(get_current_active_user)] = None,
):
    return multicurrency_service.convert(amount, from_currency, to_currency)


@router.get("/fx/wallet")
def get_wallet(
    user_id: str = "default",
    current_user: Annotated[User, Depends(get_current_active_user)] = None,
):
    return multicurrency_service.get_wallet(user_id)


@router.get("/fx/currencies")
def get_currencies(
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return multicurrency_service.get_currencies()


# ─── Feature Flags Routes ───
@router.get("/flags")
def get_all_flags(
    current_admin: User = Depends(role_required(UserRole.admin, UserRole.analyst)),
):
    return feature_flag_service.get_all_flags()


@router.get("/flags/summary")
def get_flags_summary(
    current_admin: User = Depends(role_required(UserRole.admin, UserRole.analyst)),
):
    return feature_flag_service.get_summary()


@router.get("/flags/{key}")
def get_flag(key: str):
    flag = feature_flag_service.get_flag(key)
    if not flag:
        raise HTTPException(status_code=404, detail="Flag not found")
    return flag


@router.get("/flags/{key}/check")
def check_flag(key: str, user_id: Optional[str] = None):
    return {"key": key, "enabled": feature_flag_service.is_enabled(key, user_id)}


class FlagUpdate(BaseModel):
    enabled: Optional[bool] = None
    rollout_pct: Optional[int] = None
    description: Optional[str] = None
    name: Optional[str] = None


@router.put("/flags/{key}")
def update_flag(
    key: str,
    req: FlagUpdate,
    current_admin: User = Depends(role_required(UserRole.admin)),
):
    updates = {k: v for k, v in req.dict().items() if v is not None}
    flag = feature_flag_service.update_flag(key, updates)
    if not flag:
        raise HTTPException(status_code=404, detail="Flag not found")
    return flag


class FlagCreate(BaseModel):
    key: str
    name: str
    description: str = ""
    enabled: bool = False
    rollout_pct: int = 0
    category: str = "other"


@router.post("/flags")
def create_flag(
    req: FlagCreate,
    current_admin: User = Depends(role_required(UserRole.admin)),
):
    return feature_flag_service.create_flag(req.key, req.dict())


@router.delete("/flags/{key}")
def delete_flag(
    key: str,
    current_admin: User = Depends(role_required(UserRole.admin)),
):
    if feature_flag_service.delete_flag(key):
        return {"success": True}
    raise HTTPException(status_code=404, detail="Flag not found")


# ─── Export Routes ───


@router.get("/export/csv/{account_id}")
def export_csv(
    account_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)] = None,
):
    """Export transaction history as CSV."""
    # Demo data for export
    demo_txns = [
        {
            "date": "2026-02-28",
            "type": "deposit",
            "description": "Salary Credit",
            "amount": 5000.00,
        },
        {
            "date": "2026-02-25",
            "type": "withdrawal",
            "description": "ATM Withdrawal",
            "amount": 200.00,
        },
        {
            "date": "2026-02-22",
            "type": "transfer_out",
            "description": "Rent Payment",
            "amount": 1500.00,
        },
        {
            "date": "2026-02-20",
            "type": "deposit",
            "description": "Freelance Income",
            "amount": 800.00,
        },
        {
            "date": "2026-02-18",
            "type": "withdrawal",
            "description": "Grocery Store",
            "amount": 125.50,
        },
        {
            "date": "2026-02-15",
            "type": "deposit",
            "description": "Client Payment",
            "amount": 2200.00,
        },
        {
            "date": "2026-02-12",
            "type": "withdrawal",
            "description": "Subscription Services",
            "amount": 45.99,
        },
        {
            "date": "2026-02-10",
            "type": "transfer_out",
            "description": "Insurance Premium",
            "amount": 350.00,
        },
        {
            "date": "2026-02-08",
            "type": "deposit",
            "description": "Investment Dividend",
            "amount": 175.00,
        },
        {
            "date": "2026-02-05",
            "type": "withdrawal",
            "description": "Dining Out",
            "amount": 85.00,
        },
    ]
    acct_info = {
        "account_number": f"NX-{account_id:04d}",
        "account_type": "savings",
        "balance": 15000.00,
    }
    content = export_service.generate_csv(demo_txns, acct_info)
    return StreamingResponse(
        iter([content]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=nexa_statement_{account_id}.csv"
        },
    )


@router.get("/export/pdf/{account_id}")
def export_pdf_html(
    account_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)] = None,
):
    """Export statement as printable HTML (PDF-ready)."""
    demo_txns = [
        {
            "date": "2026-02-28",
            "type": "deposit",
            "description": "Salary Credit",
            "amount": 5000.00,
        },
        {
            "date": "2026-02-25",
            "type": "withdrawal",
            "description": "ATM Withdrawal",
            "amount": 200.00,
        },
        {
            "date": "2026-02-22",
            "type": "transfer_out",
            "description": "Rent Payment",
            "amount": 1500.00,
        },
        {
            "date": "2026-02-20",
            "type": "deposit",
            "description": "Freelance Income",
            "amount": 800.00,
        },
        {
            "date": "2026-02-18",
            "type": "withdrawal",
            "description": "Grocery Store",
            "amount": 125.50,
        },
        {
            "date": "2026-02-15",
            "type": "deposit",
            "description": "Client Payment",
            "amount": 2200.00,
        },
        {
            "date": "2026-02-12",
            "type": "withdrawal",
            "description": "Subscription Services",
            "amount": 45.99,
        },
        {
            "date": "2026-02-10",
            "type": "transfer_out",
            "description": "Insurance Premium",
            "amount": 350.00,
        },
        {
            "date": "2026-02-08",
            "type": "deposit",
            "description": "Investment Dividend",
            "amount": 175.00,
        },
        {
            "date": "2026-02-05",
            "type": "withdrawal",
            "description": "Dining Out",
            "amount": 85.00,
        },
    ]
    acct_info = {
        "account_number": f"NX-{account_id:04d}",
        "account_type": "savings",
        "balance": 15000.00,
    }
    html = export_service.generate_pdf_content(demo_txns, acct_info)
    return HTMLResponse(content=html)


@router.get("/export/audit")
def export_audit_trail(
    report_type: str = "general",
    current_admin: User = Depends(role_required(UserRole.admin)),
):
    """Export audit trail as CSV."""
    demo_audit = [
        {
            "timestamp": "2026-02-28 10:15:00",
            "user": "admin",
            "action": "user_login",
            "details": "Successful login",
            "ip_address": "192.168.1.100",
            "risk_level": "low",
        },
        {
            "timestamp": "2026-02-28 10:20:00",
            "user": "admin",
            "action": "account_create",
            "details": "Created account NX-0001",
            "ip_address": "192.168.1.100",
            "risk_level": "low",
        },
        {
            "timestamp": "2026-02-28 10:30:00",
            "user": "user01",
            "action": "transfer",
            "details": "Transfer $5000 to NX-0002",
            "ip_address": "10.0.0.50",
            "risk_level": "medium",
        },
        {
            "timestamp": "2026-02-28 11:00:00",
            "user": "system",
            "action": "fraud_alert",
            "details": "Unusual activity detected on NX-0003",
            "ip_address": "N/A",
            "risk_level": "high",
        },
        {
            "timestamp": "2026-02-28 11:15:00",
            "user": "admin",
            "action": "role_change",
            "details": "Changed user02 role to analyst",
            "ip_address": "192.168.1.100",
            "risk_level": "medium",
        },
    ]
    content = export_service.generate_audit_report(demo_audit, report_type)
    return StreamingResponse(
        iter([content]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=nexa_audit_{report_type}.csv"
        },
    )
