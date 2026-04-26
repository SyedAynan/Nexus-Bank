# NEXA Deployment Guide — Vercel + Railway

## Architecture

```
[Vercel - Frontend]  ──/api proxy──▶  [Railway - Backend]  ──▶  [Cloud PostgreSQL]
     (React/Vite)                         (FastAPI)                 (Neon/Supabase)
                                              │
                                              ▼
                                     [Redis - Optional]
                                      (Upstash/FakeRedis)
```

## Step 1: Set Up Cloud PostgreSQL

Choose one (all have free tiers):

### Option A: Neon (Recommended)
1. Go to [neon.tech](https://neon.tech) → Sign up
2. Create a new project → Copy the connection string
3. Format: `postgresql://user:pass@ep-xxx.region.neon.tech/dbname?sslmode=require`
4. **Important**: Replace the `postgres://` prefix with `postgresql+psycopg2://` for SQLAlchemy

### Option B: Supabase
1. Go to [supabase.com](https://supabase.com) → Create project
2. Go to Settings → Database → Connection string (URI)
3. Replace `postgres://` with `postgresql+psycopg2://`

### Option C: Railway PostgreSQL
1. In Railway dashboard → New → Database → PostgreSQL
2. Copy the `DATABASE_URL` from the PostgreSQL service variables
3. Replace `postgres://` with `postgresql+psycopg2://`

---

## Step 2: Deploy Backend on Railway

### 2a. Connect Repository
1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select the `Nexus-Bank` repository
3. Railway will auto-detect the `railway.json` configuration

### 2b. Set Environment Variables
In Railway dashboard → Your service → Variables tab, add:

```
ENVIRONMENT=production
DEBUG=false
DEMO_MODE=true
SECRET_KEY=<run: openssl rand -base64 64>
DATABASE_URL=postgresql+psycopg2://user:pass@host:5432/dbname
REDIS_URL=
FRONTEND_URL=https://your-app.vercel.app
PYTHONPATH=/app
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRES_MINUTES=30
REFRESH_TOKEN_EXPIRES_MINUTES=10080
ML_MODEL_DIR=bank_system/ml_models
EVENT_BUS_MODE=in-process
```

> **Note**: Leave `REDIS_URL` empty to use the built-in FakeRedis fallback.
> For production Redis, use [Upstash](https://upstash.com) (free tier available).

### 2c. Set Root Directory (if needed)
If Railway deploys from the wrong directory:
- Go to Settings → Root Directory → Leave empty (project root)

### 2d. Verify Deployment
```bash
curl https://YOUR-RAILWAY-URL.up.railway.app/api/health
```
Expected response:
```json
{"status": "healthy", "environment": "production", "version": "4.0.0", "services": {"database": "connected", "redis": "fallback (in-memory)"}}
```

### 2e. Test Login
```bash
curl -X POST https://YOUR-RAILWAY-URL.up.railway.app/api/auth/login \
  -d "username=admin&password=admin123" \
  -H "Content-Type: application/x-www-form-urlencoded"
```
Expected: JSON with `access_token`, `refresh_token`, `user` fields.

---

## Step 3: Deploy Frontend on Vercel

### 3a. Connect Repository
1. Go to [vercel.com](https://vercel.com) → New Project → Import Git Repository
2. Select the `Nexus-Bank` repository
3. **Set the Root Directory to `frontend`** (critical!)
4. Framework preset: Vite
5. Build command: `npm run build`
6. Output directory: `dist`

### 3b. Set Environment Variables
In Vercel dashboard → Settings → Environment Variables:

```
VITE_API_URL=/api
```

### 3c. Update vercel.json
Replace `YOUR_RAILWAY_URL` in `frontend/vercel.json` with your actual Railway URL:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-actual-railway-url.up.railway.app/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 3d. Update Railway FRONTEND_URL
Go back to Railway → Variables → Update:
```
FRONTEND_URL=https://your-actual-vercel-url.vercel.app
```

---

## Step 4: Verify End-to-End

1. Open your Vercel URL in a browser
2. Login with: `admin` / `admin123`
3. Verify dashboard loads with data
4. Check browser DevTools → Network tab for any failed requests
5. Check browser DevTools → Console for any CORS errors

---

## Troubleshooting

### "Invalid credentials" in production
1. Check Railway logs for "Database seeded successfully"
2. If not seeded, verify `DEMO_MODE=true` in Railway env vars
3. Test directly: `curl -X POST https://RAILWAY_URL/api/auth/login -d "username=admin&password=admin123"`

### CORS errors in browser
1. Check Railway env var `FRONTEND_URL` matches your Vercel URL exactly
2. Ensure `vercel.json` proxy is configured (this eliminates CORS)
3. Check Railway logs for "CORS allowed origins:" line

### Railway stuck on "Deploying"
1. Check Railway logs for startup errors
2. Verify `DATABASE_URL` is a valid PostgreSQL connection string (not SQLite)
3. Verify `PYTHONPATH=/app` is set
4. Check if `startup_checks.py` is blocking startup (look for "FATAL" in logs)

### Database connection refused
1. Verify the PostgreSQL service is running
2. Check if `?sslmode=require` is needed (Neon requires it)
3. Ensure the connection string starts with `postgresql+psycopg2://` (not `postgres://`)

### Frontend shows blank page
1. Verify Vercel Root Directory is set to `frontend`
2. Check Vercel build logs for errors
3. Verify `VITE_API_URL=/api` is set in Vercel env vars
