# Security Policy

## Supported versions

| Version | Supported |
|---|---|
| `main` (latest) | ✅ |
| Older commits / forks | ❌ Best-effort only |

## Reporting a vulnerability

**Do not open a public issue for security reports.** Use GitHub's
**Private vulnerability reporting** (Security tab → Report a vulnerability)
or contact the maintainer via their GitHub profile.

Include: affected route/file, reproduction steps, and impact.
Expect an acknowledgement within 7 days.

## Must-fix before any public deployment

- [x] **`.env.production` untracked** — removed from the git index (root +
  `frontend/`) and `.gitignore` now excludes all `.env*` except `.env.example`.
- [ ] **History purge + secret rotation** — `.env.production` still exists in
  git history. Purge it (`git filter-repo`) and rotate every secret it
  contained before any public deployment.
- [ ] **Demo credentials** (`admin`/`admin123`) are seeded when `DEMO_MODE=true`
  and documented in `DEPLOY.md`. Set `DEMO_MODE=false` and create real users
  (`create_admin.py` / register endpoint) in production.
- [x] **Swagger/ReDoc** (`/docs`, `/redoc`) are disabled when
  `ENVIRONMENT=production` (`bank_system/main.py`).
- [ ] Confirm `DEBUG=false`, `ENVIRONMENT=production`, a persistent
  `SECRET_KEY`, and Postgres `DATABASE_URL` (never SQLite on Render —
  its filesystem is ephemeral). See `DEPLOY.md`.

## Built-in controls (already in code)

- JWT access/refresh + TOTP MFA, 5-role RBAC, server-side auth on every router
- Redis sliding-window rate limiting (`middleware/rate_limiter.py`)
- Security headers — HSTS, CSP, X-Frame-Options (`middleware/security_headers.py`)
- CORS allow-list (never `*` in production — `ALLOWED_ORIGINS` in `main.py`)
- Central exception handlers (no stack traces to clients), request logging
- WebSocket `/ws/dashboard` requires a valid JWT `?token=`

## Out of scope for this policy

Educational DSA demo code (`data_structures/`, `simulation/`) is not
hardened — do not expose demo/simulation endpoints as production APIs.
