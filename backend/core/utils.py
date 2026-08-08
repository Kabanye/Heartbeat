"""
Shared utility functions for the Heartbeat application.
"""
import logging
from django.utils import timezone

logger = logging.getLogger(__name__)


def get_client_ip(request):
    """
    Extract the client IP address from the request.
    
    Args:
        request: Django HttpRequest object
        
    Returns:
        String IP address
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def format_duration(duration):
    """
    Format a timedelta object into a human-readable string.
    
    Args:
        duration: timedelta object
        
    Returns:
        String like "5 minutes, 30 seconds"
    """
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


def chunk_queryset(queryset, chunk_size=100):
    """
    Efficiently iterate over large querysets in chunks.
    
    Args:
        queryset: Django QuerySet
        chunk_size: Number of records per chunk
        
    Yields:
        Chunk of records from the queryset
    """
    offset = 0
    while True:
        chunk = list(queryset[offset:offset + chunk_size])
        if not chunk:
            break
        yield chunk
        offset += chunk_size