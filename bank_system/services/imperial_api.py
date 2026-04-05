"""
Imperial Capital API — Python-only main logic.
Maps BankingService (DSA-backed) to the Imperial frontend state.
All data and operations are driven by Python; frontend only displays and calls this API.
"""

from datetime import datetime
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def _format_date(dt_str):
    """Convert ISO timestamp to DD/MM/YYYY."""
    if not dt_str:
        return ""
    try:
        dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
        return dt.strftime("%d/%m/%Y")
    except Exception:
        return str(dt_str)[:10]


def _format_time(dt_str):
    """Extract time HH:MM:SS from ISO timestamp."""
    if not dt_str:
        return "00:00:00"
    try:
        dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
        return dt.strftime("%H:%M:%S")
    except Exception:
        return "00:00:00"


def build_imperial_state(bank):
    """
    Build the full IMPERIAL state object from BankingService.
    All data comes from Python backend (DSA structures); no client-side state.
    """
    accounts_raw = bank.get_all_accounts()
    accounts = []
    for a in accounts_raw:
        acc_id = a.get("account_id", "")
        hist = bank.transaction_histories.get(acc_id)
        balance_history = []
        if hist:
            for node in hist.to_list(limit=7):
                balance_history.append(node.get("balance_after", 0))
        if not balance_history and a.get("balance") is not None:
            balance_history = [a["balance"]]

        accounts.append({
            "id": acc_id,
            "name": a.get("owner_name", ""),
            "type": (a.get("account_type") or "Savings").replace("checking", "Current").replace("savings", "Savings").replace("business", "Current"),
            "balance": round(float(a.get("balance", 0)), 2),
            "status": a.get("status", "active"),
            "phone": a.get("phone", "+91 00000 00000"),
            "email": a.get("email", ""),
            "pan": a.get("pan", "—"),
            "aadhaar": a.get("aadhaar", "—"),
            "dob": a.get("dob", "—"),
            "branch": a.get("branch", "Main Branch"),
            "openedDate": _format_date(a.get("created_at", "")),
            "relationshipManager": a.get("relationshipManager", "System"),
            "creditScore": a.get("credit_score", 700),
            "kycStatus": a.get("kycStatus", "complete"),
            "category": a.get("category", "Standard"),
            "balanceHistory": balance_history or [0],
            "failedTxCount": a.get("failedTxCount", 0),
            "lastTxDate": a.get("lastTxDate", _format_date(a.get("created_at", ""))),
        })

    all_txns = bank.get_all_recent_transactions(100)
    transactions = []
    for t in all_txns:
        ts = t.get("timestamp", "")
        ttype = (t.get("type") or "credit").lower()
        if ttype == "deposit":
            ttype = "credit"
        elif ttype == "withdrawal":
            ttype = "debit"
        transactions.append({
            "ref": t.get("transaction_id", ""),
            "date": _format_date(ts),
            "time": _format_time(ts),
            "fromAcc": t.get("account_id", ""),
            "toAcc": None,
            "clientName": _account_name(bank, t.get("account_id", "")),
            "type": ttype,
            "amount": round(float(t.get("amount", 0)), 2),
            "balanceAfter": round(float(t.get("balance_after", 0)), 2),
            "description": t.get("description", ""),
            "channel": "Online",
            "status": "success",
            "processedBy": "System",
            "reversed": False,
            "reversalRef": None,
        })

    pending_loans = bank.get_pending_loans()
    processed = getattr(bank, "processed_loans", []) or []
    loans = []
    for L in processed[:20]:
        loans.append({
            "id": L.get("loan_id", ""),
            "accId": L.get("account_id", ""),
            "clientName": L.get("owner_name", ""),
            "type": (L.get("purpose") or "Personal Loan").title(),
            "principal": round(float(L.get("amount", 0)), 2),
            "rate": 11.5,
            "tenureMonths": 36,
            "emiAmount": round(float(L.get("amount", 0)) / 36, 2),
            "disbursedDate": _format_date(L.get("processed_at", "")),
            "dueDate": "",
            "paidAmount": 0,
            "status": L.get("status", "active"),
            "nextEmiDate": "",
            "nextEmiAmount": 0,
            "notes": "",
        })
    for L in pending_loans[:10]:
        loans.append({
            "id": L.get("loan_id", ""),
            "accId": L.get("account_id", ""),
            "clientName": L.get("owner_name", ""),
            "type": (L.get("purpose") or "Personal Loan").title(),
            "principal": round(float(L.get("amount", 0)), 2),
            "rate": 11.5,
            "tenureMonths": 36,
            "emiAmount": round(float(L.get("amount", 0)) / 36, 2),
            "disbursedDate": "",
            "dueDate": "",
            "paidAmount": 0,
            "status": "pending",
            "nextEmiDate": "",
            "nextEmiAmount": 0,
            "notes": "",
        })

    alerts = []
    try:
        compliance = bank.run_compliance_check()
        for cycle in compliance.get("cycles_detected", [])[:5]:
            if cycle:
                acc_id = cycle[0] if isinstance(cycle[0], str) else str(cycle[0])
                alerts.append({
                    "id": "ALERT-" + acc_id,
                    "accId": acc_id,
                    "clientName": _account_name(bank, acc_id),
                    "severity": "critical",
                    "type": "Circular Transfer Pattern",
                    "amount": 0,
                    "description": "Multiple accounts forming circular transfer chain",
                    "flaggedDate": _format_date(datetime.now().isoformat()),
                    "status": "pending",
                    "reviewedBy": None,
                })
        for hr in compliance.get("high_risk_accounts", [])[:5]:
            aid = hr.get("account_id", hr) if isinstance(hr, dict) else hr
            alerts.append({
                "id": "ALERT-RISK-" + str(aid),
                "accId": str(aid),
                "clientName": _account_name(bank, str(aid)),
                "severity": "high",
                "type": "Unusual Activity",
                "amount": 0,
                "description": "Account flagged in compliance check",
                "flaggedDate": _format_date(datetime.now().isoformat()),
                "status": "pending",
                "reviewedBy": None,
            })
    except Exception:
        pass

    audit_logs = bank.get_audit_logs(limit=50)
    auditLog = []
    for log in audit_logs:
        ts = log.get("timestamp", "")
        if isinstance(ts, str) and "T" in ts:
            ts = ts.replace("T", " ").split(".")[0]
        auditLog.append({
            "timestamp": ts,
            "category": log.get("action", "SYSTEM").split("_")[0] if log.get("action") else "SYSTEM",
            "action": (log.get("action") or "ACTION").replace("_", " "),
            "account": log.get("details", "")[:20] or "—",
            "performedBy": log.get("user", "System"),
            "details": log.get("details", ""),
            "reference": log.get("log_id", "—"),
        })

    analytics = bank.get_analytics()

    return {
        "settings": {
            "bankName": "Imperial Capital",
            "currency": "₹",
            "dateFormat": "DD/MM/YYYY",
            "recordsPerPage": 20,
            "numberFormat": "indian",
            "theme": "royal-dark",
            "minSavingsBalance": 500,
            "minCurrentBalance": 2000,
            "maxDailyWithdrawal": 100000,
            "maxTransferPerTxn": 500000,
            "dormancyMonths": 24,
            "sessionTimeoutMins": 30,
            "autoFreezeAfterFailed": 3,
            "animationsOn": True,
            "notifications": {"transactions": True, "emi": True, "compliance": True},
        },
        "interestRates": {
            "savings": 3.5,
            "premiumSavings": 4.0,
            "current": 0,
            "fd1yr": 6.8,
            "fd3yr": 7.2,
            "homeLoan": 8.5,
            "personalLoan": 12.5,
            "vehicleLoan": 9.5,
            "educationLoan": 7.8,
            "businessLoan": 11.0,
            "goldLoan": 9.0,
        },
        "accounts": accounts,
        "transactions": transactions,
        "loans": loans,
        "alerts": alerts,
        "messages": [],
        "auditLog": auditLog,
        "ui": {
            "currentPage": "dashboard",
            "selectedAccount": accounts[0]["id"] if accounts else None,
            "sidebarCollapsed": False,
            "filterStates": {},
            "sortStates": {},
            "searchQueries": {},
            "pendingTransactions": [],
        },
        "analytics": {
            "totalClients": analytics.get("total_accounts", 0),
            "totalBalance": analytics.get("total_balance", 0),
            "transactionsToday": len(transactions),
            "activeLoans": len(loans),
            "riskAlerts": len(alerts),
            "pendingLoans": analytics.get("pending_loans", 0),
            "queuedTransactions": analytics.get("queued_transactions", 0),
        },
    }


