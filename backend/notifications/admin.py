"""
Admin configuration for notifications.
"""
from django.contrib import admin
from .models import Notification, NotificationPreference


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'type', 'channel', 'is_read', 'created_at']
    list_filter = ['type', 'channel', 'is_read', 'created_at']
    search_fields = ['title', 'message', 'user__email']
    readonly_fields = ['user', 'incident', 'type', 'channel', 'title', 'message', 'created_at']


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ['user', 'email_enabled', 'in_app_enabled', 'incident_alerts', 'recovery_alerts']
    search_fields = ['user__email']