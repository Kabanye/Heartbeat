"""
Notification models for alerting users about incidents and recoveries.
"""
from django.db import models
from django.contrib.auth import get_user_model
from core.models import BaseModel
from monitoring.models import Incident

User = get_user_model()


class NotificationType(models.TextChoices):
    """Types of notifications."""
    INCIDENT_CREATED = 'INCIDENT_CREATED', 'Incident Created'
    INCIDENT_RESOLVED = 'INCIDENT_RESOLVED', 'Incident Resolved'
    SERVICE_DISABLED = 'SERVICE_DISABLED', 'Service Disabled'
    SYSTEM = 'SYSTEM', 'System Notification'


class NotificationChannel(models.TextChoices):
    """Delivery channels for notifications."""
    IN_APP = 'IN_APP', 'In-App'
    EMAIL = 'EMAIL', 'Email'
    SMS = 'SMS', 'SMS'  # Future
    WHATSAPP = 'WHATSAPP', 'WhatsApp'  # Future


class Notification(BaseModel):
    """
    Stores notifications sent to users.
    
    Notifications are created when incidents occur or resolve,
    and can be delivered through multiple channels.
    """
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    incident = models.ForeignKey(
        Incident,
        on_delete=models.CASCADE,
        related_name='notifications',
        null=True,
        blank=True
    )
    type = models.CharField(
        max_length=50,
        choices=NotificationType.choices
    )
    channel = models.CharField(
        max_length=20,
        choices=NotificationChannel.choices,
        default=NotificationChannel.IN_APP
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['created_at']),
        ]
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
    
    def mark_as_read(self):
        """Mark notification as read."""
        self.is_read = True
        self.save(update_fields=['is_read'])
    
    def __str__(self):
        return f"{self.title} - {self.user.username}"


class NotificationPreference(BaseModel):
    """
    User preferences for notification delivery.
    
    Each user can configure which channels they want
    and what types of events trigger notifications.
    """
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='notification_preferences'
    )
    email_enabled = models.BooleanField(
        default=True,
        help_text='Receive email notifications'
    )
    in_app_enabled = models.BooleanField(
        default=True,
        help_text='Receive in-app notifications'
    )
    incident_alerts = models.BooleanField(
        default=True,
        help_text='Get notified when a service goes down'
    )
    recovery_alerts = models.BooleanField(
        default=True,
        help_text='Get notified when a service recovers'
    )
    
    class Meta:
        verbose_name = 'Notification Preference'
        verbose_name_plural = 'Notification Preferences'
    
    def __str__(self):
        return f"Preferences for {self.user.email}"