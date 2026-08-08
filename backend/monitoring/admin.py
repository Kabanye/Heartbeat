"""
Admin configuration for monitoring models.
"""
from django.contrib import admin
from .models import HealthCheck, Incident


@admin.register(HealthCheck)
class HealthCheckAdmin(admin.ModelAdmin):
    list_display = [
        'service',
        'status',
        'response_time',
        'checked_at',
    ]
    list_filter = ['status', 'checked_at']
    search_fields = ['service__name']
    readonly_fields = [
        'service',
        'status',
        'response_time',
        'error_message',
        'checked_at',
    ]


@admin.register(Incident)
class IncidentAdmin(admin.ModelAdmin):
    list_display = [
        'service',
        'status',
        'started_at',
        'resolved_at',
    ]
    list_filter = ['status', 'started_at']
    search_fields = ['service__name']
    readonly_fields = [
        'service',
        'status',
        'reason',
        'started_at',
        'resolved_at',
    ]