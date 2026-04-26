"""
File: exceptions.py
Module: bank_system.core.exceptions

Purpose:
    Centralized exception hierarchy and global error handlers for consistent
    API error responses. All custom exceptions inherit from AppException,
    ensuring every error returns the same JSON structure.

Developer Journey:
    - v1: Used FastAPI's default HTTPException everywhere — inconsistent error
      formats made frontend error handling fragile. Some errors returned
      {"detail": "..."}, others returned plain strings.
    - v2: Created AppException base class with structured {success, error, error_code}
      response format. All routes now raise typed exceptions (NotFoundError,
      ForbiddenError, etc.) instead of raw HTTPException.
    - v3: Added register_exception_handlers() to install a global handler on the
      FastAPI app, ensuring even uncaught AppExceptions produce clean JSON.

Design Decision:
    Each exception class (NotFoundError, ForbiddenError, etc.) has a sensible default
    message but allows customization. This means routes can be concise:
        raise NotFoundError("Account")  → 404: "Account not found"
    Instead of repeating the full HTTPException boilerplate every time.
"""

from fastapi import FastAPI, Request
from fastapi.responses import ORJSONResponse


class AppException(Exception):
    """Base application exception for structured error responses."""

    def __init__(
        self,
        status_code: int,
        detail: str,
        error_code: str | None = None,
        headers: dict | None = None,
    ):
        self.status_code = status_code
        self.detail = detail
        self.error_code = error_code
        self.headers = headers


class NotFoundError(AppException):
    def __init__(self, resource: str = "Resource", error_code: str = "NOT_FOUND"):
        super().__init__(status_code=404, detail=f"{resource} not found", error_code=error_code)


class ForbiddenError(AppException):
    def __init__(self, detail: str = "Insufficient permissions", error_code: str = "FORBIDDEN"):
        super().__init__(status_code=403, detail=detail, error_code=error_code)


class ConflictError(AppException):
    def __init__(self, detail: str = "Resource already exists", error_code: str = "CONFLICT"):
        super().__init__(status_code=409, detail=detail, error_code=error_code)


class ValidationError(AppException):
    def __init__(self, detail: str = "Validation failed", error_code: str = "VALIDATION_ERROR"):
        super().__init__(status_code=422, detail=detail, error_code=error_code)


class RateLimitError(AppException):
    def __init__(self, detail: str = "Too many requests", error_code: str = "RATE_LIMITED"):
        super().__init__(status_code=429, detail=detail, error_code=error_code)


def register_exception_handlers(app: FastAPI) -> None:
    """Register global exception handlers on the FastAPI app."""

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        return ORJSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": exc.detail,
                "error_code": exc.error_code,
            },
            headers=exc.headers,
        )
