"""
Serializers for notifications API.
"""
from rest_framework import serializers
from .models import Notification, NotificationPreference


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for viewing notifications."""
    
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id',
            'type',
            'type_display',
            'channel',
            'title',
            'message',
            'is_read',
            'time_ago',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'type',
            'type_display',
            'channel',
            'title',
            'message',
            'time_ago',
            'created_at',
        ]
    
    def get_time_ago(self, obj):
        """Return human-readable time since notification was created."""
        from django.utils import timezone
        from core.utils import format_duration
        
        delta = timezone.now() - obj.created_at
        return format_duration(delta) + " ago"


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """Serializer for notification preferences."""
    
    class Meta:
        model = NotificationPreference
        fields = [
            'email_enabled',
            'in_app_enabled',
            'incident_alerts',
            'recovery_alerts',
        ]