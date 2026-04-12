"""
NEXA Multi-Currency Service — FX Rates + Multi-Currency Wallet
Static FX rates with fallback. Can be upgraded to live API (Fixer.io, ExchangeRate-API).
"""
import os
import time
import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

FX_API_KEY = os.getenv("FX_API_KEY", "")

# Static FX rates (USD base) — updated periodically in production
STATIC_RATES = {
    "USD": 1.0,
    "EUR": 0.92,
    "GBP": 0.79,
    "JPY": 149.50,
    "CAD": 1.36,
    "AUD": 1.53,
    "CHF": 0.88,
    "CNY": 7.24,
    "INR": 83.12,
    "BRL": 4.97,
    "MXN": 17.15,
    "SGD": 1.34,
    "HKD": 7.83,
    "KRW": 1320.50,
    "ZAR": 18.65,
    "AED": 3.67,
    "SAR": 3.75,
    "NZD": 1.64,
    "SEK": 10.42,
    "NOK": 10.55,
}

CURRENCY_INFO = {
    "USD": {"name": "US Dollar", "symbol": "$", "flag": "🇺🇸"},
    "EUR": {"name": "Euro", "symbol": "€", "flag": "🇪🇺"},
    "GBP": {"name": "British Pound", "symbol": "£", "flag": "🇬🇧"},
    "JPY": {"name": "Japanese Yen", "symbol": "¥", "flag": "🇯🇵"},
    "CAD": {"name": "Canadian Dollar", "symbol": "C$", "flag": "🇨🇦"},
    "AUD": {"name": "Australian Dollar", "symbol": "A$", "flag": "🇦🇺"},
    "CHF": {"name": "Swiss Franc", "symbol": "CHF", "flag": "🇨🇭"},
    "CNY": {"name": "Chinese Yuan", "symbol": "¥", "flag": "🇨🇳"},
    "INR": {"name": "Indian Rupee", "symbol": "₹", "flag": "🇮🇳"},
    "BRL": {"name": "Brazilian Real", "symbol": "R$", "flag": "🇧🇷"},
    "SGD": {"name": "Singapore Dollar", "symbol": "S$", "flag": "🇸🇬"},
    "AED": {"name": "UAE Dirham", "symbol": "د.إ", "flag": "🇦🇪"},
}


class MultiCurrencyService:
    """Multi-currency FX converter with static rates fallback."""

    def __init__(self):
        self.mode = "production" if FX_API_KEY else "static"
        self._rates = dict(STATIC_RATES)
        self._last_updated = time.time()
        self._conversion_log: List[Dict] = []
        # Simulated wallets
        self._wallets: Dict[str, Dict[str, float]] = {
            "default": {"USD": 25000.00, "EUR": 5000.00, "GBP": 3000.00, "JPY": 500000.00},
        }
        logger.info(f"FX Service: mode={self.mode}, {len(self._rates)} currencies")

    def get_rates(self, base: str = "USD") -> Dict[str, Any]:
        if base not in self._rates:
            base = "USD"
        base_rate = self._rates[base]
        converted = {k: round(v / base_rate, 6) for k, v in self._rates.items()}
        return {
            "base": base,
            "rates": converted,
            "mode": self.mode,
            "last_updated": self._last_updated,
            "currencies": len(converted),
        }

    def convert(self, amount: float, from_currency: str, to_currency: str) -> Dict[str, Any]:
        from_rate = self._rates.get(from_currency.upper(), 1.0)
        to_rate = self._rates.get(to_currency.upper(), 1.0)
        rate = to_rate / from_rate
        converted = round(amount * rate, 2)

        result = {
            "from_currency": from_currency.upper(),
            "to_currency": to_currency.upper(),
            "amount": amount,
            "converted": converted,
            "rate": round(rate, 6),
            "inverse_rate": round(1 / rate, 6) if rate else 0,
            "from_info": CURRENCY_INFO.get(from_currency.upper(), {}),
            "to_info": CURRENCY_INFO.get(to_currency.upper(), {}),
            "timestamp": time.time(),
        }
        self._conversion_log.append(result)
        return result

    def get_wallet(self, user_id: str = "default") -> Dict[str, Any]:
        wallet = self._wallets.get(user_id, self._wallets["default"])
        total_usd = sum(
            amt / self._rates.get(curr, 1.0) * self._rates["USD"]
            for curr, amt in wallet.items()
        )
        holdings = []
        for curr, amt in wallet.items():
            usd_value = amt / self._rates.get(curr, 1.0)
            info = CURRENCY_INFO.get(curr, {"name": curr, "symbol": curr, "flag": "🏳️"})
            holdings.append({
                "currency": curr,
                "balance": amt,
                "usd_value": round(usd_value, 2),
                "percentage": round(usd_value / total_usd * 100, 1) if total_usd else 0,
                **info,
            })
        holdings.sort(key=lambda x: x["usd_value"], reverse=True)
        return {
            "total_usd": round(total_usd, 2),
            "holdings": holdings,
            "currencies_count": len(wallet),
        }

    def get_currencies(self) -> List[Dict]:
        return [
            {"code": k, "rate": v, **CURRENCY_INFO.get(k, {"name": k, "symbol": k, "flag": "🏳️"})}
            for k, v in self._rates.items()
        ]

    def get_status(self) -> Dict[str, Any]:
        return {
            "enabled": True,
            "mode": self.mode,
            "currencies": len(self._rates),
            "conversions_today": len(self._conversion_log),
            "last_updated": self._last_updated,
        }


# Singleton
multicurrency_service = MultiCurrencyService()
