# NEXA — Beyond Fintech

**Enterprise Digital Banking Platform** — Secure, Intelligent, Production-Ready.

![Status](https://img.shields.io/badge/Status-Production%20Ready-22d3ee?style=flat-square)
![License](https://img.shields.io/badge/License-Proprietary-a78bfa?style=flat-square)
![Version](https://img.shields.io/badge/Version-3.0.0-34d399?style=flat-square)

---

## Overview

NEXA is an enterprise-grade digital banking platform built for institutional trust, regulatory compliance, and intelligent financial management. It combines a high-performance **FastAPI** backend with a **React** SPA featuring a futuristic sci-fi aesthetic with glassmorphism, neon glow effects, and real-time data visualization.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    NEXA Platform                        │
├────────────────────┬────────────────────────────────────┤
│  React SPA (Vite)  │  FastAPI Backend                   │
│  ├─ Glassmorphism  │  ├─ Auth (JWT + MFA)               │
│  ├─ Framer Motion  │  ├─ Banking API                    │
│  ├─ Recharts       │  ├─ Admin Console                  │
│  └─ Lucide Icons   │  ├─ Fraud Detection Engine         │
│                    │  ├─ Risk Intelligence               │
│                    │  ├─ AML Monitoring                  │
│                    │  └─ Analytics Engine                │
├────────────────────┴────────────────────────────────────┤
│  PostgreSQL 15  │  Redis 7  │  Docker Compose           │
└─────────────────────────────────────────────────────────┘
```

## Key Features

| Category | Features |
|----------|----------|
| **Banking** | Accounts, Payments, Transfers, Transactions, Credit & Loans |
| **Security** | JWT + MFA, Rate Limiting, RBAC, Session Management, Audit Logging |
| **Compliance** | KYC Verification, AML Monitoring, Regulatory Reporting |
| **Intelligence** | Fraud Detection, Risk Scoring, Financial Health Analytics |
| **Admin** | User Management, Transaction Monitoring, System Settings |

## Tech Stack

- **Frontend**: React 18, Vite, Framer Motion, Recharts, Lucide React, Tailwind CSS
- **Backend**: FastAPI, SQLAlchemy, Pydantic, Alembic
- **Database**: PostgreSQL 15 (Alpine)
- **Cache**: Redis 7 (Alpine)
- **Auth**: JWT + TOTP MFA
- **Deployment**: Docker Compose, CI/CD ready

## Quick Start

```bash
# Clone and start
git clone <repo> && cd nexa
docker-compose up -d --build

# Services
# API:      http://localhost:8000
# Frontend: http://localhost:5173
# Swagger:  http://localhost:8000/docs

# Demo credentials
# Username: admin | Password: admin123 | OTP: 000000
```

## Security

- **Authentication**: JWT access/refresh tokens with TOTP-based MFA
- **Authorization**: Role-based access control (Super Admin, Compliance, Support, Analytics, User)
- **Transport**: HTTPS enforced, HSTS headers, CSP
- **Rate Limiting**: Redis-backed sliding window
- **Audit**: Complete security event logging with IP/User-Agent tracking

## Compliance

- **KYC**: Identity verification pipeline with document and biometric checks
- **AML**: Real-time transaction pattern analysis and suspicious activity detection
- **Audit Trail**: Tamper-proof logging of all user actions and admin operations
- **Reporting**: SAR, CTR, and regulatory filing support

## License

© 2026 NEXA — Beyond Fintech. All rights reserved.
