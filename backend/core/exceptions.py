"""
Custom exceptions for the Heartbeat application.
"""

class HeartbeatException(Exception):
    """Base exception for Heartbeat application."""
    pass


class EncryptionError(HeartbeatException):
    """Raised when encryption/decryption operations fail."""
    pass


class HealthCheckError(HeartbeatException):
    """Raised when a health check fails to execute."""
    pass


class ServiceConnectionError(HeartbeatException):
    """Raised when unable to connect to a monitored service."""
    pass


class IncidentCreationError(HeartbeatException):
    """Raised when incident creation fails."""
    pass


class NotificationError(HeartbeatException):
    """Raised when notification delivery fails."""
    pass


class InvalidServiceConfigurationError(HeartbeatException):
    """Raised when service configuration is invalid."""
    pass