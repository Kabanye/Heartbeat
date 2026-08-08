"""
Service model for monitored Aiven databases and other services.
Stores connection details with encrypted credentials.
"""
from django.db import models
from django.contrib.auth import get_user_model
from core.models import BaseModel
from core.encryption import encryption

User = get_user_model()


class ServiceProvider(models.TextChoices):
    """Supported cloud providers."""
    AIVEN = 'AIVEN', 'Aiven'
    AWS = 'AWS', 'AWS'
    GCP = 'GCP', 'Google Cloud'
    AZURE = 'AZURE', 'Azure'
    SELF_HOSTED = 'SELF_HOSTED', 'Self-Hosted'
    OTHER = 'OTHER', 'Other'


class ServiceType(models.TextChoices):
    """Types of services that can be monitored."""
    POSTGRESQL = 'POSTGRESQL', 'PostgreSQL'
    MYSQL = 'MYSQL', 'MySQL'
    REDIS = 'REDIS', 'Redis'
    REST_API = 'REST_API', 'REST API'
    WEBSITE = 'WEBSITE', 'Website'


class ServiceStatus(models.TextChoices):
    """Current status of a monitored service."""
    HEALTHY = 'HEALTHY', 'Healthy'
    UNHEALTHY = 'UNHEALTHY', 'Unhealthy'
    UNKNOWN = 'UNKNOWN', 'Unknown'
    DISABLED = 'DISABLED', 'Disabled'


class Service(BaseModel):
    """
    Represents a monitored service.
    
    Stores all information needed to connect and monitor a service,
    with sensitive credentials encrypted at rest.
    """
    
    # Ownership
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='services'
    )
    
    # Identification
    name = models.CharField(
        max_length=255,
        help_text='Display name for this service (e.g., "MyFinder Database")'
    )
    provider = models.CharField(
        max_length=20,
        choices=ServiceProvider.choices,
        default=ServiceProvider.AIVEN,
        help_text='Cloud provider hosting this service'
    )
    service_type = models.CharField(
        max_length=20,
        choices=ServiceType.choices,
        default=ServiceType.POSTGRESQL,
        help_text='Type of service to monitor'
    )
    
    # Connection details
    host = models.CharField(
        max_length=255,
        help_text='Hostname (e.g., myproject.aivencloud.com)'
    )
    port = models.IntegerField(
        help_text='Port number (e.g., 21699 for Aiven)'
    )
    database_name = models.CharField(
        max_length=255,
        blank=True,
        default='',
        help_text='Database name (for PostgreSQL/MySQL)'
    )
    
    # Encrypted credentials
    encrypted_username = models.TextField(
        blank=True,
        default='',
        help_text='Encrypted username for authentication'
    )
    encrypted_password = models.TextField(
        blank=True,
        default='',
        help_text='Encrypted password for authentication'
    )
    
    # SSL configuration
    ssl_mode = models.CharField(
        max_length=50,
        default='require',
        help_text='SSL mode (require, disable, etc.)'
    )
    
    # Monitoring configuration
    enabled = models.BooleanField(
        default=True,
        help_text='Enable/disable monitoring for this service'
    )
    check_interval = models.IntegerField(
        default=300,
        help_text='Health check interval in seconds (default: 5 minutes)'
    )
    
    # Current status tracking
    current_status = models.CharField(
        max_length=20,
        choices=ServiceStatus.choices,
        default=ServiceStatus.UNKNOWN
    )
    last_checked_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Timestamp of the last health check'
    )
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Service'
        verbose_name_plural = 'Services'
    
    def __str__(self):
        return f"{self.name} ({self.get_service_type_display()})"
    
    def set_credentials(self, username: str, password: str):
        """
        Encrypt and store credentials.
        
        Args:
            username: Plaintext username
            password: Plaintext password
        """
        self.encrypted_username = encryption.encrypt(username)
        self.encrypted_password = encryption.encrypt(password)
    
    def get_credentials(self):
        """
        Decrypt and return credentials.
        
        Returns:
            Tuple of (username, password)
        """
        username = encryption.decrypt(self.encrypted_username)
        password = encryption.decrypt(self.encrypted_password)
        return username, password
    
    def get_connection_string(self):
        """
        Generate a connection string for this service.
        
        Returns:
            Connection string appropriate for the service type
        """
        username, password = self.get_credentials()
        
        if self.service_type == ServiceType.POSTGRESQL:
            return (
                f"postgresql://{username}:{password}@"
                f"{self.host}:{self.port}/{self.database_name}"
            )
        elif self.service_type == ServiceType.REDIS:
            return f"redis://:{password}@{self.host}:{self.port}/0"
        elif self.service_type == ServiceType.MYSQL:
            return (
                f"mysql://{username}:{password}@"
                f"{self.host}:{self.port}/{self.database_name}"
            )
        
        return ""
    
    def get_masked_connection_info(self):
        """
        Return connection info with password masked for display.
        
        Returns:
            Dict with masked connection details
        """
        return {
            'host': self.host,
            'port': self.port,
            'database_name': self.database_name,
            'username': encryption.decrypt(self.encrypted_username) if self.encrypted_username else '',
            'password': '••••••••',  # Always mask password
        }