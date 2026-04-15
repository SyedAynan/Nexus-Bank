"""
Advanced Search Engine
=======================
Multi-field search across accounts, transactions, and loans.
Features:
- Full-text search across name, email, account ID, description
- Fuzzy matching (Levenshtein distance for typo tolerance)
- Range filters: amount, date, balance
- Multi-entity results (accounts + transactions + loans)
- Search history & suggestions
- Ranked results by relevance score
"""

from datetime import datetime


def levenshtein(s1, s2):
    """
    Compute Levenshtein edit distance between two strings.
    Time: O(m*n), Space: O(min(m,n))
    Used for fuzzy matching of names/IDs.
    """
    s1, s2 = s1.lower(), s2.lower()
    if len(s1) < len(s2):
        return levenshtein(s2, s1)
    if not s2:
        return len(s1)
    prev_row = list(range(len(s2) + 1))
    for i, c1 in enumerate(s1):
        curr_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = prev_row[j + 1] + 1
            deletions = curr_row[j] + 1
            substitutions = prev_row[j] + (c1 != c2)
            curr_row.append(min(insertions, deletions, substitutions))
        prev_row = curr_row
    return prev_row[-1]


def fuzzy_score(query, target, threshold=3):
    """
    Return a relevance score 0-100 for query vs target.
    Exact match = 100, close match = partial score, too distant = 0.
    """
    query, target = query.lower().strip(), target.lower().strip()
    # Exact match
    if query == target:
        return 100
    # Substring match
    if query in target:
        return 85 - (len(target) - len(query))
    # Prefix match
    if target.startswith(query):
        return 80
    # Word-level match
    for word in target.split():
        if query in word or word in query:
            return 70
    # Fuzzy (Levenshtein)
    dist = levenshtein(query, target[: len(query) + 3])
    if dist <= threshold:
        return max(0, 60 - dist * 15)
    return 0


