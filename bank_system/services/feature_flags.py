"""
NEXA Feature Flags — A/B Testing + Feature Toggle System
Simple feature flag service for UX experiments and gradual rollouts.
"""

import hashlib
import logging
import time
from typing import Any

logger = logging.getLogger(__name__)


class FeatureFlagService:
    """Feature flag management for A/B testing and gradual rollouts."""

    def __init__(self):
        self._flags: dict[str, dict] = {
            "dark_mode_v2": {
                "name": "Dark Mode V2",
                "description": "Enhanced dark theme with improved contrast ratios",
                "enabled": True,
                "rollout_pct": 100,
                "category": "ui",
                "created_at": time.time() - 86400 * 30,
            },
            "ai_chatbot_v2": {
                "name": "AI Chatbot V2",
                "description": "Upgraded AI assistant with context awareness",
                "enabled": True,
                "rollout_pct": 75,
                "category": "ai",
                "created_at": time.time() - 86400 * 14,
            },
            "biometric_login": {
                "name": "Biometric Login",
                "description": "WebAuthn/Passkey authentication flow",
                "enabled": True,
                "rollout_pct": 50,
                "category": "security",
                "created_at": time.time() - 86400 * 7,
            },
            "multi_currency": {
                "name": "Multi-Currency Wallet",
                "description": "Multi-currency support with FX conversion",
                "enabled": True,
                "rollout_pct": 100,
                "category": "banking",
                "created_at": time.time() - 86400 * 5,
            },
            "real_time_fraud": {
                "name": "Real-Time Fraud Detection",
                "description": "ML-powered fraud detection on every transaction",
                "enabled": True,
                "rollout_pct": 100,
                "category": "security",
                "created_at": time.time() - 86400 * 21,
            },
            "investment_dashboard": {
                "name": "Investment Dashboard",
                "description": "Portfolio tracking and investment analytics",
                "enabled": True,
                "rollout_pct": 60,
                "category": "premium",
                "created_at": time.time() - 86400 * 3,
            },
            "open_banking_api": {
                "name": "Open Banking API",
                "description": "PSD2 compliant third-party data sharing",
                "enabled": False,
                "rollout_pct": 0,
                "category": "compliance",
                "created_at": time.time() - 86400 * 1,
            },
            "advanced_analytics": {
                "name": "Advanced Analytics",
                "description": "Predictive analytics and ML insights",
                "enabled": True,
                "rollout_pct": 90,
                "category": "analytics",
                "created_at": time.time() - 86400 * 10,
            },
        }
        logger.info(f"Feature Flags: {len(self._flags)} flags initialized")

    def is_enabled(self, flag_key: str, user_id: str | None = None) -> bool:
        flag = self._flags.get(flag_key)
        if not flag or not flag["enabled"]:
            return False
        if flag["rollout_pct"] >= 100:
            return True
        if user_id:
            user_hash = int(hashlib.md5(f"{flag_key}-{user_id}".encode()).hexdigest(), 16)
            return (user_hash % 100) < flag["rollout_pct"]
        return True

    def get_all_flags(self) -> list[dict]:
        return [{"key": k, **v} for k, v in self._flags.items()]

    def get_flag(self, key: str) -> dict | None:
        flag = self._flags.get(key)
        if flag:
            return {"key": key, **flag}
        return None

    def update_flag(self, key: str, updates: dict) -> dict | None:
        if key not in self._flags:
            return None
        self._flags[key].update(
            {k: v for k, v in updates.items() if k in ("enabled", "rollout_pct", "description", "name")}
        )
        self._flags[key]["updated_at"] = time.time()
        return {"key": key, **self._flags[key]}

    def create_flag(self, key: str, data: dict) -> dict:
        self._flags[key] = {
            "name": data.get("name", key),
            "description": data.get("description", ""),
            "enabled": data.get("enabled", False),
            "rollout_pct": data.get("rollout_pct", 0),
            "category": data.get("category", "other"),
            "created_at": time.time(),
        }
        return {"key": key, **self._flags[key]}

    def delete_flag(self, key: str) -> bool:
        return bool(self._flags.pop(key, None))

    def get_summary(self) -> dict[str, Any]:
        flags = list(self._flags.values())
        return {
            "total": len(flags),
            "enabled": sum(1 for f in flags if f["enabled"]),
            "disabled": sum(1 for f in flags if not f["enabled"]),
            "full_rollout": sum(1 for f in flags if f["enabled"] and f["rollout_pct"] >= 100),
            "partial_rollout": sum(1 for f in flags if f["enabled"] and 0 < f["rollout_pct"] < 100),
            "categories": list(set(f.get("category", "other") for f in flags)),
        }


# Singleton
feature_flag_service = FeatureFlagService()
