# ============================================================
# NEXA — Production-Ready Multi-Stage Dockerfile
# ============================================================

# Stage 1: Builder — install dependencies in a virtual env
FROM python:3.11-slim AS builder

WORKDIR /build

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && \
    apt-get install -y --no-install-recommends build-essential libpq-dev && \
    rm -rf /var/lib/apt/lists/*

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY bank_system/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt


# Stage 2: Runtime — minimal image with only runtime deps
FROM python:3.11-slim AS runtime

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONPATH="/app"

# Install only runtime libraries (no build tools)
RUN apt-get update && \
    apt-get install -y --no-install-recommends libpq5 curl && \
    rm -rf /var/lib/apt/lists/* && \
    groupadd -r nexusbank && \
    useradd -r -g nexusbank -d /app -s /sbin/nologin nexusbank

# Copy virtual env from builder
COPY --from=builder /opt/venv /opt/venv

# Copy application code
COPY . .

# Make entrypoint executable
RUN chmod +x /app/docker-entrypoint.sh

# Set ownership
RUN chown -R nexusbank:nexusbank /app

# Switch to non-root user
USER nexusbank

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

EXPOSE 8000

# Run via entrypoint (handles migrations + seed + start)
ENTRYPOINT ["sh", "/app/docker-entrypoint.sh"]