"""
API views for monitoring data.
"""
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import HealthCheck, Incident
from .serializers import HealthCheckSerializer, IncidentSerializer
from .health_checks import check_service_health
from services.models import Service


class HealthCheckViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing health check history."""
    
    serializer_class = HealthCheckSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return health checks for services owned by the user."""
        return HealthCheck.objects.filter(
            service__owner=self.request.user
        ).select_related('service')
    
    @action(detail=False, methods=['get'])
    def latest(self, request):
        """Get the latest health check for each service."""
        from django.db.models import Max
        
        services = Service.objects.filter(owner=request.user)
        latest_checks = []
        
        for service in services:
            latest = HealthCheck.objects.filter(
                service=service
            ).order_by('-checked_at').first()
            
            if latest:
                latest_checks.append(latest)
        
        serializer = self.get_serializer(latest_checks, many=True)
        return Response(serializer.data)


class IncidentViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing incident history."""
    
    serializer_class = IncidentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return incidents for services owned by the user."""
        return Incident.objects.filter(
            service__owner=self.request.user
        ).select_related('service')
    
    @action(detail=False, methods=['get'])
    def open(self, request):
        """Get only open (unresolved) incidents."""
        incidents = self.get_queryset().filter(status='OPEN')
        serializer = self.get_serializer(incidents, many=True)
        return Response(serializer.data)