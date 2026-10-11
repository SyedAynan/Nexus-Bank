# Contributing to NEXA

Thanks for contributing! Small, focused PRs beat big rewrites.

## Workflow

1. Branch from `main`: `feat/<short-name>` or `fix/<short-name>`
2. One feature or fix per PR; keep docs (`README`, `DEPLOY.md`) in sync when behavior changes
3. Fill in the PR template (what / why / how tested)

## Conventional commits

```
feat: add FX quote caching to multicurrency service
fix: scope notifications router behind auth
docs: correct local SQLite quickstart
chore: bump redis pin
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.

## Backend (`bank_system/`, FastAPI)

- Entry point is `bank_system/main.py` — new routers must be `include_router`'d there.
- Auth: JWT via `core/security.py`; never roll your own token logic.
- DB: SQLAlchemy models in `models/db_models.py`; schema changes go through
  `alembic/` migrations, not `create_all` hacks.
- Validate with Pydantic schemas (`schemas/`); return stable error shapes via
  `core/exceptions.py` handlers.
- Checks before push: `ruff check bank_system/`, `ruff format --check bank_system/`,
  `pytest tests/ -v` (SQLite — never point tests at Postgres).

## Frontend (`frontend/`, React + Vite)

- Pages live in `src/pages/{public,auth,customer,admin}`; shared UI in `src/components`.
- API calls go through `src/api.js` against `VITE_API_URL` — no hardcoded hosts.
- `npm run build` must pass; keep Tailwind classes consistent with existing theme.

## What not to commit

`.env`, real credentials, DB dumps, `node_modules/`, `.venv/`, `__pycache__/`,
`*.db` — `.gitignore` covers these. Run `git status` before pushing.
Never commit a populated `.env.production` — use platform env vars.
