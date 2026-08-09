"""
Health check functions for different service types.
Each function takes a Service instance and returns a result dict.
"""
import time
import psycopg2
import redis
import requests
from typing import Dict, Any

from services.models import Service, ServiceType


def check_postgresql_health(service: Service) -> Dict[str, Any]:
    """
    Check a PostgreSQL database by connecting and running SELECT 1.
    """
    username, password = service.get_credentials()
    start_time = time.time()
    
    try:
        conn = psycopg2.connect(
            host=service.host,
            port=service.port,
            dbname=service.database_name,
            user=username,
            password=password,
            sslmode=service.ssl_mode,
            connect_timeout=10
        )
        
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.close()
        conn.close()
        
        response_time = (time.time() - start_time) * 1000
        
        return {
            'status': 'HEALTHY',
            'response_time': round(response_time, 2),
            'error_message': ''
        }
        
    except Exception as e:
        response_time = (time.time() - start_time) * 1000
        
        return {
            'status': 'UNHEALTHY',
            'response_time': round(response_time, 2),
            'error_message': str(e)
        }


def check_mysql_health(service: Service) -> Dict[str, Any]:
    """
    Check a MySQL database by connecting and running SELECT 1.
    """
    username, password = service.get_credentials()
    start_time = time.time()
    
    try:
        import mysql.connector
        
        # Use a context manager-free approach with full cleanup
        conn = mysql.connector.connect(
            host=service.host,
            port=service.port,
            database=service.database_name or '',
            user=username,
            password=password,
            ssl_disabled=(service.ssl_mode != 'require'),
            connect_timeout=10,
            autocommit=True,
            consume_results=True  # Auto-consume results
        )
        
        try:
            cursor = conn.cursor(buffered=True)
            cursor.execute("SELECT 1")
            cursor.fetchall()  # Explicitly consume all results
        finally:
            try:
                cursor.close()
            except:
                pass
        
        conn.close()
        
        response_time = (time.time() - start_time) * 1000
        
        return {
            'status': 'HEALTHY',
            'response_time': round(response_time, 2),
            'error_message': ''
        }
        
    except ImportError:
        return {
            'status': 'UNHEALTHY',
            'response_time': 0,
            'error_message': 'MySQL connector not installed'
        }
    except Exception as e:
        response_time = (time.time() - start_time) * 1000
        
        # Try to close connection if it exists
        try:
            if 'conn' in locals() and conn:
                conn.close()
        except:
            pass
        
        return {
            'status': 'UNHEALTHY',
            'response_time': round(response_time, 2),
            'error_message': str(e)[:200]
        }


def check_redis_health(service: Service) -> Dict[str, Any]:
    """
    Check a Redis instance by pinging it.
    """
    username, password = service.get_credentials()
    start_time = time.time()
    
    try:
        r = redis.Redis(
            host=service.host,
            port=service.port,
            password=password,
            ssl=(service.ssl_mode == 'require'),
            socket_connect_timeout=10
        )
        
        r.ping()
        
        response_time = (time.time() - start_time) * 1000
        
        return {
            'status': 'HEALTHY',
            'response_time': round(response_time, 2),
            'error_message': ''
        }
        
    except Exception as e:
        response_time = (time.time() - start_time) * 1000
        
        return {
            'status': 'UNHEALTHY',
            'response_time': round(response_time, 2),
            'error_message': str(e)
        }


def check_rest_api_health(service: Service) -> Dict[str, Any]:
    """
    Check a REST API by making an HTTP request.
    """
    start_time = time.time()
    
    try:
        response = requests.get(
            f"http://{service.host}:{service.port}",
            timeout=10
        )
        
        response_time = (time.time() - start_time) * 1000
        is_healthy = 200 <= response.status_code < 300
        
        return {
            'status': 'HEALTHY' if is_healthy else 'UNHEALTHY',
            'response_time': round(response_time, 2),
            'error_message': '' if is_healthy else f'HTTP {response.status_code}'
        }
        
    except Exception as e:
        response_time = (time.time() - start_time) * 1000
        
        return {
            'status': 'UNHEALTHY',
            'response_time': round(response_time, 2),
            'error_message': str(e)
        }


def check_service_health(service: Service) -> Dict[str, Any]:
    """
    Main health check dispatcher.
    Routes to the appropriate checker based on service type.
    """
    checkers = {
        ServiceType.POSTGRESQL: check_postgresql_health,
        ServiceType.MYSQL: check_mysql_health,
        ServiceType.REDIS: check_redis_health,
        ServiceType.REST_API: check_rest_api_health,
        ServiceType.WEBSITE: check_rest_api_health,
    }
    
    checker = checkers.get(service.service_type)
    
    if not checker:
        return {
            'status': 'UNKNOWN',
            'response_time': 0,
            'error_message': f'No health checker for service type: {service.service_type}'
        }
    
    return checker(service)