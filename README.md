# NEXA — Beyond Fintech

> **Enterprise digital banking platform** — FastAPI backend + React (Vite) SPA with JWT auth, RBAC, fraud/AML intelligence, analytics, and a DSA showcase.

[![NEXA CI/CD](https://github.com/SyedAynan/Nexus-Bank/actions/workflows/ci.yml/badge.svg)](https://github.com/SyedAynan/Nexus-Bank/actions/workflows/ci.yml)
![Stack](https://img.shields.io/badge/Stack-FastAPI%20%2B%20React%20%2B%20PostgreSQL-blue)
![Version](https://img.shields.io/badge/Version-3.0.0-34d399?style=flat-square)
![License](https://img.shields.io/badge/License-Proprietary-a78bfa?style=flat-square)
![Status](https://img.shields.io/badge/Status-Production%20Ready-22d3ee?style=flat-square)

---

## ✨ Features

| Category | What ships |
|---|---|
| 🏦 **Banking** | Accounts, deposits/withdrawals, transfers, transactions, loans, cards, bill pay, multi-currency (20+ FX pairs) |
| 🔐 **Security** | JWT access/refresh + TOTP MFA, 5-role RBAC, Redis sliding-window rate limiting, security headers (HSTS/CSP), audit logging with IP/UA |
| 🧠 **Intelligence** | Fraud detection (rules + ML), AML monitoring, risk scoring, loan scoring, forecasting, portfolio engine |
| 📊 **Analytics** | Dashboard KPIs, 13-chart analytics engine, CSV/PDF export |
| 🛠️ **Admin console** | User management, transaction monitoring, compliance, audit logs, feature flags, system settings, DSA visualizations |
| 🧩 **DSA showcase** | 7 data structures wired into banking logic (see `DSA_ARCHITECTURE.md`) + admin-only `/api/admin/dsa` endpoints |
| 🔌 **Realtime** | Authenticated WebSocket `GET /ws/dashboard` for live dashboard streaming |
| 📨 **Services** | OAuth, WebAuthn, email, notifications routes, OpenBanking pages |

---

## 🧰 Tech stack

- **Backend** — FastAPI, SQLAlchemy 2, Pydantic 2 + pydantic-settings, Alembic, `python-jose` (JWT), `passlib`/`bcrypt`, `orjson`, Jinja2 server-rendered pages + JSON API (`bank_system/requirements.txt`)
- **Frontend** — React 18, Vite, React Router 6, Framer Motion, Recharts, Lucide icons, Tailwind, Three.js/R3F (`frontend/package.json`)
- **Data** — PostgreSQL 15 (prod) / SQLite (local dev & CI), Redis 7 (rate limit/OTP, with in-memory fallback), Neo4j in compose for graph work
- **Realtime** — WebSocket (`bank_system/core/realtime.py`, event bus in `core/event_bus.py`)
- **Deploy** — Docker Compose (web/db/redis/neo4j/frontend), `render.yaml` (Render backend), Vercel (`frontend/vercel.json` proxy), `k8s/` manifests, `Dockerfile` + `Dockerfile.frontend`
- **Quality** — Ruff lint/format, pytest (`pytest.ini`, `tests/`), CI pipeline `quality → test → frontend` (`.github/workflows/ci.yml`)

---

## 🗂 Project structure

```
.
├── bank_system/              # FastAPI app (entry: bank_system/main.py)
│   ├── api/routes/           # auth, banking, analytics, admin, intelligence,
│   │                         # services, dsa_admin (+ notifications module, not wired)
│   ├── core/                 # config, db, security (JWT/MFA), redis, realtime,
│   │                         # exceptions, startup_checks, event_bus
│   ├── middleware/           # rate_limiter, security_headers, request_logger, ip_whitelist
│   ├── models/               # db_models (SQLAlchemy), models
│   ├── services/             # fraud/ML-fraud, AML, loan scoring, forecasting,
│   │                         # portfolio, multicurrency, billpay, email, oauth,
│   │                         # webauthn, export, feature_flags, search, risk, …
│   ├── data_structures/      # 7 DSA modules (linked list, stack, queue, BST,
│   │                         # hash table, graph, priority queue)
│   ├── ml_models/  simulation/  seed.py
│   └── frontend/templates/   # Server-rendered Jinja pages (login, dashboard, …)
├── frontend/src/             # React SPA — pages/{admin,customer,auth,public}
├── alembic/                  # DB migrations (versions/001_initial_schema.py)
├── tests/                    # unit + integration + security + load (locust)
├── docs/                     # Project report, v4 upgrade notes, QA diagnostic
├── postman/ .postman/        # API collections
├── docker-compose.yml  docker-compose.prod.yml
├── render.yaml  Procfile  runtime.txt  alembic.ini
├── DEPLOY.md  DSA_ARCHITECTURE.md  DEVELOPMENT_ROADMAP.md
└── .env.example              # Template — copy to .env (never commit .env)
```

> Note: `bank_system/README.md` still describes an older Flask layout (`app.py`) — the
> live entry point is `bank_system/main.py` (FastAPI). Treat this root README as authoritative.

---

## ⚡ Quick start

### Option A — Docker (recommended)

```bash
git clone https://github.com/SyedAynan/Nexus-Bank.git && cd Nexus-Bank
cp .env.example .env            # fill in SECRET_KEY + DATABASE_URL
docker-compose up -d --build

# API:      http://localhost:8000        Swagger: http://localhost:8000/docs
# Frontend: http://localhost:5173
```

Compose runs `web` (FastAPI) + `db` (Postgres 15) + `redis` (7) + `neo4j` + `frontend` (Node 20).

### Option B — Local dev (SQLite, no Docker)

```bash
# Backend
pip install -r bank_system/requirements.txt
cp .env.example .env
uvicorn bank_system.main:app --reload --port 8000

# Frontend (second terminal)
cd frontend && npm ci && npm run dev
```

Backend seeds demo data on first startup when the DB is empty (`seed_if_empty()` in the lifespan).

### Demo credentials

| Role | Username | Password | Notes |
|---|---|---|---|
| Admin | `admin` | `admin123` | Full access, seeded in demo mode |
| Staff / Auditor | via `create_admin.py` / register | — | See `DEPLOY.md` troubleshooting |

> Change demo passwords before any shared deployment. The login API takes
> `application/x-www-form-urlencoded` (`username` + `password`).

---

## 🔌 API overview

Interactive docs at `/docs` (Swagger) and `/redoc`. Wired routers in `bank_system/main.py`:

| Prefix | Module | Purpose |
|---|---|---|
| `/api/auth` | `api/routes/auth.py` | Login, register, refresh, logout (JWT + MFA) |
| `/api/banking` | `api/routes/banking.py` | Accounts, deposits, withdrawals, transfers, loans |
| `/api/analytics` | `api/routes/analytics.py` | KPIs, charts, reports |
| `/api/admin` | `api/routes/admin.py` | Users, audit logs, system stats |
| `/api/admin/dsa` | `api/routes/dsa_admin.py` | Admin-only DSA visualizations |
| `/api/intelligence` | `api/routes/intelligence.py` | Fraud, AML, risk, forecasting, portfolio |
| `/api/services` | `api/routes/services.py` | OAuth, WebAuthn, email, BillPay, FX, flags, export |
| `GET /api/health` | `main.py` | Health + DB/Redis status (also `GET /health`, undocumented) |
| `WS /ws/dashboard` | `main.py` | Token-authed realtime stream (`?token=<JWT>`) |

`api/routes/notifications.py` (`/api/notifications`) exists in-tree but is **not wired**
into `main.py` — no notification endpoints are live until it is included.

---

## 🖥 Frontend pages (`frontend/src/pages/`)

- **public/** — Landing, About, Contact
- **auth/** — Login, Register, ForgotPassword
- **customer/** — Dashboard, Accounts, Transfer, Transactions, TransactionLifecycle, Cards, Loans, BillPay, MultiCurrency, Investments, Portfolio, Markets, Analytics, Goals, Globe, Notifications, Profile, AIAssistant, FirstTransaction
- **admin/** — AdminDashboard, UserManagement, Compliance, FraudMonitoring, AuditLogs, Monitoring, SystemSettings, FeatureFlags, RateLimiting, BackupManager, OpenBanking, DSAShowcase, DevelopmentRoadmap, ProjectDescription

---

## 🗄 Data & migrations

- Prod: PostgreSQL (`DATABASE_URL=postgresql+psycopg2://…`); local/CI default SQLite.
- Migrations: `alembic/` (`alembic.ini`, `versions/001_initial_schema.py`).
- Redis: rate limiting + OTP; app falls back to in-memory when Redis is unreachable (reported by `/api/health`).
- Key env vars: `ENVIRONMENT`, `DEBUG`, `SECRET_KEY`, `DATABASE_URL`, `REDIS_URL`, `FRONTEND_URL`, `DEMO_MODE`, `JWT_ALGORITHM`, token expiries. See `.env.example` + `DEPLOY.md`.

---

## ✅ Tests & quality

```bash
pytest tests/ -v --cov=bank_system --cov-report=term-missing   # backend (SQLite in CI)
ruff check bank_system/ && ruff format --check bank_system/    # lint/format
cd frontend && npm ci && npm run build                         # SPA build
```

Suites: `tests/unit` (DSA core/sorting/trie, services), `tests/integration` (auth, banking API),
`tests/security` (auth), `tests/load` (locust). CI (`.github/workflows/ci.yml`) runs
quality → test → frontend on pushes to `main`/`develop` and PRs to `main`.

---

## 🚀 Deployment

Full guide: [`DEPLOY.md`](DEPLOY.md). Short version:

- **Backend → Render** — Blueprint via `render.yaml` (build `pip install -r bank_system/requirements.txt`, start `uvicorn bank_system.main:app …`, health check `/api/health`). Needs Postgres `DATABASE_URL`, persistent `SECRET_KEY`, `PYTHONPATH=/opt/render/project/src`.
- **Frontend → Vercel** — Root `frontend`, `VITE_API_URL=/api`, rewrites in `frontend/vercel.json` proxy `/api/*` to Render.
- **Docker prod** — `docker-compose.prod.yml` + `Dockerfile`/`Dockerfile.frontend` + `nginx.conf`. Raw `k8s/` manifests also in-tree.

---

## 📚 Docs

- `DEPLOY.md` — Vercel + Render walkthrough with troubleshooting
- `DSA_ARCHITECTURE.md` — data-structure → banking-feature map
- `DEVELOPMENT_ROADMAP.md` — build history / roadmap
- `docs/` — project report, v4 architecture upgrade, QA stack diagnostic

---

## 🔒 Security

JWT + TOTP MFA, 5-role RBAC, Redis rate limiting, security headers, request logging,
central exception handlers. **Read [`SECURITY.md`](SECURITY.md) before deploying** —
it covers reporting plus must-fix items (`.env.production` is tracked in git, demo
credentials, Swagger left enabled, free-tier cold starts).

## 🤝 Contributing

PRs welcome — conventions in [`CONTRIBUTING.md`](CONTRIBUTING.md) (branches, conventional
commits, Ruff, pytest, no secrets in code).

## 📝 License

© 2026 NEXA — Beyond Fintech. All rights reserved. (Proprietary — see [`LICENSE`](LICENSE).)
