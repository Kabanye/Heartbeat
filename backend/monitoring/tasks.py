"""
Celery tasks for executing health checks and analyzing results.
"""
from celery import shared_task
from django.utils import timezone

from services.models import Service
from monitoring.models import HealthCheck, Incident, HealthStatus, IncidentStatus
from monitoring.health_checks import check_service_health


@shared_task
def perform_health_check(service_id: int):
    """
    Execute a single health check for a specific service.
    
    This task:
    1. Runs the health check
    2. Records the result
    3. Analyzes for potential incidents
    4. Sends notifications if needed
    
    Args:
        service_id: ID of the service to check
    """
    try:
        service = Service.objects.get(id=service_id, enabled=True)
    except Service.DoesNotExist:
        return None
    
    # Execute the health check
    result = check_service_health(service)
    
    # Record the health check
    health_check = HealthCheck.objects.create(
        service=service,
        status=result['status'],
        response_time=result['response_time'],
        error_message=result['error_message'],
        checked_at=timezone.now()
    )
    
    # Update service status
    service.current_status = result['status']
    service.last_checked_at = health_check.checked_at
    service.save(update_fields=['current_status', 'last_checked_at'])
    
    # Analyze for incidents
    analyze_service_health(service, health_check)
    
    return {
        'service': service.name,
        'status': result['status'],
        'response_time': result['response_time']
    }


def analyze_service_health(service: Service, latest_check: HealthCheck):
    """
    Analyze recent health checks to detect or resolve incidents.
    
    An incident is created when FAILURE_THRESHOLD consecutive checks fail.
    An incident is resolved when a healthy check follows an open incident.
    Notifications are sent for both events.
    
    Args:
        service: The service being analyzed
        latest_check: The most recent health check
    """
    # Get recent checks for pattern analysis
    recent_checks = HealthCheck.objects.filter(
        service=service
    ).order_by('-checked_at')[:10]
    
    # Check if there's an open incident for this service
    open_incident = Incident.objects.filter(
        service=service,
        status=IncidentStatus.OPEN
    ).first()
    
    # Count consecutive failures from most recent backwards
    consecutive_failures = 0
    for check in recent_checks:
        if check.status == HealthStatus.UNHEALTHY:
            consecutive_failures += 1
        else:
            break
    
    # Incident detection threshold
    FAILURE_THRESHOLD = 3
    
    # Create incident if threshold reached and no open incident exists
    if consecutive_failures >= FAILURE_THRESHOLD and not open_incident:
        incident = Incident.objects.create(
            service=service,
            status=IncidentStatus.OPEN,
            reason=(
                f"{consecutive_failures} consecutive health check failures. "
                f"Latest error: {latest_check.error_message}"
            ),
            started_at=recent_checks[consecutive_failures - 1].checked_at
        )
        incident.triggering_checks.add(*recent_checks[:consecutive_failures])
        
        # Send incident alert notification
        from notifications.services import create_incident_alert
        create_incident_alert(incident)
        
    # Resolve incident if service is healthy and incident is open
    elif latest_check.status == HealthStatus.HEALTHY and open_incident:
        open_incident.resolve(resolved_at=latest_check.checked_at)
        
        # Send recovery notification
        from notifications.services import create_recovery_alert
        create_recovery_alert(open_incident)


@shared_task
def run_scheduled_checks():
    """
    Run health checks for all enabled services.
    
    This task is called by Celery Beat on a schedule (every 5 minutes).
    It creates individual tasks for each service to allow parallel execution.
    """
    services = Service.objects.filter(enabled=True)
    
    count = 0
    for service in services:
        perform_health_check.delay(service.id)
        count += 1
    
    return f"Scheduled health checks for {count} services"