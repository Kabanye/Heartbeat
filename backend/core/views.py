"""
Core views including health check endpoint for UptimeRobot.
"""
from django.http import JsonResponse
from django.db import connections
from django.core.cache import cache
from django.utils import timezone
from django_redis import get_redis_connection


def health_check(request):
    """
    Health check endpoint for UptimeRobot external monitoring.
    
    Checks:
    - Database connectivity
    - Redis connectivity
    - Cache functionality
    
    Returns 200 if healthy, 503 if unhealthy.
    """
    health_status = {
        'status': 'healthy',
        'timestamp': timezone.now().isoformat(),
        'application': 'Heartbeat',
        'version': '1.0.0',
        'components': {
            'database': 'unknown',
            'redis': 'unknown',
            'cache': 'unknown',
        }
    }
    
    overall_healthy = True
    
    # Check Database
    try:
        db_conn = connections['default']
        db_conn.cursor()
        db_conn.ensure_connection()
        health_status['components']['database'] = 'healthy'
    except Exception as e:
        health_status['components']['database'] = f'unhealthy: {str(e)}'
        overall_healthy = False
    
    # Check Redis
    try:
        redis_conn = get_redis_connection("default")
        redis_conn.ping()
        health_status['components']['redis'] = 'healthy'
    except Exception as e:
        health_status['components']['redis'] = f'unhealthy: {str(e)}'
        overall_healthy = False
    
    # Check Cache
    try:
        cache.set('health_check', 'ok', timeout=10)
        value = cache.get('health_check')
        if value == 'ok':
            health_status['components']['cache'] = 'healthy'
        else:
            health_status['components']['cache'] = 'unhealthy: unexpected value'
            overall_healthy = False
    except Exception as e:
        health_status['components']['cache'] = f'unhealthy: {str(e)}'
        overall_healthy = False
    
    health_status['status'] = 'healthy' if overall_healthy else 'unhealthy'
    status_code = 200 if overall_healthy else 503
    
    return JsonResponse(health_status, status=status_code)