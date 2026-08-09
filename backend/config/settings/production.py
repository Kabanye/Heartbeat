"""
Production settings for Heartbeat on Render.
"""
import os
from .base import *

DEBUG = False
DJANGO_ENV = 'production'

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='*.onrender.com,localhost').split(',')

# Security
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Static files
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Disable browsable API in production
REST_FRAMEWORK.update({
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
})

# Redis handling for Render/Upstash
REDIS_URL = os.environ.get('REDIS_CACHE_URL', os.environ.get('CELERY_BROKER_URL', ''))
if REDIS_URL:
    CACHES['default']['LOCATION'] = REDIS_URL
    CACHES['default']['OPTIONS'] = {
        'CLIENT_CLASS': 'django_redis.client.DefaultClient',
    }
    if not CELERY_BROKER_URL or CELERY_BROKER_URL == 'redis://localhost:6379/0':
        CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', '')
    if not CELERY_RESULT_BACKEND or CELERY_RESULT_BACKEND == 'redis://localhost:6379/2':
        CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND', CELERY_BROKER_URL)

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'django': {
        'handlers': ['console'],
        'level': 'INFO',
        'propagate': False,
    },
    'django.request': {
        'handlers': ['console'],
        'level': 'ERROR',
        'propagate': False,
    },
}

# Production email backend
EMAIL_BACKEND = config('EMAIL_BACKEND', default='django.core.mail.backends.smtp.EmailBackend')