class SearchEngine:
    def __init__(self, banking_service):
        self.bank = banking_service
        self.search_history = []
        self.saved_searches = []
        self.MAX_HISTORY = 20
        self._last_results = []  # Cache last results for export

    def search(self, query, filters=None, limit=20):
        """
        Main search entry point. Searches all entities.
        filters: dict with optional keys:
            - entity: 'account' | 'transaction' | 'loan' | None (all)
            - amount_min, amount_max: float
            - date_from, date_to: ISO string
            - status: string
            - account_type: string
        Returns ranked list of results across all entity types.
        """
        if not query or len(query.strip()) < 1:
            return {"results": [], "total": 0, "query": query}

        query = query.strip()
        filters = filters or {}

        # Record search
        self._record_search(query)

        results = []
        entity = filters.get("entity", None)

        if entity in (None, "account"):
            results += self._search_accounts(query, filters)

        if entity in (None, "transaction"):
            results += self._search_transactions(query, filters)

        if entity in (None, "loan"):
            results += self._search_loans(query, filters)

        # Sort by relevance score (descending)
        results.sort(key=lambda x: x["relevance"], reverse=True)
        results = results[:limit]
        self._last_results = results  # Cache for export

        return {
            "results": results,
            "total": len(results),
            "query": query,
            "filters": filters,
        }

    def _search_accounts(self, query, filters):
        accounts = self.bank.get_all_accounts()
        results = []

        for acc in accounts:
            scores = [
                fuzzy_score(query, acc.get("owner_name", "")),
                fuzzy_score(query, acc.get("email", "")),
                fuzzy_score(query, acc.get("account_id", "")),
                fuzzy_score(query, acc.get("account_type", "")),
            ]
            best = max(scores)
            if best < 30:
                continue

            # Apply filters
            if filters.get("status") and acc.get("status") != filters["status"]:
                continue
            if filters.get("account_type") and acc.get("account_type") != filters["account_type"]:
                continue
            bal = acc.get("balance", 0)
            if filters.get("amount_min") and bal < float(filters["amount_min"]):
                continue
            if filters.get("amount_max") and bal > float(filters["amount_max"]):
                continue

            results.append(
                {
                    "entity": "account",
                    "relevance": best,
                    "id": acc["account_id"],
                    "title": acc["owner_name"],
                    "subtitle": f"{acc['account_type'].title()} · {acc['email']}",
                    "meta": f"Balance: ${acc['balance']:,.2f}",
                    "status": acc["status"],
                    "data": acc,
                }
            )
        return results

    def _search_transactions(self, query, filters):
        txns = self.bank.get_all_recent_transactions(limit=200)
        results = []

        for t in txns:
            desc = t.get("description", "")
            txn_id = t.get("transaction_id", "")
            acc_id = t.get("account_id", "")
            typ = t.get("type", "")

            scores = [
                fuzzy_score(query, desc),
                fuzzy_score(query, txn_id),
                fuzzy_score(query, acc_id),
                fuzzy_score(query, typ),
                fuzzy_score(query, str(t.get("amount", ""))),
            ]
            best = max(scores)
            if best < 30:
                continue

            # Apply filters
            amount = t.get("amount", 0)
            if filters.get("amount_min") and amount < float(filters["amount_min"]):
                continue
            if filters.get("amount_max") and amount > float(filters["amount_max"]):
                continue
            if filters.get("date_from"):
                try:
                    if t["timestamp"] < filters["date_from"]:
                        continue
                except Exception:
                    pass
            if filters.get("date_to"):
                try:
                    if t["timestamp"] > filters["date_to"]:
                        continue
                except Exception:
                    pass

            results.append(
                {
                    "entity": "transaction",
                    "relevance": best,
                    "id": txn_id,
                    "title": f"{typ.title()} — ${amount:,.2f}",
                    "subtitle": desc or "No description",
                    "meta": t["timestamp"][:16].replace("T", " "),
                    "status": typ,
                    "data": t,
                }
            )
        return results

    def _search_loans(self, query, filters):
        pending = self.bank.get_pending_loans()
        processed = self.bank.processed_loans
        all_loans = pending + processed
        results = []

        for loan in all_loans:
            scores = [
                fuzzy_score(query, loan.get("owner_name", "")),
                fuzzy_score(query, loan.get("loan_id", "")),
                fuzzy_score(query, loan.get("purpose", "")),
                fuzzy_score(query, loan.get("account_id", "")),
                fuzzy_score(query, loan.get("status", "")),
            ]
            best = max(scores)
            if best < 30:
                continue

            if filters.get("status") and loan.get("status") != filters["status"]:
                continue

            results.append(
                {
                    "entity": "loan",
                    "relevance": best,
                    "id": loan["loan_id"],
                    "title": f"{loan['owner_name']} — ${loan['amount']:,.2f}",
                    "subtitle": f"{loan['purpose']} · Credit: {loan['credit_score']}",
                    "meta": loan["status"].title(),
                    "status": loan["status"],
                    "data": loan,
                }
            )
        return results

    def _record_search(self, query):
        """Keep recent search history for suggestions."""
        if query not in self.search_history:
            self.search_history.insert(0, query)
            self.search_history = self.search_history[: self.MAX_HISTORY]

    def get_suggestions(self, partial, limit=5):
        """Return search suggestions from history + account names."""
        partial = partial.lower()
        suggestions = []
        for h in self.search_history:
            if partial in h.lower():
                suggestions.append({"text": h, "source": "history"})
        for acc in self.bank.get_all_accounts()[:20]:
            name = acc["owner_name"]
            if partial in name.lower() and name not in [s["text"] for s in suggestions]:
                suggestions.append({"text": name, "source": "account"})
        return suggestions[:limit]

    def save_search(self, name, query, filters):
        """Persist a named search for quick re-use."""
        entry = {
            "name": name,
            "query": query,
            "filters": filters,
            "created_at": datetime.now().isoformat(),
        }
        # Replace if name exists
        self.saved_searches = [s for s in self.saved_searches if s["name"] != name]
        self.saved_searches.insert(0, entry)
        return entry

    def get_saved_searches(self):
        return self.saved_searches

    def delete_saved_search(self, name):
        self.saved_searches = [s for s in self.saved_searches if s["name"] != name]

    def export_results(self, results, fmt="csv"):
        """
        Export search results to CSV string or JSON.
        fmt: 'csv' | 'json'
        """
        if fmt == "json":
            import json

            return json.dumps([r["data"] for r in results], indent=2, default=str)

        # CSV export
        if not results:
            return "No results"
        lines = []
        # Header — entity-specific columns
        entity = results[0]["entity"] if results else "account"
        if entity == "account":
            lines.append("account_id,owner_name,email,type,balance,status,created_at")
            for r in results:
                d = r["data"]
                lines.append(
                    f"{d.get('account_id', '')},{d.get('owner_name', '')},{d.get('email', '')},{d.get('account_type', '')},{d.get('balance', '')},{d.get('status', '')},{d.get('created_at', '')[:10]}"
                )
        elif entity == "transaction":
            lines.append("transaction_id,type,amount,balance_after,description,timestamp")
            for r in results:
                d = r["data"]
                lines.append(
                    f"{d.get('transaction_id', '')},{d.get('type', '')},{d.get('amount', '')},{d.get('balance_after', '')},{d.get('description', '').replace(',', ';')},{d.get('timestamp', '')[:16]}"
                )
        elif entity == "loan":
            lines.append("loan_id,owner_name,amount,purpose,credit_score,status,applied_at")
            for r in results:
                d = r["data"]
                lines.append(
                    f"{d.get('loan_id', '')},{d.get('owner_name', '')},{d.get('amount', '')},{d.get('purpose', '')},{d.get('credit_score', '')},{d.get('status', '')},{d.get('applied_at', '')[:10]}"
                )
        else:
            lines.append("id,title,subtitle,status")
            for r in results:
                lines.append(f"{r['id']},{r['title']},{r['subtitle']},{r['status']}")
        return "\n".join(lines)

    def get_search_analytics(self):
        """Return stats about recent searches."""
        return {
            "total_searches": len(self.search_history),
            "recent": self.search_history[:5],
            "saved_count": len(self.saved_searches),
        }
