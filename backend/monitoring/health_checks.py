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
    try:
        import mysql.connector
    except ImportError:
        return {
            'status': 'UNHEALTHY',
            'response_time': 0,
            'error_message': 'MySQL connector not installed. Run: pip install mysql-connector-python'
        }
    
    username, password = service.get_credentials()
    start_time = time.time()
    
    try:
        conn = mysql.connector.connect(
            host=service.host,
            port=service.port,
            database=service.database_name or '',
            user=username,
            password=password,
            ssl_disabled=(service.ssl_mode != 'require'),
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