"""
Business logic for creating and sending notifications.
"""
from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from django.core.cache import cache

from monitoring.models import Incident, IncidentStatus
from .models import (
    Notification,
    NotificationType,
    NotificationChannel,
    NotificationPreference,
)


def create_incident_alert(incident: Incident):
    """
    Create notifications when an incident is opened.
    
    Args:
        incident: The Incident that was just created
    """
    service = incident.service
    user = service.owner
    
    # Check user preferences
    preferences = get_notification_preferences(user)
    
    if not preferences.incident_alerts:
        return
    
    title = f"🚨 {service.name} is DOWN"
    message = (
        f"Service: {service.name}\n"
        f"Type: {service.get_service_type_display()}\n"
        f"Provider: {service.get_provider_display()}\n"
        f"Started: {incident.started_at.strftime('%Y-%m-%d %H:%M UTC')}\n"
        f"Reason: {incident.reason}\n\n"
        f"3 consecutive health checks have failed."
    )
    
    # In-app notification
    if preferences.in_app_enabled:
        Notification.objects.create(
            user=user,
            incident=incident,
            type=NotificationType.INCIDENT_CREATED,
            channel=NotificationChannel.IN_APP,
            title=title,
            message=message,
        )
        # Clear notification count cache
        cache.delete(f'user_{user.id}_unread_count')
    
    # Email notification (async via Celery)
    if preferences.email_enabled:
        send_notification_email.delay(
            user.email,
            title,
            message,
            incident.id
        )


def create_recovery_alert(incident: Incident):
    """
    Create notifications when an incident is resolved.
    
    Args:
        incident: The Incident that was just resolved
    """
    service = incident.service
    user = service.owner
    
    # Check user preferences
    preferences = get_notification_preferences(user)
    
    if not preferences.recovery_alerts:
        return
    
    downtime = incident.get_downtime_duration()
    downtime_str = format_downtime(downtime)
    
    title = f"✅ {service.name} has RECOVERED"
    message = (
        f"Service: {service.name}\n"
        f"Type: {service.get_service_type_display()}\n"
        f"Downtime: {downtime_str}\n"
        f"Started: {incident.started_at.strftime('%Y-%m-%d %H:%M UTC')}\n"
        f"Resolved: {incident.resolved_at.strftime('%Y-%m-%d %H:%M UTC')}\n\n"
        f"The service is now healthy."
    )
    
    # In-app notification
    if preferences.in_app_enabled:
        Notification.objects.create(
            user=user,
            incident=incident,
            type=NotificationType.INCIDENT_RESOLVED,
            channel=NotificationChannel.IN_APP,
            title=title,
            message=message,
        )
        cache.delete(f'user_{user.id}_unread_count')
    
    # Email notification
    if preferences.email_enabled:
        send_notification_email.delay(
            user.email,
            title,
            message,
            incident.id
        )


def get_notification_preferences(user):
    """
    Get or create notification preferences for a user.
    Uses cache to avoid repeated database lookups.
    
    Args:
        user: User instance
        
    Returns:
        NotificationPreference instance
    """
    cache_key = f'user_{user.id}_preferences'
    preferences = cache.get(cache_key)
    
    if preferences is None:
        preferences, _ = NotificationPreference.objects.get_or_create(user=user)
        cache.set(cache_key, preferences, timeout=3600)  # Cache for 1 hour
    
    return preferences


def format_downtime(duration):
    """Format a timedelta into a readable string."""
    total_seconds = int(duration.total_seconds())
    
    days = total_seconds // 86400
    hours = (total_seconds % 86400) // 3600
    minutes = (total_seconds % 3600) // 60
    seconds = total_seconds % 60
    
    parts = []
    if days:
        parts.append(f"{days} day{'s' if days != 1 else ''}")
    if hours:
        parts.append(f"{hours} hour{'s' if hours != 1 else ''}")
    if minutes:
        parts.append(f"{minutes} minute{'s' if minutes != 1 else ''}")
    if seconds or not parts:
        parts.append(f"{seconds} second{'s' if seconds != 1 else ''}")
    
    return ", ".join(parts)


@shared_task
def send_notification_email(to_email: str, subject: str, message: str, incident_id: int):
    """
    Send email notification asynchronously via Celery.
    
    Args:
        to_email: Recipient email address
        subject: Email subject
        message: Plain text message
        incident_id: Related incident ID
    """
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[to_email],
            fail_silently=False,
        )
        return f"Email sent to {to_email}"
    except Exception as e:
        return f"Failed to send email: {str(e)}"