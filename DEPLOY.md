# NEXA Deployment Guide — Vercel + Render

## Architecture

```
[Vercel - Frontend]  ──/api proxy──▶  [Render - Backend]  ──▶  [Cloud PostgreSQL]
     (React/Vite)                        (FastAPI/Python)        (Neon/Supabase)
                                              │
                                              ▼
                                     [Redis - Optional]
                                      (Upstash/FakeRedis)
```

---

## Step 1: Set Up Cloud PostgreSQL

Choose one (all have free tiers):

### Option A: Neon (Recommended)
1. Go to [neon.tech](https://neon.tech) → Sign up
2. Create a new project → Copy the connection string
3. Format: `postgresql://user:pass@ep-xxx.region.neon.tech/dbname?sslmode=require`
4. **Important**: Replace `postgres://` with `postgresql+psycopg2://` for SQLAlchemy

### Option B: Supabase
1. Go to [supabase.com](https://supabase.com) → Create project
2. Go to Settings → Database → Connection string (URI)
3. Replace `postgres://` with `postgresql+psycopg2://`

### Option C: Render PostgreSQL (Integrated)
1. In Render dashboard → New → PostgreSQL
2. Copy the **Internal Database URL** from the PostgreSQL info page
3. Replace `postgres://` with `postgresql+psycopg2://`

---

## Step 2: Deploy Backend on Render

### 2a. Connect Repository
1. Go to [render.com](https://render.com) → New → **Web Service**
2. Connect your GitHub account → Select the `Nexus-Bank` repository
3. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `nexa-api` |
| **Region** | Oregon (US West) |
| **Branch** | `main` |
| **Root Directory** | *(leave empty)* |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r bank_system/requirements.txt` |
| **Start Command** | `uvicorn bank_system.main:app --host 0.0.0.0 --port $PORT` |

> **Alternative**: If you have `render.yaml` in your repo, Render will auto-detect it.
> Go to Render → New → **Blueprint** → Connect repo → Render reads `render.yaml` automatically.

### 2b. Set Environment Variables
In Render dashboard → Your web service → **Environment** tab, add:

| Variable | Value |
|----------|-------|
| `ENVIRONMENT` | `production` |
| `DEBUG` | `false` |
| `DEMO_MODE` | `true` |
| `SECRET_KEY` | *(click "Generate" — Render auto-generates a secure key)* |
| `DATABASE_URL` | `postgresql+psycopg2://user:pass@host:5432/dbname` |
| `REDIS_URL` | *(leave empty for FakeRedis fallback, or use Upstash URL)* |
| `FRONTEND_URL` | `https://your-app.vercel.app` |
| `PYTHONPATH` | `/opt/render/project/src` |
| `JWT_ALGORITHM` | `HS256` |
| `ACCESS_TOKEN_EXPIRES_MINUTES` | `30` |
| `REFRESH_TOKEN_EXPIRES_MINUTES` | `10080` |
| `ML_MODEL_DIR` | `bank_system/ml_models` |
| `EVENT_BUS_MODE` | `in-process` |

> **Critical**: `PYTHONPATH=/opt/render/project/src` is required for Python to find the `bank_system` package.

### 2c. Verify Deployment
After Render finishes deploying (check the Logs tab), test:

```bash
curl https://nexa-api.onrender.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "environment": "production",
  "version": "4.0.0",
  "services": {
    "database": "connected",
    "redis": "fallback (in-memory)"
  }
}
```

### 2d. Test Login Directly
```bash
curl -X POST https://nexa-api.onrender.com/api/auth/login \
  -d "username=admin&password=admin123" \
  -H "Content-Type: application/x-www-form-urlencoded"
```

Expected: JSON with `access_token`, `refresh_token`, `user` fields.

---

## Step 3: Deploy Frontend on Vercel

### 3a. Connect Repository
1. Go to [vercel.com](https://vercel.com) → **Add New Project** → Import Git Repository
2. Select the `Nexus-Bank` repository
3. Configure:

| Setting | Value |
|---------|-------|
| **Root Directory** | `frontend` *(critical!)* |
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

### 3b. Set Environment Variables
In Vercel dashboard → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `/api` |

### 3c. Update `vercel.json` (ONE-TIME)
Replace `YOUR_RENDER_URL` in `frontend/vercel.json` with your actual Render URL:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://nexa-api.onrender.com/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Commit and push — Vercel will auto-redeploy.

### 3d. Update Render FRONTEND_URL
Go back to Render dashboard → Environment → Update:
```
FRONTEND_URL=https://your-actual-vercel-url.vercel.app
```

---

## Step 4: Verify End-to-End

1. Open your Vercel URL in a browser
2. Login with: **admin** / **admin123**
3. Verify dashboard loads with data
4. Check browser DevTools → Network tab for any failed requests
5. Check browser DevTools → Console for any CORS errors

---

## Render-Specific Notes

### Free Tier Behavior
- Render free tier services **spin down after 15 minutes of inactivity**
- First request after spin-down takes **30-60 seconds** (cold start)
- Upgrade to Starter ($7/mo) for always-on
- The health check keeps the service alive while receiving traffic

### Render Auto-Deploy
- Render auto-deploys on every push to `main` branch
- You can disable this in Settings → Auto-Deploy → No

### Render Logs
- View live logs: Render dashboard → Your service → **Logs** tab
- Look for: "Database tables created", "Database seeded", "CORS allowed origins"

---

## Troubleshooting

### "Invalid credentials" in production
1. Check Render logs for "Database seeded successfully"
2. If not seeded, verify `DEMO_MODE=true` in Render env vars
3. Test directly:
   ```bash
   curl -X POST https://nexa-api.onrender.com/api/auth/login \
     -d "username=admin&password=admin123" \
     -H "Content-Type: application/x-www-form-urlencoded"
   ```

### CORS errors in browser console
1. Verify `FRONTEND_URL` in Render env matches your Vercel URL exactly (including `https://`)
2. The Vercel proxy approach eliminates CORS — ensure `vercel.json` rewrites are correct
3. Check Render logs for "CORS allowed origins:" line at startup

### Render deploy fails / crashes
1. Check Render **Logs** tab for the actual error
2. Verify `DATABASE_URL` is a valid PostgreSQL string (not SQLite `sqlite:///...`)
3. Verify `PYTHONPATH=/opt/render/project/src` is set
4. If `startup_checks.py` blocks startup, look for "FATAL" messages in logs

### Database connection refused
1. If using Neon: ensure `?sslmode=require` is in the URL
2. Ensure format is `postgresql+psycopg2://` (NOT `postgres://`)
3. Check if Render IP needs to be whitelisted in your DB provider

### Frontend shows blank page
1. Verify Vercel Root Directory = `frontend`
2. Check Vercel build logs for errors
3. Verify `VITE_API_URL=/api` is set in Vercel env vars

### Slow first request (30-60 seconds)
- This is normal on Render free tier (cold start after spin-down)
- Upgrade to Starter plan for always-on service
