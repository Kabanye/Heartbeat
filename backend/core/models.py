"""
Base models for the Heartbeat application.
Provides common fields used across all models.
"""
from django.db import models


class BaseModel(models.Model):
    """
    Abstract base model that provides common fields for all models.
    
    Every model in Heartbeat inherits from this to ensure consistent
    timestamp tracking across the application.
    """
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True
        ordering = ['-created_at']