import logging
import os
from contextlib import asynccontextmanager
from typing import Any

import orjson
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import HTMLResponse, ORJSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from bank_system.api.routes import admin as admin_routes
from bank_system.api.routes import analytics as analytics_routes

# Route imports
from bank_system.api.routes import auth as auth_routes
from bank_system.api.routes import banking as banking_routes
from bank_system.api.routes import dsa_admin as dsa_admin_routes
from bank_system.api.routes import intelligence as intelligence_routes
from bank_system.api.routes import services as services_routes

# Core imports
from bank_system.core.config import get_settings
from bank_system.core.db import Base, engine
from bank_system.core.exceptions import register_exception_handlers
from bank_system.core.realtime import ws_manager
from bank_system.core.redis_client import get_redis
from bank_system.core.security import decode_token
from bank_system.core.startup_checks import validate_environment

# Middleware imports
from bank_system.middleware.rate_limiter import RateLimiterMiddleware
from bank_system.middleware.request_logger import RequestLoggerMiddleware
from bank_system.middleware.security_headers import SecurityHeadersMiddleware
from bank_system.simulation.engine import simulation_loop

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
)


settings = get_settings()

# ✅ Docker-safe absolute paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATES_DIR = os.path.join(BASE_DIR, "frontend", "templates")
STATIC_DIR = os.path.join(BASE_DIR, "frontend", "static")


def orjson_dumps(v: Any, *, default) -> str:
    return orjson.dumps(v, default=default).decode()


templates = Jinja2Templates(directory=TEMPLATES_DIR)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Validate environment before anything else — fail fast on bad config
    validate_environment()

    # Import all models so they register with Base.metadata
    import bank_system.models.db_models  # noqa: F401

    logging.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    logging.info("Database tables created successfully.")

    get_redis()

    try:
        from bank_system.seed import seed_if_empty

        seed_if_empty()
        logging.info("Database seeded successfully.")
    except Exception as e:
        logging.error(f"Seed failed (non-fatal): {e}")

    import asyncio

    task = asyncio.create_task(simulation_loop())

    try:
        yield
    finally:
        task.cancel()


OPENAPI_TAGS = [
    {"name": "system", "description": "Health checks and system status"},
    {
        "name": "auth",
        "description": "Authentication — login, register, token refresh, logout",
    },
    {
        "name": "banking",
        "description": "Core banking — accounts, deposits, withdrawals, transfers",
    },
    {"name": "analytics", "description": "Dashboard KPIs, charts, and reporting data"},
    {
        "name": "admin",
        "description": "Admin console — user management, audit logs, system stats",
    },
    {
        "name": "intelligence",
        "description": "AI engines — risk analysis, AML, forecasting, portfolio intelligence",
    },
    {
        "name": "dsa",
        "description": "DSA Showcase — data structure visualizations and benchmarks",
    },
    {
        "name": "services",
        "description": "Integrated services — OAuth, WebAuthn, Email, BillPay, FX, Feature Flags, Export",
    },
]

app = FastAPI(
    title=settings.app_name,
    description=(
        "# NEXA — Beyond Fintech\n\n"
        "Enterprise-grade digital banking platform built from scratch with **9 core data structures**, "
        "**AI-powered fraud detection**, real-time WebSocket streaming, and a React + FastAPI architecture.\n\n"
        "## Key Capabilities\n"
        "- 🏦 Core Banking (accounts, transfers, loans)\n"
        "- 🔐 JWT + RBAC authentication with 5 roles\n"
        "- 🤖 AI engines: fraud, AML, loan scoring, forecasting\n"
        "- 📊 13-chart analytics engine\n"
        "- 💱 Multi-currency with 20+ FX pairs\n"
        "- 📨 Bill Pay, Feature Flags, Export (CSV/PDF)\n"
        "- 🔌 WebSocket real-time dashboard updates\n"
    ),
    version="3.0.0",
    default_response_class=ORJSONResponse,
    lifespan=lifespan,
    openapi_tags=OPENAPI_TAGS,
    contact={"name": "NEXA Engineering", "email": "engineering@nexa.dev"},
    license_info={"name": "Proprietary", "identifier": "LicenseRef-NEXA"},
    docs_url="/docs",
    redoc_url="/redoc",
)

# Register centralized exception handlers
register_exception_handlers(app)

# ── Security Middleware Stack (order matters: last added = first executed) ──

# CORS — restrict to known origins (never use '*' in production)
ALLOWED_ORIGINS = [
    "http://localhost:3000",  # React dev server
    "http://localhost:5173",  # Vite dev server
    "http://localhost:8000",  # FastAPI self
    "http://127.0.0.1:8000",
]

