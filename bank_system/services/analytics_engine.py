"""
Analytics Engine
================
Generates chart-ready data for:
1. Transaction volume over time (daily/weekly/monthly)
2. Account balance distribution
3. Loan status breakdown
4. Fraud alert trend
5. Transaction type breakdown (pie)
6. Top accounts by activity
7. Revenue/deposit flow trend
8. Risk heatmap data
"""

from datetime import datetime, timedelta
from collections import defaultdict
import random


class AnalyticsEngine:
    def __init__(self, banking_service):
        self.bank = banking_service
        # Simple in-memory cache for heavy analytics
        self._kpi_cache = None
        self._kpi_cache_ts = None

    def get_transaction_volume_chart(self, days=30):
        """Daily transaction volume for the last N days."""
        all_txns = self.bank.get_all_recent_transactions(limit=500)
        now = datetime.now()

        # Build day buckets
        buckets = {}
        for i in range(days):
            d = (now - timedelta(days=days - 1 - i)).strftime('%m/%d')
            buckets[d] = {'deposits': 0, 'withdrawals': 0, 'transfers': 0, 'count': 0}

        for t in all_txns:
            try:
                ts = datetime.fromisoformat(t['timestamp'])
                day_key = ts.strftime('%m/%d')
                if day_key in buckets:
                    txn_type = t.get('type', '')
                    if txn_type == 'deposit':
                        buckets[day_key]['deposits'] += t['amount']
                    elif txn_type == 'withdrawal':
                        buckets[day_key]['withdrawals'] += t['amount']
                    buckets[day_key]['count'] += 1
            except Exception:
                continue

        # Enrich with simulated historical data for visual depth
        days_list = list(buckets.keys())
        for i, day in enumerate(days_list):
            if buckets[day]['count'] == 0 and i < days - 5:
                seed = hash(day) % 1000
                buckets[day]['deposits'] = 5000 + (seed * 37 % 15000)
                buckets[day]['withdrawals'] = 3000 + (seed * 13 % 8000)
                buckets[day]['count'] = 3 + (seed % 8)

        labels = list(buckets.keys())
        return {
            'labels': labels,
            'deposits': [round(buckets[d]['deposits'], 2) for d in labels],
            'withdrawals': [round(buckets[d]['withdrawals'], 2) for d in labels],
            'counts': [buckets[d]['count'] for d in labels]
        }

    def get_balance_distribution(self):
        """Balance distribution across accounts (histogram buckets)."""
        accounts = self.bank.get_all_accounts()
        buckets = {
            '$0-1K': 0, '$1K-5K': 0, '$5K-25K': 0,
            '$25K-100K': 0, '$100K+': 0
        }
        for acc in accounts:
            b = acc.get('balance', 0)
            if b < 1000:
                buckets['$0-1K'] += 1
            elif b < 5000:
                buckets['$1K-5K'] += 1
            elif b < 25000:
                buckets['$5K-25K'] += 1
            elif b < 100000:
                buckets['$25K-100K'] += 1
            else:
                buckets['$100K+'] += 1
        return {
            'labels': list(buckets.keys()),
            'values': list(buckets.values())
        }

    def get_txn_type_breakdown(self):
        """Pie chart: breakdown by transaction type."""
        all_txns = self.bank.get_all_recent_transactions(limit=200)
        counts = defaultdict(int)
        totals = defaultdict(float)
        for t in all_txns:
            typ = t.get('type', 'other')
            counts[typ] += 1
            totals[typ] += t.get('amount', 0)
        return {
            'labels': list(counts.keys()),
            'counts': list(counts.values()),
            'totals': [round(totals[k], 2) for k in counts.keys()]
        }

    def get_account_type_breakdown(self):
        """Pie chart: savings vs checking vs business."""
        accounts = self.bank.get_all_accounts()
        counts = defaultdict(int)
        balances = defaultdict(float)
        for acc in accounts:
            t = acc.get('account_type', 'other')
            counts[t] += 1
            balances[t] += acc.get('balance', 0)
        return {
            'labels': list(counts.keys()),
            'counts': list(counts.values()),
            'balances': [round(balances[k], 2) for k in counts.keys()]
        }

    def get_loan_status_breakdown(self):
        """Loan pipeline funnel data."""
        pending = self.bank.loan_queue.size()
        processed = self.bank.processed_loans
        approved = sum(1 for l in processed if l['status'] == 'approved')
        rejected = sum(1 for l in processed if l['status'] == 'rejected')
        approved_vol = sum(l['amount'] for l in processed if l['status'] == 'approved')
        return {
            'labels': ['Pending', 'Approved', 'Rejected'],
            'counts': [pending, approved, rejected],
            'approved_volume': round(approved_vol, 2),
            'approval_rate': round(approved / max(1, approved + rejected) * 100, 1)
        }

    def get_top_accounts(self, by='balance', limit=5):
        """Top N accounts by balance or transaction count."""
        accounts = self.bank.get_all_accounts()
        if by == 'balance':
            accounts.sort(key=lambda x: x['balance'], reverse=True)
        return [{
            'account_id': a['account_id'],
            'owner_name': a['owner_name'],
            'balance': a['balance'],
            'type': a['account_type'],
            'status': a['status']
        } for a in accounts[:limit]]

    def get_monthly_flow(self):
        """Net cash flow per month (last 6 months)."""
        all_txns = self.bank.get_all_recent_transactions(limit=1000)
        now = datetime.now()
        months = {}
        for i in range(6):
            d = now - timedelta(days=i * 30)
            key = d.strftime('%b %Y')
            months[key] = {'inflow': 0, 'outflow': 0}

        month_keys = list(months.keys())
        for t in all_txns:
            try:
                ts = datetime.fromisoformat(t['timestamp'])
                key = ts.strftime('%b %Y')
                if key in months:
                    if t['type'] == 'deposit':
                        months[key]['inflow'] += t['amount']
                    elif t['type'] == 'withdrawal':
                        months[key]['outflow'] += t['amount']
            except Exception:
                continue

        # Simulate past months
        for i, key in enumerate(month_keys):
            if months[key]['inflow'] == 0 and i > 0:
                seed = hash(key) % 500
                months[key]['inflow'] = 20000 + seed * 100
                months[key]['outflow'] = 12000 + seed * 60

        labels = list(reversed(month_keys))
        return {
            'labels': labels,
            'inflow': [round(months[k]['inflow'], 2) for k in labels],
            'outflow': [round(months[k]['outflow'], 2) for k in labels],
            'net': [round(months[k]['inflow'] - months[k]['outflow'], 2) for k in labels]
        }

    def get_kpi_delta(self):
        """Calculate % change vs yesterday for KPIs (simulated for demo)."""
        return {
            'balance_delta': +3.2,
            'accounts_delta': +1,
            'deposits_delta': +8.7,
            'withdrawals_delta': -2.1,
            'loans_delta': -1,
        }

    def get_regulatory_kpis(self):
        """
        Simulated regulatory-style KPIs:
            - CET1 ratio (approx)
            - Capital adequacy ratio
            - NPL ratio
            - Liquidity coverage ratio
        All values are derived deterministically from current balances/loans.
        """
        from datetime import datetime as _dt

        # Lightweight cache: recompute at most once per minute
        if self._kpi_cache_ts:
            if (_dt.now() - self._kpi_cache_ts).seconds < 60 and self._kpi_cache:
                return self._kpi_cache

        accounts = self.bank.get_all_accounts()
        loans = self.bank.get_pending_loans() + getattr(self.bank, "processed_loans", [])

        total_assets = sum(a.get('balance', 0.0) for a in accounts)
        total_loans = sum(l.get('amount', 0.0) for l in loans)
        # Assume simple risk-weighted assets as loans * factor
        rwa = total_loans * 0.85

        # Approximate capital as a fraction of assets
        tier1_capital = total_assets * 0.08
        cet1_ratio = (tier1_capital / rwa * 100.0) if rwa else 0.0

        # NPL approximation: loans with status overdue/defaulted
        npl_amount = sum(
            l.get('amount', 0.0)
            for l in loans
            if str(l.get('status', '')).lower() in ('overdue', 'defaulted')
        )
        npl_ratio = (npl_amount / total_loans * 100.0) if total_loans else 0.0

        # Liquidity coverage: high-level proxy of deposits vs stressed outflow
        stressed_outflow = total_loans * 0.05
        lcr = ((total_assets - total_loans) / stressed_outflow * 100.0) if stressed_outflow else 0.0

        result = {
            'cet1_ratio': round(cet1_ratio, 2),
            'capital_adequacy_ratio': round(cet1_ratio * 1.1, 2),
            'npl_ratio': round(npl_ratio, 2),
            'liquidity_coverage_ratio': round(lcr, 2),
            'totals': {
                'assets': round(total_assets, 2),
                'loans': round(total_loans, 2),
                'npl_amount': round(npl_amount, 2),
            }
        }
        self._kpi_cache = result
        self._kpi_cache_ts = _dt.now()
        return result

    def get_sparkline(self, account_id, days=7):
        """Get daily balance sparkline for a single account."""
        history = self.bank.get_transaction_history(account_id, limit=100)
        now = datetime.now()
        points = []
        for i in range(days):
            d = now - timedelta(days=days - 1 - i)
            # Find last transaction balance on or before this day
            day_str = d.strftime('%Y-%m-%d')
            bal = None
            for t in history:
                if t['timestamp'][:10] <= day_str:
                    bal = t['balance_after']
                    break
            if bal is None and history:
                bal = history[-1]['balance_after']
            points.append(round(bal or 0, 2))
        return points

    def get_volume_comparison(self, days=30):
        """Current period vs previous period transaction volume."""
        all_txns = self.bank.get_all_recent_transactions(limit=1000)
        now = datetime.now()
        current_deps, current_with = 0.0, 0.0
        prev_deps, prev_with = 0.0, 0.0

        for t in all_txns:
            try:
                ts = datetime.fromisoformat(t['timestamp'])
                age = (now - ts).days
                if age <= days:
                    if t['type'] == 'deposit':    current_deps += t['amount']
                    elif t['type'] == 'withdrawal': current_with += t['amount']
                elif age <= days * 2:
                    if t['type'] == 'deposit':    prev_deps += t['amount']
                    elif t['type'] == 'withdrawal': prev_with += t['amount']
            except Exception:
                continue

        # Fallback enrichment
        if current_deps == 0:
            current_deps = 84200
            current_with = 51300
            prev_deps = 77500
            prev_with = 48900

        def pct(curr, prev):
            if prev == 0: return 0
            return round((curr - prev) / prev * 100, 1)

        return {
            'current': {'deposits': round(current_deps, 2), 'withdrawals': round(current_with, 2),
                        'net': round(current_deps - current_with, 2)},
            'previous': {'deposits': round(prev_deps, 2), 'withdrawals': round(prev_with, 2),
                         'net': round(prev_deps - prev_with, 2)},
            'change': {'deposits': pct(current_deps, prev_deps),
                       'withdrawals': pct(current_with, prev_with),
                       'net': pct(current_deps - current_with, prev_deps - prev_with)}
        }

    def get_hourly_heatmap(self):
        """Transaction frequency by hour-of-day (24 buckets)."""
        all_txns = self.bank.get_all_recent_transactions(limit=500)
        hours = [0] * 24
        amounts = [0.0] * 24
        for t in all_txns:
            try:
                h = int(t['timestamp'][11:13])
                hours[h] += 1
                amounts[h] += t['amount']
            except Exception:
                continue
        # Enrich with realistic banking pattern if thin
        if sum(hours) < 10:
            pattern = [1,0,0,0,1,2,5,9,14,16,13,11,10,12,11,10,9,8,7,6,4,3,2,1]
            for i, p in enumerate(pattern):
                hours[i] += p * 3
                amounts[i] += p * 2000
        return {
            'hours': list(range(24)),
            'counts': hours,
            'amounts': [round(a, 2) for a in amounts],
            'labels': [f'{h:02d}:00' for h in range(24)]
        }

    def get_account_growth(self):
        """Simulated account growth over 12 months."""
        now = datetime.now()
        base = max(1, self.bank.account_table.count() - 12)
        labels, counts = [], []
        for i in range(12):
            d = now - timedelta(days=(11 - i) * 30)
            labels.append(d.strftime('%b'))
            seed = hash(d.strftime('%Y%m')) % 3
            counts.append(base + i + seed)
        return {'labels': labels, 'counts': counts}

    def get_risk_distribution(self):
        """Distribution of accounts across risk levels."""
        from services.fraud_engine import FraudEngine
        fe = FraudEngine(self.bank)
        profiles = fe.bulk_screen_accounts()
        low = sum(1 for p in profiles if p['composite_risk'] < 30)
        med = sum(1 for p in profiles if 30 <= p['composite_risk'] < 60)
        high = sum(1 for p in profiles if p['composite_risk'] >= 60)
        return {'labels': ['Low Risk', 'Medium Risk', 'High Risk'],
                'counts': [low, med, high],
                'colors': ['#4ECDC4', '#F5A623', '#E05252']}

    def get_loan_score_distribution(self):
        """Distribution of AI loan scores across all pending loans."""
        from services.loan_scoring import LoanScoringEngine
        scorer = LoanScoringEngine(self.bank)
        loans = self.bank.get_pending_loans() + self.bank.processed_loans
        buckets = {'0-40': 0, '41-55': 0, '56-70': 0, '71-85': 0, '86-100': 0}
        for loan in loans:
            try:
                r = scorer.score_loan(
                    loan['account_id'], loan['amount'],
                    loan.get('purpose', 'personal'),
                    loan.get('credit_score', 650)
                )
                s = r['composite_score']
                if s <= 40:     buckets['0-40'] += 1
                elif s <= 55:   buckets['41-55'] += 1
                elif s <= 70:   buckets['56-70'] += 1
                elif s <= 85:   buckets['71-85'] += 1
                else:           buckets['86-100'] += 1
            except Exception:
                pass
        return {'labels': list(buckets.keys()), 'counts': list(buckets.values())}

    def get_full_dashboard_data(self):
        """Single call to get all chart data for the analytics dashboard."""
        return {
            'volume_chart': self.get_transaction_volume_chart(14),
            'balance_dist': self.get_balance_distribution(),
            'txn_breakdown': self.get_txn_type_breakdown(),
            'account_types': self.get_account_type_breakdown(),
            'loan_status': self.get_loan_status_breakdown(),
            'top_accounts': self.get_top_accounts(),
            'monthly_flow': self.get_monthly_flow(),
            'kpi_deltas': self.get_kpi_delta(),
            'volume_comparison': self.get_volume_comparison(14),
            'hourly_heatmap': self.get_hourly_heatmap(),
            'account_growth': self.get_account_growth(),
            'risk_distribution': self.get_risk_distribution(),
            'loan_score_dist': self.get_loan_score_distribution(),
        }
