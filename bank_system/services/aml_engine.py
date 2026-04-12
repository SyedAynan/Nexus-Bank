"""
AML & Watchlist Engine
======================
Simulated Anti-Money Laundering layer:
    - Detects rapid movement / structuring / layering patterns
    - Simulated PEP & watchlist matching with fuzzy search
"""

from __future__ import annotations

from datetime import datetime
from typing import Dict, Any, List

try:
    from bank_system.services.search_engine import fuzzy_score
except ImportError:
    from services.search_engine import fuzzy_score


class AMLEngine:
    def __init__(self, banking_service):
        self.bank = banking_service
        # Simulated PEP / watchlist names
        self.watchlist = [
            "John Doe",
            "Global Holdings Ltd",
            "Pacific Trading Corp",
            "Omega Investments",
        ]

    def run_aml_scan(self) -> Dict[str, Any]:
        """
        Scan recent transactions for basic AML patterns and watchlist hits.
        """
        txns = self.bank.get_all_recent_transactions(limit=500)
        now = datetime.now()
        flagged: List[Dict[str, Any]] = []

        # Rapid movement / structuring / layering detection
        by_account: Dict[str, List[Dict[str, Any]]] = {}
        for t in txns:
            acc_id = t.get("account_id") or t.get("fromAcc") or ""
            by_account.setdefault(acc_id, []).append(t)

        for acc_id, hist in by_account.items():
            # Sort by timestamp (most recent first)
            def _parse_ts(ts: str) -> datetime:
                try:
                    return datetime.fromisoformat(ts)
                except Exception:
                    return now

            hist_sorted = sorted(hist, key=lambda x: _parse_ts(x.get("timestamp", "")), reverse=True)
            # Pattern: multiple similar amounts within a short window
            for i in range(len(hist_sorted) - 2):
                t0, t1, t2 = hist_sorted[i], hist_sorted[i + 1], hist_sorted[i + 2]
                ts0 = _parse_ts(t0.get("timestamp", ""))
                ts2 = _parse_ts(t2.get("timestamp", ""))
                window = (ts0 - ts2).total_seconds()
                if window <= 3600:  # within one hour
                    a0, a1, a2 = t0.get("amount", 0), t1.get("amount", 0), t2.get("amount", 0)
                    if a0 > 0 and abs(a0 - a1) <= a0 * 0.1 and abs(a0 - a2) <= a0 * 0.1:
                        flagged.append({
                            "account_id": acc_id,
                            "pattern": "structuring",
                            "description": "Multiple similar-value transactions within a short period.",
                            "amounts": [a0, a1, a2],
                            "timestamps": [t0.get("timestamp"), t1.get("timestamp"), t2.get("timestamp")],
                        })
                        break

        # Watchlist / PEP simulation based on account owner names
        accounts = self.bank.get_all_accounts()
        watch_hits: List[Dict[str, Any]] = []
        for acc in accounts:
            name = acc.get("owner_name", "")
            for wl in self.watchlist:
                score = fuzzy_score(name, wl)
                if score >= 70:
                    watch_hits.append({
                        "account_id": acc["account_id"],
                        "owner_name": name,
                        "matched_entry": wl,
                        "match_score": score,
                    })
                    break

        return {
            "patterns": flagged,
            "watchlist_hits": watch_hits,
        }

