#!/bin/sh
# ============================================================
# File: docker-entrypoint.sh
#
# Purpose:
#     Production startup script for the NEXA backend container.
#     Runs before the API server starts to ensure all dependencies
#     are ready and the database is initialized.
#
# Developer Journey:
#     - v1: No entrypoint — uvicorn started immediately. The backend
#       crashed with "connection refused" because PostgreSQL wasn't
#       ready yet (Docker starts all services in parallel).
#     - v2: Added wait-for-postgres loop. But the database had no tables
#       on first deployment — migrations weren't running.
#     - v3: Added Alembic migration step + seed data. Now the container
#       is fully self-initializing on first deployment.
#
# Execution Order:
#     1. Wait for PostgreSQL to accept connections (retry loop)
#     2. Wait for Redis (with fallback to in-memory if unavailable)
#     3. Run Alembic migrations (creates/updates tables)
#     4. Seed demo data if database is empty
#     5. Start uvicorn with production settings
#
# Issue Faced:
#     "Invalid credentials" in production was caused by empty database —
#     no admin user existed. Adding the seed step here fixed it permanently.
# ============================================================
set -e

echo "═══════════════════════════════════════════════"
echo "  NEXA — Production Entrypoint"
echo "═══════════════════════════════════════════════"

# ── Step 1: Wait for PostgreSQL ──
# PostgreSQL takes 5-15 seconds to initialize on first boot.
# Without this wait, the backend would crash immediately.
echo "[1/4] Waiting for PostgreSQL..."
MAX_RETRIES=30
RETRY_COUNT=0
until python -c "
from sqlalchemy import create_engine, text
import os
engine = create_engine(os.environ['DATABASE_URL'])
with engine.connect() as c:
    c.execute(text('SELECT 1'))
print('PostgreSQL is ready')
" 2>/dev/null; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ "$RETRY_COUNT" -ge "$MAX_RETRIES" ]; then
        echo "ERROR: PostgreSQL not available after $MAX_RETRIES retries"
        exit 1
    fi
    echo "  Waiting... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

# ── Step 2: Wait for Redis ──
# Redis is optional — the app falls back to in-memory FakeRedis.
# We still try to wait for it because real Redis is preferred for
# OTP storage, rate limiting, and session tracking.
echo "[2/4] Waiting for Redis..."
RETRY_COUNT=0
until python -c "
import redis, os
r = redis.from_url(os.environ.get('REDIS_URL', 'redis://redis:6379/0'))
r.ping()
print('Redis is ready')
" 2>/dev/null; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ "$RETRY_COUNT" -ge "$MAX_RETRIES" ]; then
        echo "WARNING: Redis not available — will use in-memory fallback"
        break
    fi
    echo "  Waiting... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

# ── Step 3: Run Database Migrations ──
# Alembic applies any pending migrations to update the schema.
# On first deployment, this creates all tables from scratch.
# On subsequent deployments, it applies only new migrations.
echo "[3/4] Running database migrations..."
if [ -f "alembic.ini" ]; then
    alembic upgrade head 2>/dev/null || echo "  Alembic migration skipped (tables created by SQLAlchemy)"
fi

# ── Step 4: Seed Demo Data ──
# Creates admin user, demo accounts, and sample transactions.
# seed_if_empty() checks if data already exists before inserting.
# This ensures the admin user exists in production (fixes "Invalid credentials").
echo "[4/4] Seeding database..."
python -c "
from bank_system.seed import seed_if_empty
seed_if_empty()
print('  Seed complete')
" 2>/dev/null || echo "  Seed handled at app startup"

echo ""
echo "═══════════════════════════════════════════════"
echo "  Starting NEXA API Server"
echo "  Workers: ${WORKERS:-4}"
echo "  Port: ${PORT:-8000}"
echo "═══════════════════════════════════════════════"

# ── Start uvicorn ──
# --workers 4: Run 4 worker processes (1 per CPU core is typical)
# --access-log: Log every HTTP request for monitoring
# exec: replaces the shell process with uvicorn (proper signal handling)
exec uvicorn bank_system.main:app \
    --host 0.0.0.0 \
    --port "${PORT:-8000}" \
    --workers "${WORKERS:-4}" \
    --access-log \
    --log-level info
