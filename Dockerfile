# ============================================================
# File: Dockerfile
#
# Purpose:
#     Production-ready multi-stage Docker image for the NEXA backend API.
#     Uses a two-stage build to minimize the final image size:
#     Stage 1 (builder): Installs build tools and compiles dependencies
#     Stage 2 (runtime): Only includes compiled dependencies + app code
#
# Developer Journey:
#     - v1: Single-stage Dockerfile — installed build tools AND ran the app
#       in the same image. Result: 1.2GB image (included gcc, make, etc.).
#     - v2: Multi-stage build — final image dropped to ~250MB by excluding
#       build tools. This also reduced the attack surface.
#     - v3: Added non-root user (nexusbank) for security. Running as root
#       inside a container means a container escape gives root on the host.
#     - v4: Added docker-entrypoint.sh for production — handles DB wait,
#       migrations, and seeding before starting the server.
#
# Issue Faced:
#     Build failed with "pg_config not found" — PostgreSQL client headers
#     (libpq-dev) are needed at BUILD time for psycopg2 compilation, but
#     only the runtime library (libpq5) is needed at RUNTIME. This is why
#     we install libpq-dev in builder and libpq5 in runtime.
# ============================================================

# Stage 1: Builder — install dependencies in an isolated virtual environment
# Using python:3.11-slim instead of full python:3.11 saves ~400MB
FROM python:3.11-slim AS builder

WORKDIR /build

# Prevent Python from writing .pyc files and buffer stdout/stderr
# This improves container logging (logs appear immediately, not buffered)
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install build dependencies — these are needed to compile C extensions
# (psycopg2, bcrypt) but are NOT needed at runtime
RUN apt-get update && \
    apt-get install -y --no-install-recommends build-essential libpq-dev && \
    rm -rf /var/lib/apt/lists/*

# Create a virtual environment — isolates our dependencies from system Python
# This entire /opt/venv directory gets copied to the runtime stage
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies first (before copying app code)
# Docker layer caching: this layer is only rebuilt when requirements.txt changes,
# not when application code changes. This speeds up builds significantly.
COPY bank_system/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt


# Stage 2: Runtime — minimal image with only what's needed to run the app
# No build tools, no dev headers — smaller image = faster deploys + less attack surface
FROM python:3.11-slim AS runtime

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
# Add the virtual environment to PATH so Python finds our installed packages
ENV PATH="/opt/venv/bin:$PATH"
# Set PYTHONPATH so Python can find the bank_system package
ENV PYTHONPATH="/app"

# Install only runtime libraries (no build tools)
# libpq5: PostgreSQL client library needed by psycopg2 at runtime
# curl: used by Docker HEALTHCHECK to verify the API is responding
RUN apt-get update && \
    apt-get install -y --no-install-recommends libpq5 curl && \
    rm -rf /var/lib/apt/lists/* && \
    groupadd -r nexusbank && \
    useradd -r -g nexusbank -d /app -s /sbin/nologin nexusbank

# Copy the pre-built virtual environment from the builder stage
# This is the key benefit of multi-stage builds — we get compiled packages
# without the build tools that created them
COPY --from=builder /opt/venv /opt/venv

# Copy application code
COPY . .

# Make the production entrypoint script executable
# This script handles: DB wait → migrations → seed → uvicorn start
RUN chmod +x /app/docker-entrypoint.sh

# Set file ownership to non-root user
# Security: even if the app is compromised, the attacker can't modify system files
RUN chown -R nexusbank:nexusbank /app

# Switch to non-root user — critical for production security
# Running as root inside a container means a container escape gives root on the host
USER nexusbank

# Health check — Kubernetes and Docker use this to determine if the container is healthy
# Checks the enhanced /api/health endpoint which verifies DB + Redis connectivity
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

EXPOSE 8000

# Production entrypoint: waits for DB, runs migrations, seeds data, starts uvicorn
# This replaced the old CMD which just started uvicorn without any initialization
ENTRYPOINT ["sh", "/app/docker-entrypoint.sh"]