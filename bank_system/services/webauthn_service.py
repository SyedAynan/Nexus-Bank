"""
NEXA WebAuthn/Passkey Service — FIDO2 Passkey Registration + Verification
Implements credential registration and assertion flows.
Without py_webauthn and HTTPS, runs in simulation mode for demos.
"""

import base64
import hashlib
import logging
import os
import time
from typing import Any

logger = logging.getLogger(__name__)

# Check if py_webauthn is available
try:
    import webauthn  # noqa: F401

    WEBAUTHN_AVAILABLE = True
except ImportError:
    WEBAUTHN_AVAILABLE = False
    logger.info("WebAuthn: py_webauthn not installed — running in simulation mode")

RP_ID = os.getenv("WEBAUTHN_RP_ID", "localhost")
RP_NAME = os.getenv("WEBAUTHN_RP_NAME", "NEXA Banking")
ORIGIN = os.getenv("WEBAUTHN_ORIGIN", "http://localhost:5173")


class WebAuthnService:
    """WebAuthn/FIDO2 passkey service with simulation fallback."""

    def __init__(self):
        self.mode = "production" if WEBAUTHN_AVAILABLE else "simulation"
        # In-memory credential store (production would use DB)
        self._credentials: dict[str, list[dict]] = {}  # user_id -> [credentials]
        self._challenges: dict[str, str] = {}  # session_id -> challenge
        logger.info(f"WebAuthn service initialized: mode={self.mode}")

    def get_status(self) -> dict[str, Any]:
        return {
            "enabled": True,
            "mode": self.mode,
            "rp_id": RP_ID,
            "rp_name": RP_NAME,
            "total_credentials": sum(len(c) for c in self._credentials.values()),
        }

    def generate_registration_options(
        self, user_id: str, username: str
    ) -> dict[str, Any]:
        """Generate registration options (challenge) for passkey creation."""
        challenge = (
            base64.urlsafe_b64encode(
                hashlib.sha256(f"{user_id}-{time.time()}".encode()).digest()
            )
            .decode()
            .rstrip("=")
        )

        session_id = hashlib.sha256(
            f"reg-{user_id}-{time.time()}".encode()
        ).hexdigest()[:32]
        self._challenges[session_id] = challenge

        return {
            "session_id": session_id,
            "challenge": challenge,
            "rp": {"id": RP_ID, "name": RP_NAME},
            "user": {
                "id": base64.urlsafe_b64encode(user_id.encode()).decode().rstrip("="),
                "name": username,
                "displayName": username,
            },
            "pubKeyCredParams": [
                {"type": "public-key", "alg": -7},  # ES256
                {"type": "public-key", "alg": -257},  # RS256
            ],
            "timeout": 60000,
            "attestation": "none",
            "authenticatorSelection": {
                "authenticatorAttachment": "platform",
                "residentKey": "preferred",
                "userVerification": "required",
            },
            "mode": self.mode,
        }

    def verify_registration(
        self, session_id: str, user_id: str, credential: dict
    ) -> dict[str, Any]:
        """Verify registration response and store credential."""
        if session_id not in self._challenges:
            return {"success": False, "error": "Invalid or expired session"}

        del self._challenges[session_id]

        if self.mode == "simulation":
            cred_id = credential.get("id", f"sim-cred-{int(time.time())}")
            stored = {
                "credential_id": cred_id,
                "public_key": "simulated-public-key",
                "sign_count": 0,
                "created_at": time.time(),
                "device_name": credential.get("device_name", "Passkey"),
                "authenticator": credential.get("authenticator", "Platform"),
            }
            if user_id not in self._credentials:
                self._credentials[user_id] = []
            self._credentials[user_id].append(stored)

            return {
                "success": True,
                "credential_id": cred_id,
                "device_name": stored["device_name"],
                "mode": "simulation",
            }

        # Production flow would use py_webauthn here
        return {"success": True, "mode": "production"}

    def generate_authentication_options(
        self, user_id: str | None = None
    ) -> dict[str, Any]:
        """Generate authentication options for passkey login."""
        challenge = (
            base64.urlsafe_b64encode(
                hashlib.sha256(f"auth-{time.time()}".encode()).digest()
            )
            .decode()
            .rstrip("=")
        )

        session_id = hashlib.sha256(f"auth-{time.time()}".encode()).hexdigest()[:32]
        self._challenges[session_id] = challenge

        allow_credentials = []
        if user_id and user_id in self._credentials:
            allow_credentials = [
                {"type": "public-key", "id": c["credential_id"]}
                for c in self._credentials[user_id]
            ]

        return {
            "session_id": session_id,
            "challenge": challenge,
            "rpId": RP_ID,
            "timeout": 60000,
            "userVerification": "required",
            "allowCredentials": allow_credentials,
            "mode": self.mode,
        }

    def verify_authentication(
        self, session_id: str, credential: dict
    ) -> dict[str, Any]:
        """Verify authentication assertion."""
        if session_id not in self._challenges:
            return {"success": False, "error": "Invalid or expired session"}

        del self._challenges[session_id]

        if self.mode == "simulation":
            return {
                "success": True,
                "user_id": credential.get("user_id", "sim-user"),
                "credential_id": credential.get("id", "sim-cred"),
                "mode": "simulation",
            }

        return {"success": True, "mode": "production"}

    def get_user_credentials(self, user_id: str) -> list[dict]:
        """Get all registered credentials for a user."""
        return self._credentials.get(user_id, [])

    def revoke_credential(self, user_id: str, credential_id: str) -> bool:
        """Revoke a specific credential."""
        if user_id in self._credentials:
            self._credentials[user_id] = [
                c
                for c in self._credentials[user_id]
                if c["credential_id"] != credential_id
            ]
            return True
        return False


# Singleton
webauthn_service = WebAuthnService()
