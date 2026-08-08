"""
Serializers for monitoring data.
"""
from rest_framework import serializers
from .models import HealthCheck, Incident


class HealthCheckSerializer(serializers.ModelSerializer):
    """Serializer for health check records."""
    
    service_name = serializers.CharField(source='service.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = HealthCheck
        fields = [
            'id',
            'service',
            'service_name',
            'status',
            'status_display',
            'response_time',
            'error_message',
            'checked_at',
        ]
        read_only_fields = fields


class IncidentSerializer(serializers.ModelSerializer):
    """Serializer for incident records."""
    
    service_name = serializers.CharField(source='service.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    downtime_duration = serializers.SerializerMethodField()
    
    class Meta:
        model = Incident
        fields = [
            'id',
            'service',
            'service_name',
            'status',
            'status_display',
            'reason',
            'started_at',
            'resolved_at',
            'downtime_duration',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'service_name',
            'status_display',
            'downtime_duration',
            'created_at',
        ]
    
    def get_downtime_duration(self, obj):
        """Format downtime duration as a string."""
        from core.utils import format_duration
        return format_duration(obj.get_downtime_duration())