def _account_name(bank, account_id):
    acc = bank.get_account(account_id)
    return (acc.get("owner_name") or account_id) if acc else account_id


def create_account_from_imperial(bank, form_data, user="Administrator"):
    """Create account from Imperial frontend form. All logic in Python."""
    name = form_data.get("name") or form_data.get("owner_name") or form_data.get("clientName", "")
    email = form_data.get("email", "")
    account_type = form_data.get("type") or form_data.get("account_type", "savings")
    initial_deposit = float(form_data.get("initialDeposit") or form_data.get("initial_deposit", 0))
    result = bank.create_account(name, email, account_type, initial_deposit, user=user)
    return result


def process_transaction_from_imperial(bank, from_acc, to_acc, amount, txn_type, description, user="Administrator"):
    """Process transaction from Imperial frontend. All logic in Python."""
    amount = float(amount)
    if txn_type in ("credit", "deposit"):
        r = bank.deposit(from_acc, amount, description or "Credit", user=user)
        return r.get("success"), r.get("transaction_id"), r.get("error")
    if txn_type in ("debit", "withdrawal"):
        r = bank.withdraw(from_acc, amount, description or "Debit", user=user)
        return r.get("success"), r.get("transaction_id"), r.get("error")
    if txn_type == "transfer" and to_acc:
        r = bank.transfer(from_acc, to_acc, amount, user=user)
        return r.get("success"), None, r.get("error")
    return False, None, "Invalid type or missing account"


def reverse_transaction_from_imperial(bank, account_id, user="Administrator"):
    """Reverse last transaction (undo). All logic in Python."""
    r = bank.undo_last_transaction(account_id, user=user)
    return r.get("success"), r.get("error")


def search_clients_imperial(bank, query):
    """Client search for Imperial UI. Uses Python search / name matching."""
    if not query or not str(query).strip():
        accounts = bank.get_all_accounts()
        return [{"id": a.get("account_id"), "name": a.get("owner_name", "")} for a in accounts]
    q = str(query).strip().lower()
    accounts = bank.get_all_accounts()
    out = []
    for a in accounts:
        name = (a.get("owner_name") or "").lower()
        acc_id = (a.get("account_id") or "").lower()
        email = (a.get("email") or "").lower()
        if q in name or q in acc_id or q in email or name.startswith(q) or acc_id.startswith(q):
            out.append({"id": a.get("account_id"), "name": a.get("owner_name", "")})
    return out[:20]


def run_compliance_scan_imperial(bank):
    """Run compliance check and return result. All logic in Python."""
    return bank.run_compliance_check()
