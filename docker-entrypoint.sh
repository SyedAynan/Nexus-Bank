#!/bin/sh
set -e

echo "═══════════════════════════════════════════════"
echo "  NEXA — Production Entrypoint"
echo "═══════════════════════════════════════════════"

# Wait for PostgreSQL
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

# Wait for Redis
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

# Run migrations
echo "[3/4] Running database migrations..."
if [ -f "alembic.ini" ]; then
    alembic upgrade head 2>/dev/null || echo "  Alembic migration skipped (tables created by SQLAlchemy)"
fi

# Seed data
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

# Start uvicorn
exec uvicorn bank_system.main:app \
    --host 0.0.0.0 \
    --port "${PORT:-8000}" \
    --workers "${WORKERS:-4}" \
    --access-log \
    --log-level info
