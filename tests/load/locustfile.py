"""
NEXA Load Testing Suite — Locust
=================================
Simulates realistic banking traffic patterns for performance benchmarking.

Run:
    pip install locust
    locust -f tests/load/locustfile.py --host http://localhost:8000

Scenarios:
    1. Login stress (100 concurrent)
    2. Balance checks (500 concurrent)
    3. Deposit transactions (50 concurrent)
    4. Dashboard data fetch
"""
import random
import string

from locust import HttpUser, task, between, tag


class NexaBankUser(HttpUser):
    """Simulates a regular banking customer."""

    wait_time = between(1, 5)
    token = None

    def on_start(self):
        """Login and store JWT token."""
        resp = self.client.post("/api/auth/login", json={
            "username": "admin",
            "password": "admin123",
        })
        if resp.status_code == 200:
            data = resp.json()
            self.token = data.get("access_token", "")
        else:
            # Fallback — tests will run without auth (will get 401s tracked as failures)
            self.token = ""

    @property
    def auth_headers(self):
        return {"Authorization": f"Bearer {self.token}"}

    # ─── Scenario 1: Login Stress ───
    @tag("login")
    @task(2)
    def login(self):
        self.client.post("/api/auth/login", json={
            "username": "admin",
            "password": "admin123",
        }, name="/api/auth/login")

    # ─── Scenario 2: Balance Checks ───
    @tag("balance")
    @task(5)
    def check_accounts(self):
        self.client.get("/api/banking/accounts",
                        headers=self.auth_headers,
                        name="/api/banking/accounts")

    @tag("balance")
    @task(3)
    def check_kpis(self):
        self.client.get("/api/analytics/kpis",
                        headers=self.auth_headers,
                        name="/api/analytics/kpis")

    # ─── Scenario 3: Deposits ───
    @tag("transactions")
    @task(2)
    def make_deposit(self):
        self.client.post("/api/banking/user-transaction", json={
            "account_id": 1,
            "amount": round(random.uniform(10, 500), 2),
            "type": "deposit",
            "description": "Load test deposit",
        }, headers=self.auth_headers,
            name="/api/banking/user-transaction")

    # ─── Scenario 4: Dashboard Data ───
    @tag("dashboard")
    @task(4)
    def fetch_dashboard(self):
        self.client.get("/api/analytics/charts",
                        headers=self.auth_headers,
                        name="/api/analytics/charts")

    @tag("dashboard")
    @task(3)
    def fetch_transactions(self):
        self.client.get("/api/banking/transactions?limit=20",
                        headers=self.auth_headers,
                        name="/api/banking/transactions")

    # ─── Misc: Search, Fraud ───
    @tag("search")
    @task(1)
    def search(self):
        q = random.choice(["savings", "checking", "deposit", "transfer", "NX"])
        self.client.get(f"/api/admin/search?q={q}",
                        headers=self.auth_headers,
                        name="/api/admin/search")

    @tag("health")
    @task(1)
    def healthcheck(self):
        self.client.get("/api/health", name="/api/health")


class NexaAdminUser(HttpUser):
    """Simulates an admin user doing monitoring tasks."""

    wait_time = between(3, 10)
    token = None
    weight = 1  # 1 admin per 3 regular users

    def on_start(self):
        resp = self.client.post("/api/auth/login", json={
            "username": "admin",
            "password": "admin123",
        })
        if resp.status_code == 200:
            self.token = resp.json().get("access_token", "")

    @property
    def auth_headers(self):
        return {"Authorization": f"Bearer {self.token}"}

    @task(3)
    def admin_dashboard(self):
        self.client.get("/api/admin/stats",
                        headers=self.auth_headers,
                        name="/api/admin/stats")

    @task(2)
    def admin_users(self):
        self.client.get("/api/admin/users",
                        headers=self.auth_headers,
                        name="/api/admin/users")

    @task(2)
    def fraud_alerts(self):
        self.client.get("/api/admin/fraud-alerts",
                        headers=self.auth_headers,
                        name="/api/admin/fraud-alerts")

    @task(1)
    def audit_logs(self):
        self.client.get("/api/admin/audit-log",
                        headers=self.auth_headers,
                        name="/api/admin/audit-log")

    @task(1)
    def feature_flags(self):
        self.client.get("/api/services/flags",
                        headers=self.auth_headers,
                        name="/api/services/flags")
