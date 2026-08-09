import os

# Determine environment
ENVIRONMENT = os.environ.get('DJANGO_ENV', 'development')

if ENVIRONMENT == 'production':
    from .production import *
else:
    from .base import *
    try:
        from .local import *
    except ImportError:
        pass