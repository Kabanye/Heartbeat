"""
API views for managing monitored services.
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import Service
from .serializers import ServiceSerializer, ServiceCreateSerializer


class ServiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing monitored services.
    
    Provides CRUD operations plus:
    - Toggle monitoring on/off
    - Test connection to service
    - Get connection info (masked)
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Only return services owned by the current user."""
        return Service.objects.filter(owner=self.request.user)
    
    def get_serializer_class(self):
        """Use different serializers for create vs other actions."""
        if self.action in ['create', 'update', 'partial_update']:
            return ServiceCreateSerializer
        return ServiceSerializer
    
    def perform_create(self, serializer):
        """Set the owner when creating a service."""
        serializer.save(owner=self.request.user)
    
    @action(detail=True, methods=['post'])
    def toggle(self, request, pk=None):
        """Enable or disable monitoring for a service."""
        service = self.get_object()
        service.enabled = not service.enabled
        service.save()
        
        status_msg = 'enabled' if service.enabled else 'disabled'
        return Response({
            'status': f'Monitoring {status_msg}',
            'enabled': service.enabled
        })
    
    @action(detail=True, methods=['post'])
    def test_connection(self, request, pk=None):
        """Test the connection to the service."""
        service = self.get_object()
        
        # Import here to avoid circular imports
        from monitoring.health_checks import check_service_health
        
        result = check_service_health(service)
        return Response(result)
    
    @action(detail=True, methods=['get'])
    def connection_info(self, request, pk=None):
        """Get masked connection information."""
        service = self.get_object()
        return Response(service.get_masked_connection_info())