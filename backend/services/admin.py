"""
Admin configuration for services.
"""
from django.contrib import admin
from .models import Service


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = [
        'name',
        'owner',
        'service_type',
        'provider',
        'enabled',
        'current_status',
        'last_checked_at',
    ]
    list_filter = [
        'service_type',
        'provider',
        'enabled',
        'current_status',
    ]
    search_fields = [
        'name',
        'host',
        'owner__email',
    ]
    readonly_fields = [
        'current_status',
        'last_checked_at',
        'created_at',
        'updated_at',
    ]
    fieldsets = (
        ('Owner', {
            'fields': ('owner',),
        }),
        ('Service Information', {
            'fields': (
                'name',
                'provider',
                'service_type',
            ),
        }),
        ('Connection Details', {
            'fields': (
                'host',
                'port',
                'database_name',
                'ssl_mode',
            ),
        }),
        ('Credentials', {
            'fields': (
                'encrypted_username',
                'encrypted_password',
            ),
            'description': 'Credentials are stored encrypted. Use the API to set them properly.',
        }),
        ('Monitoring', {
            'fields': (
                'enabled',
                'check_interval',
                'current_status',
                'last_checked_at',
            ),
        }),
        ('Timestamps', {
            'fields': (
                'created_at',
                'updated_at',
            ),
        }),
    )