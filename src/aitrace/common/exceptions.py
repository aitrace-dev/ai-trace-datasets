"""Custom exceptions."""

from typing import Any


class AppException(Exception):
    """Base application exception."""

    def __init__(
        self, code: str, message: str, status_code: int = 400, details: Any = None
    ) -> None:
        """
        Initialize application exception.

        Args:
            code: Error code
            message: Error message
            status_code: HTTP status code
            details: Additional error details
        """
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(message)


class NotFoundException(AppException):
    """Resource not found exception."""

    def __init__(self, message: str = "Resource not found") -> None:
        """Initialize not found exception."""
        super().__init__("NOT_FOUND", message, 404)


class DuplicateException(AppException):
    """Duplicate resource exception."""

    def __init__(self, message: str = "Resource already exists") -> None:
        """Initialize duplicate exception."""
        super().__init__("DUPLICATE", message, 409)


class UnauthorizedException(AppException):
    """Unauthorized exception."""

    def __init__(self, message: str = "Not authenticated") -> None:
        """Initialize unauthorized exception."""
        super().__init__("UNAUTHORIZED", message, 401)


class ForbiddenException(AppException):
    """Forbidden exception."""

    def __init__(self, message: str = "Access forbidden") -> None:
        """Initialize forbidden exception."""
        super().__init__("FORBIDDEN", message, 403)


class ValidationException(AppException):
    """Validation exception."""

    def __init__(self, message: str, details: Any = None) -> None:
        """Initialize validation exception."""
        super().__init__("VALIDATION_ERROR", message, 400, details)
