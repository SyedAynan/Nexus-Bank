<div align="center">

<img src="https://raw.githubusercontent.com/SyedAynan/Nexus-Bank/main/docs/assets/banner.png" alt="NEXA — Beyond Fintech" width="100%" />

# 🏛️ NEXA — Beyond Fintech

### Next-Generation Enterprise Digital Banking Platform

[![NEXA CI/CD](https://github.com/SyedAynan/Nexus-Bank/actions/workflows/ci.yml/badge.svg)](https://github.com/SyedAynan/Nexus-Bank/actions/workflows/ci.yml)
![Python](https://img.shields.io/badge/Python-3.11%2B-3776AB?logo=python&logoColor=white&style=flat-square)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688?logo=fastapi&logoColor=white&style=flat-square)
![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black&style=flat-square)
![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite&logoColor=white&style=flat-square)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white&style=flat-square)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white&style=flat-square)
![Three.js](https://img.shields.io/badge/Three.js-3D%20Globe-black?logo=threedotjs&logoColor=white&style=flat-square)
![Version](https://img.shields.io/badge/Version-3.0.0-10b981?style=flat-square)
![Tests](https://img.shields.io/badge/Tests-109%20Passing-success?style=flat-square)
![License](https://img.shields.io/badge/License-Proprietary-8b5cf6?style=flat-square)

**A high-concurrency, cloud-native full-stack banking ecosystem combining financial intelligence, rigorous 5-tier role-based access control, cryptographic audit chains, and native Computer Science Data Structures & Algorithms driving core fintech operations.**

[Explore Features](#-core-features) • [System Architecture](#-system-architecture) • [DSA Showcase](#-dsa-in-fintech) • [Quick Start](#-quick-start) • [API Specs](#-api-specification) • [Deployment](#-cloud-deployment)

---

</div>

## 📌 Executive Summary

**NEXA** is engineered from the ground up to bridge the divide between theoretical computer science and production enterprise finance. Unlike boilerplate banking demos, NEXA combines:
- **Asynchronous FastAPI Engine**: Sub-millisecond latency routing with SQLAlchemy 2 ORM, Pydantic 2 validation, connection pooling, and in-memory or Redis-backed sliding-window rate limiting.
- **Next-Gen React 18 SPA**: Built with Vite 8, Framer Motion transitions, 13 interactive Recharts dashboards, Lucide iconography, and an interactive Three.js 3D global financial activity sphere.
- **Embedded CS Data Structures (DSA)**: 7 bespoke data structures (Trie, Graph, BST, Priority Queue, Tamper-Evident Blockchain List, Audit Stack, Custom Hash Table) wired directly into transaction execution, search, and audit pipelines.
- **Financial Intelligence Suite**: Machine learning fraud classification, Anti-Money Laundering (AML) circular fund cycle detection, loan credit-scoring heuristic engines, and ARIMA cashflow forecasting.
- **Defense-in-Depth Security**: JWT access/refresh token rotation, TOTP multi-factor authentication (MFA), 5-level Role-Based Access Control (RBAC), and immutable audit logs.

---

## 🏛️ System Architecture

```text
                                  ┌─────────────────────────────────────────┐
                                  │       Client Browser / Mobile SPA       │
                                  │   React 18 + Vite + Tailwind + Three.js │
                                  └────────────────────┬────────────────────┘
                                                       │
                                        HTTPS / WSS   │  REST API + Realtime
                                                       ▼
                                  ┌─────────────────────────────────────────┐
                                  │        Nginx Reverse Proxy / WAF        │
                                  │      SSL Termination + Rate Limits      │
                                  └────────────────────┬────────────────────┘
                                                       │
                          ┌────────────────────────────┴──────────────────────────┐
                          │                                                       │
                          ▼                                                       ▼
            ┌───────────────────────────┐                           ┌───────────────────────────┐
            │   FastAPI Web Services    │                           │    WebSocket Gateway      │
            │  • Auth & TOTP MFA        │                           │  • Live Balance Stream    │
            │  • Banking Core & Cards   │                           │  • Transaction Feeds      │
            │  • Intelligence / ML      │                           │  • System Alerts          │
            └─────────────┬─────────────┘                           └─────────────┬─────────────┘
                          │                                                       │
       ┌──────────────────┼──────────────────────────────┬────────────────────────┘
       │                  │                              │
       ▼                  ▼                              ▼
┌──────────────┐   ┌──────────────┐              ┌──────────────┐            ┌────────────────────────┐
│  PostgreSQL  │   │   Redis 7    │              │   Neo4j      │            │   7x Native In-Memory  │
│  Version 15  │   │ Sliding Rate │              │ Transaction  │            │     DSA Engines        │
│ Relational DB│   │ Limiter, OTP │              │ Money Graph  │            │ BST, Graph, Trie, etc. │
└──────────────┘   └──────────────┘              └──────────────┘            └────────────────────────┘
```

---

## ✨ Core Features

### 🏦 1. Banking Operations & Multi-Currency Engine
- **Account Management**: Instant creation and management of Checking, Savings, and Investment accounts with unique IBAN-formatted account numbers.
- **Fund Transfers**: Real-time internal transfers, external ACH/wire simulations, and multi-currency exchange supporting **20+ FX pairs** with real-time conversion rates.
- **Digital Cards & Virtual Wallets**: Virtual debit and credit card issuance, one-click card freeze/unfreeze, spend limit setting, and CVV regeneration.
- **Loan Origination**: Application lifecycle with automated credit risk scoring, interest amortization calculation, and repayment scheduling.
- **Bill Pay & Recurring Transfers**: Automated utility, telecom, and subscription settlements with scheduling and receipt generation.

### 🔐 2. Enterprise Security & Identity Management
- **Token Lifecycle**: Dual-token authentication with short-lived JWT access tokens and secure HTTP-only refresh tokens with rotation.
- **Multi-Factor Authentication (MFA)**: Built-in TOTP (Google Authenticator, Authy) setup with QR code generation and recovery keys.
- **Granular RBAC**: 5 strictly enforced privilege roles:
  - `super_admin`: Full system control, role elevation, database snapshots.
  - `admin`: User administration, compliance oversight, system flags.
  - `manager`: Loan approvals, high-limit overrides, branch analytics.
  - `staff`: Customer verification, transaction viewing, ticket response.
  - `customer`: Self-service accounts, transfers, cards, portfolio.
- **Sliding-Window Rate Limiting**: Redis-backed sliding-window throttle (with transparent in-memory fallback for offline dev/CI environments).
- **Security Headers & Protections**: HSTS, Content-Security-Policy (CSP), X-Frame-Options, CSRF guards, and SQL Injection / XSS mitigations verified via test suites.

### 🧠 3. Financial Intelligence & ML Analytics
- **Machine Learning Fraud Detection**: Real-time scoring evaluating transaction velocity, geolocation anomalies, amount deviations, and historical spend patterns.
- **AML Network Detection**: Graph-based circular transaction analysis to detect smurfing, structuring, and money laundering rings.
- **Predictive Cashflow Forecasting**: Automated cashflow projections and trend analysis based on past transaction histories.
- **Portfolio Optimization**: Modern Portfolio Theory (MPT) asset allocation models for investment tracking.

### 🔌 4. Realtime Streaming & Notifications
- **Live WebSocket Dashboard**: Stream updates to the React client via `WS /ws/dashboard?token=<JWT>` for zero-latency balance and transaction changes.
- **Notification Inbox**: Targeted user notifications, read/unread states, and broadcast emergency alert capabilities for administrators.

---

## 🧩 DSA in Fintech

NEXA natively embeds 7 Computer Science Data Structures to solve genuine algorithmic challenges in modern financial ledgers:

| Data Structure | Implementation Module | Banking Function & Algorithmic Value |
|---|---|---|
| 🌲 **Binary Search Tree** | `transaction_tree.py` | **$O(\log N)$ Transaction Queries**: Indexed binary tree storing chronological transactions, enabling instant sub-millisecond date-range searches and audit window slices. |
| 🕸️ **Directed Graph** | `account_graph.py` | **Fraud & AML Graph Analytics**: Node/edge topology representing account relationships, detecting cycle paths (circular money laundering) and shortest transfer distances. |
| 🔤 **Trie (Prefix Tree)** | `trie.py` | **Instant Search & Autocomplete**: $O(L)$ prefix lookup for counterparty accounts, usernames, and beneficiary directories with instant keystroke matching. |
| ⚡ **Priority Queue (Heap)** | `approval_queue.py` | **Wire Transfer Settlement Priority**: Max-Heap orchestrating pending transactions prioritized by VIP tier, high-value thresholds, and time-criticality. |
| 🔗 **Cryptographic Block List** | `transaction_chain.py` | **Tamper-Evident Ledger**: Doubly linked cryptographic blocks where each node stores the hash of its predecessor, enabling instant detection of historical ledger tampering. |
| 📚 **Audit Stack** | `audit_stack.py` | **LIFO Administrative Rollback**: Tracks administrative actions and state modifications for rapid sequential undo/redo and session rollback. |
| 🗄️ **Collision-Resistant Hash Table** | `hash_table.py` | **$O(1)$ In-Memory Account Indexing**: Custom polynomial hashing and separate chaining collision resolution for high-frequency internal lookups. |

> Interactive DSA visualizations and benchmarks are exposed directly within the **Admin Portal** under `/admin/dsa-showcase` and via the `/api/admin/dsa/*` API endpoints.

---

## 🧰 Technology Stack

```text
┌────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                  │
├───────────────────┬───────────────────┬────────────────────────────────┤
│ React 18.3 (SPA)  │ Vite 8.0          │ Tailwind CSS + Custom Tokens   │
│ Framer Motion     │ Recharts Engine   │ Three.js / React Three Fiber   │
│ Lucide React      │ Axios Interceptor │ React Router DOM v6            │
└───────────────────┴───────────────────┴────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                   │
├───────────────────┬───────────────────┬────────────────────────────────┤
│ FastAPI           │ Python 3.11+      │ SQLAlchemy 2 (Async + Sync)    │
│ Pydantic v2       │ Alembic           │ python-jose + passlib (bcrypt) │
│ orjson Serializer │ Pytest + Coverage │ Ruff Linter & Formatter        │
└───────────────────┴───────────────────┴────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────┐
│                        DATA, CACHE & INFRA                             │
├───────────────────┬───────────────────┬────────────────────────────────┤
│ PostgreSQL 15     │ SQLite (Local/CI) │ Redis 7 (Cache & Rate Limiter) │
│ Neo4j Graph DB    │ Docker & Compose  │ Nginx Reverse Proxy            │
│ Vercel (Frontend) │ Render (Backend)  │ Kubernetes Manifests (k8s/)    │
└───────────────────┴───────────────────┴────────────────────────────────┘
```

---

## 🗂 Project Structure

```bash
Nexus-Bank/
├── .github/                      # GitHub Actions CI/CD workflows & issue templates
├── alembic/                      # Database schema versioning & migration scripts
├── bank_system/                  # Core FastAPI backend package
│   ├── api/routes/               # HTTP endpoints: auth, banking, analytics, admin, etc.
│   │   ├── admin.py              # User management, audit logs, and compliance
│   │   ├── analytics.py          # KPI metrics, chart feeds, and reporting
│   │   ├── auth.py               # Registration, JWT token rotation, and MFA
│   │   ├── banking.py            # Accounts, deposits, withdrawals, and loans
│   │   ├── dsa_admin.py          # Interactive DSA visualization API endpoints
│   │   ├── intelligence.py       # ML fraud classifier, AML graph, and forecasting
│   │   ├── notifications.py      # User notifications and admin broadcast feeds
│   │   └── services.py           # FX currency rates, virtual cards, and BillPay
│   ├── core/                     # Application settings, database engine, security & redis
│   │   ├── config.py             # Pydantic Settings environment configuration
│   │   ├── db.py                 # SQLAlchemy engine and session dependency
│   │   ├── event_bus.py          # Internal asynchronous publish-subscribe bus
│   │   ├── realtime.py           # Authenticated WebSocket connection manager
│   │   └── security.py           # Passlib bcrypt hashing, JWT issuance & TOTP
│   ├── data_structures/          # 7 Custom algorithmic data structures
│   │   ├── account_graph.py      # Directed graph for AML network tracing
│   │   ├── approval_queue.py     # Priority queue for transactional batching
│   │   ├── audit_stack.py        # LIFO stack for administrative audit rollbacks
│   │   ├── hash_table.py         # Custom separate-chaining hash table
│   │   ├── transaction_chain.py  # Cryptographically verified block list
│   │   ├── transaction_tree.py   # Binary search tree for range queries
│   │   └── trie.py               # Prefix search tree for accounts & names
│   ├── middleware/               # Rate limiters, audit loggers, security headers
│   ├── models/                   # SQLAlchemy declarative database entities
│   ├── schemas/                  # Pydantic request/response schema contracts
│   ├── services/                 # Business logic, FX calculation, ML models
│   └── seed.py                   # Automatic database population on clean starts
├── frontend/                     # React 18 Single Page Application
│   ├── src/
│   │   ├── components/           # Reusable UI elements (Navbar, Modals, Cards, Charts)
│   │   ├── layouts/              # CustomerLayout, AdminLayout, and AuthLayout
│   │   ├── pages/                # 30+ Application view components
│   │   │   ├── admin/            # Compliance, Fraud, DSA, Settings, Audit Logs
│   │   │   ├── auth/             # Login, Register, MFA Challenge, Recovery
│   │   │   ├── customer/         # Dashboard, Transfers, Cards, Loans, Analytics
│   │   │   └── public/           # Marketing Landing, Features, About, Contact
│   │   ├── hooks/                # Custom React hooks (useNotifications, etc.)
│   │   └── api.js                # Axios instance with automated token refresh
├── docs/                         # Comprehensive architectural blueprints & audits
├── tests/                        # 109 Unit, integration, security & load test suites
├── docker-compose.yml            # Multi-container local development stack
├── docker-compose.prod.yml       # Production-ready container orchestration
├── Dockerfile                    # Multi-stage optimized FastAPI container
├── Dockerfile.frontend           # Multi-stage Nginx-served React SPA container
├── render.yaml                   # Infrastructure-as-Code for Render backend deployment
└── README.md                     # Repository documentation
```

---

## ⚡ Quick Start

### 🐳 Option A: Docker Compose (Recommended)

Spin up the entire stack (FastAPI Backend, PostgreSQL 15, Redis 7, Neo4j, and React Frontend) with a single command:

```bash
# 1. Clone the repository
git clone https://github.com/SyedAynan/Nexus-Bank.git
cd Nexus-Bank

# 2. Configure environment variables
cp .env.example .env

# 3. Launch all services
docker-compose up -d --build
```

Access the services:
- **Web Application**: [http://localhost:5173](http://localhost:5173)
- **FastAPI Documentation (Swagger UI)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Interactive ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

### 💻 Option B: Local Development (Bare Metal)

#### Backend Setup
```bash
# 1. Create and activate a Python virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# 2. Install dependencies
pip install -r bank_system/requirements.txt

# 3. Copy sample environment file
cp .env.example .env

# 4. Start the development server
uvicorn bank_system.main:app --reload --port 8000
```

#### Frontend Setup
```bash
# Open a second terminal window
cd frontend

# 1. Install Node.js packages
npm install

# 2. Start Vite development server
npm run dev
```

---

## 🔑 Demo Credentials

On startup, NEXA automatically populates an empty database with realistic enterprise test records (`seed.py`):

| Portal | Username / Email | Password | Role | Permissions |
|---|---|---|---|---|
| **Admin Console** | `admin` | `admin123` | `super_admin` | Global access, user management, audit logs, DSA controls |
| **Customer Portal** | `john_doe` | `password123` | `customer` | Checking/Savings accounts, cards, transfers, loan suite |
| **New Accounts** | *Self Registration* | *User defined* | `customer` | Instant registration with checking account generation |

> ⚠️ **Important**: For staging and production deployments, make sure to change default credentials and rotate the `SECRET_KEY` in your `.env` configuration.

---

## 🔌 API Specification

NEXA provides an OpenAPI 3.0-compliant RESTful interface alongside real-time WebSocket channels:

| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `POST` | `/api/auth/register` | Register new customer account | No |
| `POST` | `/api/auth/login` | Authenticate credentials & issue JWT tokens | No |
| `POST` | `/api/auth/refresh` | Rotate expired access tokens via refresh token | Refresh Token |
| `GET` | `/api/auth/me` | Fetch active user profile and roles | Bearer Token |
| `POST` | `/api/auth/mfa/setup` | Generate TOTP QR code & recovery keys | Bearer Token |
| `GET` | `/api/banking/accounts` | Retrieve user accounts and balances | Bearer Token |
| `POST` | `/api/banking/accounts` | Open checking or savings account | Bearer Token |
| `POST` | `/api/banking/transfer` | Execute atomic internal/wire transfer | Bearer Token |
| `GET` | `/api/banking/transactions` | Query transaction ledger with filters | Bearer Token |
| `POST` | `/api/banking/loans/apply` | Submit credit loan application | Bearer Token |
| `GET` | `/api/analytics/dashboard` | 13-KPI aggregate analytics summary | Bearer Token |
| `GET` | `/api/intelligence/fraud/evaluate` | ML fraud evaluation on proposed transaction | Bearer Token |
| `GET` | `/api/intelligence/aml/rings` | Detect circular graph transactions | Admin |
| `GET` | `/api/admin/users` | Paginated enterprise customer records | Admin |
| `GET` | `/api/admin/dsa/*` | Live data structure visualizer feeds | Admin |
| `GET` | `/api/notifications` | User notification inbox and read status | Bearer Token |
| `WS` | `/ws/dashboard` | Real-time WebSocket financial stream | `?token=<JWT>` |
| `GET` | `/api/health` | Comprehensive system & database health check | No |

---

## 🧪 Testing & Quality Assurance

NEXA maintains high code quality and test coverage across unit logic, API integration, and security audits:

```bash
# Run complete test suite (109 passing tests)
pytest tests/ -v

# Run with test coverage report
pytest tests/ -v --cov=bank_system --cov-report=term-missing

# Lint and check style using Ruff
ruff check bank_system/
ruff format --check bank_system/

# Test frontend production build
cd frontend && npm run build
```

### Test Suite Distribution
- **`tests/unit/`**: Data Structure correctness (Trie, Graph, BST, Priority Queue, Crypto Chain), financial math, and FX conversion.
- **`tests/integration/`**: Authentication lifecycles, account creation, transfer invariants, and loan amortization.
- **`tests/security/`**: SQL Injection resistance, XSS sanitization, authentication bypass prevention, token expiration, and CSRF/CORS header audits.
- **`tests/load/`**: Locust load simulation scenarios testing sustained throughput under concurrent load.

---

## 🚢 Cloud Deployment

### 1. Render (Backend API & Workers)
The repository includes an automated blueprint configuration (`render.yaml`):
- Connect the repository to [Render](https://render.com).
- Render automatically provisions the FastAPI web service, Managed PostgreSQL instance, and sets required health checks to `/api/health`.

### 2. Vercel (Frontend SPA)
The `frontend/` directory includes built-in reverse proxy routing (`frontend/vercel.json`):
- Connect `frontend` as the project root in [Vercel](https://vercel.com).
- Set `VITE_API_URL=/api` and configure rewrite rules to forward API calls directly to your Render backend.

### 3. Kubernetes (k8s/)
Declarative manifests for microservice deployment:
```bash
kubectl apply -f k8s/
```

---

## 🛡️ Security & Responsible Disclosure

Security is fundamental to financial engineering. NEXA includes:
- Industry-standard bcrypt password hashing (`passlib`).
- Constant-time string comparisons to prevent timing attacks.
- Tamper-proof signed JWTs with algorithmic verification.
- Context-aware rate limiting preventing credential stuffing.

For full guidelines and vulnerability disclosures, refer to [SECURITY.md](SECURITY.md).

---

## 🤝 Contributing

We welcome contributions from the open-source community!
1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/InnovativeFeature`).
3. Commit your changes adhering to conventional commit standards (`git commit -m 'feat: Add innovative feature'`).
4. Push to the Branch (`git push origin feature/InnovativeFeature`).
5. Open a Pull Request.

Please review our [CONTRIBUTING.md](CONTRIBUTING.md) guide before submitting PRs.

---

## 📄 License & Authors

- **Author**: [Syed Aynan](https://github.com/SyedAynan)
- **Copyright**: © 2026 NEXA — Beyond Fintech. All rights reserved.
- **License**: Proprietary — Refer to [LICENSE](LICENSE) for terms of use.

<div align="center">

**Built with dedication to robust financial engineering and Computer Science excellence.**

⭐ *If you find this project informative or useful, please consider starring the repository!* ⭐

</div>
