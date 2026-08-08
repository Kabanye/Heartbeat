"""
Models for health checks, incidents, and monitoring data.
"""
from django.db import models
from django.contrib.auth import get_user_model
from core.models import BaseModel
from services.models import Service

User = get_user_model()


class HealthStatus(models.TextChoices):
    """Status of a health check."""
    HEALTHY = 'HEALTHY', 'Healthy'
    UNHEALTHY = 'UNHEALTHY', 'Unhealthy'
    UNKNOWN = 'UNKNOWN', 'Unknown'


class IncidentStatus(models.TextChoices):
    """Status of an incident."""
    OPEN = 'OPEN', 'Open'
    RESOLVED = 'RESOLVED', 'Resolved'


class HealthCheck(BaseModel):
    """
    Records the result of each health check performed.
    
    Every time Heartbeat checks a service, a HealthCheck record
    is created with the result, response time, and any errors.
    """
    
    service = models.ForeignKey(
        Service,
        on_delete=models.CASCADE,
        related_name='health_checks'
    )
    status = models.CharField(
        max_length=20,
        choices=HealthStatus.choices,
        default=HealthStatus.UNKNOWN
    )
    response_time = models.FloatField(
        null=True,
        blank=True,
        help_text='Response time in milliseconds'
    )
    error_message = models.TextField(
        blank=True,
        default='',
        help_text='Error details if the check failed'
    )
    checked_at = models.DateTimeField(
        auto_now_add=True,
        help_text='When the check was performed'
    )
    
    class Meta:
        ordering = ['-checked_at']
        indexes = [
            models.Index(fields=['service', 'checked_at']),
            models.Index(fields=['status']),
            models.Index(fields=['checked_at']),
        ]
        verbose_name = 'Health Check'
        verbose_name_plural = 'Health Checks'
    
    def __str__(self):
        return f"{self.service.name} - {self.status} at {self.checked_at}"


class Incident(BaseModel):
    """
    Represents a service outage incident.
    
    An incident is created when a service fails multiple consecutive
    health checks (default: 3). It records when the incident started,
    when it was resolved, and the reason for the outage.
    """
    
    service = models.ForeignKey(
        Service,
        on_delete=models.CASCADE,
        related_name='incidents'
    )
    status = models.CharField(
        max_length=20,
        choices=IncidentStatus.choices,
        default=IncidentStatus.OPEN
    )
    reason = models.TextField(
        help_text='Reason for the incident (e.g., error message from checks)'
    )
    started_at = models.DateTimeField(
        help_text='When the incident started (first failed check)'
    )
    resolved_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='When the service recovered'
    )
    
    # Track which health checks triggered and resolved this incident
    triggering_checks = models.ManyToManyField(
        HealthCheck,
        related_name='triggered_incidents',
        blank=True
    )
    
    class Meta:
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=['service', 'status']),
            models.Index(fields=['started_at']),
        ]
        verbose_name = 'Incident'
        verbose_name_plural = 'Incidents'
    
    def resolve(self, resolved_at=None):
        """
        Mark the incident as resolved.
        
        Args:
            resolved_at: When the incident was resolved (defaults to now)
        """
        from django.utils import timezone
        self.status = IncidentStatus.RESOLVED
        self.resolved_at = resolved_at or timezone.now()
        self.save()
    
    def get_downtime_duration(self):
        """
        Calculate how long the service was down.
        
        Returns:
            timedelta object representing the downtime duration
        """
        from django.utils import timezone
        if self.resolved_at:
            return self.resolved_at - self.started_at
        return timezone.now() - self.started_at
    
    def __str__(self):
        return f"{self.service.name} - {self.status} ({self.started_at})"