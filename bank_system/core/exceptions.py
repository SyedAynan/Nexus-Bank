"""
NEXA Centralized Exception Handling
====================================
Custom exception classes and global handlers for consistent API error responses.
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
