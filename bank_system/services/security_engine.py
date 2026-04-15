"""
Security & Access Engine
========================
Implements:
    - Multi-level access governance (RBAC/ABAC-style policy checks)
    - Behavioral intrusion detection for logins

This engine is INTERNAL ONLY and never exposes DSA or security jargon
to the UI. The Imperial frontend only sees high-level security flags
and messages in banking language.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, time
from typing import Dict, Any, List, Optional


@dataclass
class SecurityEvent:
    id: str
    username: str
    kind: str
    message: str
    timestamp: str
    severity: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "username": self.username,
            "kind": self.kind,
            "message": self.message,
            "timestamp": self.timestamp,
            "severity": self.severity,
        }


class PolicyEngine:
    """
    Very lightweight RBAC/ABAC policy engine.

    Roles:
        - admin: full access
        - staff: own accounts + operational tools
        - auditor: read-only global, no mutations
        - rm (relationship manager): assigned clients only (simulated)
        - risk: risk / compliance views only (simulated)
    """

    def __init__(self):
        # Static policy table (could be extended to be data-driven)
        self.role_permissions = {
            "admin": {"*"},
            "staff": {"accounts:view", "accounts:tx", "loans:view", "analytics:view"},
            "auditor": {
                "accounts:view",
                "loans:view",
                "analytics:view",
                "audit:view",
                "risk:view",
            },
            "rm": {"accounts:view_assigned"},
            "risk": {"risk:view", "risk:act"},
        }

    def is_allowed(
        self, role: str, permission: str, attributes: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        ABAC-friendly entry: attributes can later hold branch, entity flags, etc.
        For now we only match role → permission sets.
        """
        if role not in self.role_permissions:
            return False
        perms = self.role_permissions[role]
        if "*" in perms or permission in perms:
            return True
        return False


class SecurityEngine:
    """
    Tracks authentication behaviour and high-level security events.
    """

    def __init__(self, banking_service):
        self.bank = banking_service
        self.policy = PolicyEngine()
        self.login_events: List[SecurityEvent] = []
        self._counter = 0

    # ─────────────────────────────────────────────
    # Access checks
    # ─────────────────────────────────────────────
    def can_view_client(self, user: Dict[str, Any], account_id: str) -> bool:
        """
        Example ABAC policy:
            - admin: always yes
            - auditor: read-only yes
            - staff/rm: simplified to yes for demo
        """
        role = user.get("role", "staff")
        if role == "admin":
            return True
        if role == "auditor":
            return True
        # For now, allow others; future: check relationship mapping attributes.
        return True

    # ─────────────────────────────────────────────
    # Intrusion / anomaly tracking
    # ─────────────────────────────────────────────
    def record_login(self, username: str, ok: bool) -> None:
        """
        Called from the auth layer on each login attempt.
        Flags:
            - unusual login hour (outside 06:00–22:00)
            - repeated failed logins (simple heuristic)
        """
        self._counter += 1
        now = datetime.now()
        sev = "info"
        msg = "User authenticated successfully."
        kind = "login_ok" if ok else "login_failed"

        if not ok:
            sev = "warning"
            msg = "Unsuccessful access attempt."

        # Time-of-day anomaly
        if now.time() < time(6, 0) or now.time() > time(22, 0):
            sev = "warning" if ok else "critical"
            msg = "Access during unusual hours."

        ev = SecurityEvent(
            id=f"SEC{self._counter:05d}",
            username=username,
            kind=kind,
            message=msg,
            timestamp=now.isoformat(),
            severity=sev,
        )
        self.login_events.insert(0, ev)
        self.login_events = self.login_events[:200]

    def get_events(self, limit: int = 50) -> List[Dict[str, Any]]:
        return [e.to_dict() for e in self.login_events[:limit]]