# Add production frontend URL from env var (e.g. Vercel deployment)
_frontend_url = os.environ.get("FRONTEND_URL", "").strip()
if _frontend_url:
    ALLOWED_ORIGINS.append(_frontend_url)
    # Also allow www subdomain variant
    if _frontend_url.startswith("https://") and not _frontend_url.startswith(
        "https://www."
    ):
        ALLOWED_ORIGINS.append(_frontend_url.replace("https://", "https://www."))

if settings.environment == "development":
    ALLOWED_ORIGINS.extend(
        [
            "http://localhost:4173",  # Vite preview
            "http://localhost:3001",  # Alt dev server
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000",
        ]
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
)

# Security headers (HSTS, CSP, X-Frame-Options, etc.)
app.add_middleware(SecurityHeadersMiddleware)

# Rate limiting (Redis-backed sliding window)
app.add_middleware(RateLimiterMiddleware)

# GZip compression for responses > 500 bytes
app.add_middleware(GZipMiddleware, minimum_size=500)

# Structured request logging
app.add_middleware(RequestLoggerMiddleware)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get(
    "/api/health",
    tags=["system"],
    summary="Health Check",
    description="Returns service health and environment info.",
)
@app.get("/health", tags=["system"], include_in_schema=False)
def healthcheck() -> dict[str, str]:
    return {
        "status": "healthy",
        "environment": settings.environment,
        "version": "3.0.0",
    }


@app.websocket("/ws/dashboard")
async def websocket_dashboard(websocket: WebSocket):
    # Authenticate via token query parameter
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001, reason="Missing authentication token")
        return
    try:
        decode_token(token)
    except (ValueError, Exception):
        await websocket.close(code=4001, reason="Invalid authentication token")
        return

    await ws_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)


@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})


@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard_page(request: Request):
    return templates.TemplateResponse("dashboard.html", {"request": request})


@app.get("/transactions", response_class=HTMLResponse)
async def transactions_page(request: Request):
    return templates.TemplateResponse("transactions.html", {"request": request})


@app.get("/analytics", response_class=HTMLResponse)
async def analytics_page(request: Request):
    return templates.TemplateResponse("analytics.html", {"request": request})


@app.get("/intelligence", response_class=HTMLResponse)
async def intelligence_page(request: Request):
    return templates.TemplateResponse("intelligence.html", {"request": request})


@app.get("/ai/fraud", response_class=HTMLResponse)
async def ai_fraud_page(request: Request):
    return templates.TemplateResponse("ai_fraud.html", {"request": request})


@app.get("/ai/forecasting", response_class=HTMLResponse)
async def ai_forecasting_page(request: Request):
    return templates.TemplateResponse("ai_forecasting.html", {"request": request})


@app.get("/ai/health", response_class=HTMLResponse)
async def ai_health_page(request: Request):
    return templates.TemplateResponse("ai_health.html", {"request": request})


@app.get("/ai/portfolio-intel", response_class=HTMLResponse)
async def ai_portfolio_page(request: Request):
    return templates.TemplateResponse("ai_portfolio.html", {"request": request})


@app.get("/loans", response_class=HTMLResponse)
async def loans_page(request: Request):
    return templates.TemplateResponse("loans.html", {"request": request})


@app.get("/portfolio", response_class=HTMLResponse)
async def portfolio_page(request: Request):
    return templates.TemplateResponse("portfolio.html", {"request": request})


@app.get("/aml", response_class=HTMLResponse)
async def aml_page(request: Request):
    return templates.TemplateResponse("aml.html", {"request": request})


@app.get("/security-logs", response_class=HTMLResponse)
async def security_logs_page(request: Request):
    return templates.TemplateResponse("security_logs.html", {"request": request})


@app.get("/admin", response_class=HTMLResponse)
async def admin_page(request: Request):
    return templates.TemplateResponse("admin.html", {"request": request})


@app.get("/settings", response_class=HTMLResponse)
async def settings_page(request: Request):
    return templates.TemplateResponse("settings.html", {"request": request})


# ── Register API Routers ──
app.include_router(auth_routes.router)
app.include_router(banking_routes.router)
app.include_router(analytics_routes.router)
app.include_router(admin_routes.router)
app.include_router(intelligence_routes.router)
app.include_router(dsa_admin_routes.router)  # Admin-only DSA visualization
app.include_router(
    services_routes.router
)  # OAuth, WebAuthn, Email, BillPay, FX, Flags, Export
