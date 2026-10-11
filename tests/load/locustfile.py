"""
NEXA Load Testing Suite — Locust
=================================
Simulates realistic banking traffic patterns for performance benchmarking.

Run:
    pip install locust
    locust -f tests/load/locustfile.py --host http://localhost:8000

Scenarios:
    1. Login stress (form-data login + OTP verify)
    2. Balance checks
    3. Deposit transactions
    4. Dashboard data fetch
    5. Admin monitoring

Auth notes:
    - Login expects ``application/x-www-form-urlencoded`` (OAuth2 password flow),
      NOT JSON. Returns 202 with an MFA challenge when the user has MFA enabled.
    - In demo/dev mode the backend uses the fixed OTP ``000000``; verify it via
      POST /api/auth/verify-otp to obtain tokens.
"""

import random

from locust import HttpUser, between, tag, task

DEMO_OTP = "000000"


def _login_and_get_token(client, username: str, password: str) -> str:
    """Complete the MFA login flow and return an access token (or '')."""
    login_resp = client.post(
        "/api/auth/login",
        data={"username": username, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        name="/api/auth/login",
    )
    if login_resp.status_code == 200:
        return login_resp.json().get("access_token", "")
    if login_resp.status_code != 202:
        return ""
    otp_resp = client.post(
        "/api/auth/verify-otp",
        json={"username": username, "password": password, "otp": DEMO_OTP},
        name="/api/auth/verify-otp",
    )
    if otp_resp.status_code == 200:
        return otp_resp.json().get("access_token", "")
    return ""


class NexaBankUser(HttpUser):
    """Simulates a regular banking customer."""

    wait_time = between(1, 5)
    token = ""

    def on_start(self):
        """Login and store JWT token (empty token → requests 401, tracked as failures)."""
        self.token = _login_and_get_token(self.client, "john_doe", "user123")

    @property
    def auth_headers(self):
        return {"Authorization": f"Bearer {self.token}"}

    # ─── Scenario 1: Login Stress ───
    @tag("login")
    @task(2)
    def login(self):
        _login_and_get_token(self.client, "john_doe", "user123")

    # ─── Scenario 2: Balance Checks ───
    @tag("balance")
    @task(5)
    def check_accounts(self):
        self.client.get(
            "/api/banking/accounts",
            headers=self.auth_headers,
            name="/api/banking/accounts",
        )

    @tag("balance")
    @task(3)
    def check_kpis(self):
        self.client.get(
            "/api/analytics/kpi",
            headers=self.auth_headers,
            name="/api/analytics/kpi",
        )

    # ─── Scenario 3: Deposits ───
    @tag("transactions")
    @task(2)
    def make_deposit(self):
        self.client.post(
            "/api/banking/user-transaction",
            json={
                "account_id": 1,
                "amount": round(random.uniform(10, 500), 2),
                "type": "deposit",
                "description": "Load test deposit",
            },
            headers=self.auth_headers,
            name="/api/banking/user-transaction",
        )

    # ─── Scenario 4: Dashboard Data ───
    @tag("dashboard")
    @task(4)
    def fetch_forecast(self):
        self.client.get(
            "/api/analytics/forecast/cashflow",
            headers=self.auth_headers,
            name="/api/analytics/forecast/cashflow",
        )

    @tag("dashboard")
    @task(3)
    def fetch_transactions(self):
        self.client.get(
            "/api/banking/transactions?limit=20",
            headers=self.auth_headers,
            name="/api/banking/transactions",
        )

    @tag("notifications")
    @task(1)
    def fetch_notifications(self):
        self.client.get(
            "/api/notifications/",
            headers=self.auth_headers,
            name="/api/notifications/",
        )

    @tag("health")
    @task(1)
    def healthcheck(self):
        self.client.get("/api/health", name="/api/health")


class NexaAdminUser(HttpUser):
    """Simulates an admin user doing monitoring tasks."""

    wait_time = between(3, 10)
    token = ""
    weight = 1  # 1 admin per 3 regular users

    def on_start(self):
        self.token = _login_and_get_token(self.client, "admin", "admin123")

    @property
    def auth_headers(self):
        return {"Authorization": f"Bearer {self.token}"}

    @task(3)
    def admin_live_users(self):
        self.client.get(
            "/api/admin/live-users",
            headers=self.auth_headers,
            name="/api/admin/live-users",
        )

    @task(2)
    def admin_users(self):
        self.client.get(
            "/api/admin/users",
            headers=self.auth_headers,
            name="/api/admin/users",
        )

    @task(2)
    def fraud_alerts(self):
        self.client.get(
            "/api/admin/fraud-alerts",
            headers=self.auth_headers,
            name="/api/admin/fraud-alerts",
        )

    @task(1)
    def security_events(self):
        self.client.get(
            "/api/admin/security-events",
            headers=self.auth_headers,
            name="/api/admin/security-events",
        )

    @task(1)
    def feature_flags(self):
        self.client.get(
            "/api/services/flags",
            headers=self.auth_headers,
            name="/api/services/flags",
        )
