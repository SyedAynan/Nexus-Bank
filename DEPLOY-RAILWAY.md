# NEXA — Deploy to Vercel + Railway (10 min)

```
[Vercel — React frontend] ──rewrite /api + /ws──▶ [Railway — FastAPI] ──▶ [Neon Postgres]
      (static + edge)                                (uvicorn, 1 worker)        (free)
```

Everything is already wired in the repo. You only plug in URLs + secrets.

---

## Step 1 — Postgres (Neon, 1 min)

1. https://neon.tech → Sign up → **New Project** → copy the connection string:
   `postgresql://user:pass@ep-xxx.region.neon.tech/neondb?sslmode=require`
2. **Add the SQLAlchemy driver tag** — change `postgresql://` → `postgresql+psycopg2://`:
   `postgresql+psycopg2://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`
   (keep this — needed in Step 2)

> Free alternatives: Supabase, Railway Postgres plugin. Same format.

## Step 2 — Backend on Railway (3 min)

1. https://railway.app → **New Project → Deploy from GitHub repo** → pick `Nexus-Bank`.
   - `railway.toml` + `nixpacks.toml` auto-configure build + start (no manual settings needed).
2. **Variables tab** — add:

   | Key | Value |
   |-----|-------|
   | `ENVIRONMENT` | `production` |
   | `DEBUG` | `false` |
   | `DEMO_MODE` | `true` *(seeds admin/admin123 — set `false` after first login)* |
   | `SECRET_KEY` | run `python -c "import secrets;print(secrets.token_urlsafe(64))"` — paste output |
   | `DATABASE_URL` | your Neon URL **with `+psycopg2`** from Step 1 |
   | `FRONTEND_URL` | your Vercel URL — add after Step 3 |
   | `JWT_ALGORITHM` | `HS256` |
   | `EVENT_BUS_MODE` | `in-process` |

3. Deploy → **Settings → Networking → Generate Domain** → copy `https://xxx.up.railway.app`
4. **Verify**: open `https://xxx.up.railway.app/api/health` → `{"status":"healthy"}`

## Step 3 — Frontend on Vercel (3 min)

1. In the repo, edit `frontend/vercel.json` — replace **both** `YOUR_RAILWAY_BACKEND.up.railway.app` with your real Railway domain. Commit + push (Vercel rewrites need literal URLs, not env vars).
2. https://vercel.com → **Add New → Project** → import `Nexus-Bank`.
   - **Root Directory**: `frontend`
   - Framework: Vite · Build: `npm run build` · Output: `dist` *(auto-detected)*
3. **Environment Variables**: `VITE_API_URL` = `/api`
4. Deploy → copy your `https://xxx.vercel.app` URL.

## Step 4 — Connect back (1 min)

- Railway → Variables → set `FRONTEND_URL` = your Vercel URL → redeploy.
  *(This whitelist the Vercel origin in CORS.)*

## Step 5 — Verify

Open the Vercel URL → log in **admin / admin123** → dashboard loads.
Then: Railway → set `DEMO_MODE=false` → redeploy (locks down seeding).

---

### How it works
- Browser hits `vercel.app/api/*` → Vercel rewrites to `railway.app/api/*` (same-origin → **no CORS, cookies work**).
- `/ws/*` proxied the same way for the live dashboard socket (`wss://` auto-selected on HTTPS).
- Backend on Railway binds `$PORT`, validates env, creates tables, seeds admin, runs sim engine.

### Troubleshooting
| Symptom | Fix |
|---|---|
| Blank page | Vercel Root Dir must be `frontend`; check build log |
| Login 400/404 | `vercel.json` still has placeholder — set real Railway domain, push |
| CORS error | `FRONTEND_URL` on Railway must match Vercel URL exactly (`https://`, no trailing slash) |
| "Invalid credentials" | `DEMO_MODE=true` not set, or check Railway logs for "Database seeded" |
| Health check failing | `DATABASE_URL` needs `+psycopg2` driver tag + `?sslmode=require` (Neon) |
| 5xx on first request | Railway cold start (~5–10s on free tier) — refresh |
