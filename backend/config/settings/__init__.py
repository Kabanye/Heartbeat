# config/settings/__init__.py
from .base import *

# Default to local settings, override in production
try:
    from .local import *
except ImportError:
    pass