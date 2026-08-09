"""
API views for notifications.
"""
from rest_framework import viewsets, permissions, status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from django.core.cache import cache

from .models import Notification, NotificationPreference
from .serializers import NotificationSerializer, NotificationPreferenceSerializer


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing and managing notifications.
    Read-only with actions to mark as read.
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Notification.objects.none()  # Required by DRF
    
    def get_queryset(self):
        """Return notifications for the current user."""
        return Notification.objects.filter(
            user=self.request.user
        ).select_related('incident__service')
    
    @action(detail=False, methods=['get'])
    def unread(self, request):
        """Get only unread notifications."""
        notifications = self.get_queryset().filter(is_read=False)
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications (cached)."""
        cache_key = f'user_{request.user.id}_unread_count'
        count = cache.get(cache_key)
        
        if count is None:
            count = self.get_queryset().filter(is_read=False).count()
            cache.set(cache_key, count, timeout=60)
        
        return Response({'count': count})
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark a single notification as read."""
        notification = self.get_object()
        notification.mark_as_read()
        cache.delete(f'user_{request.user.id}_unread_count')
        return Response({'status': 'marked as read'})
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read."""
        self.get_queryset().filter(is_read=False).update(is_read=True)
        cache.delete(f'user_{request.user.id}_unread_count')
        return Response({'status': 'all marked as read'})


class NotificationPreferenceViewSet(mixins.RetrieveModelMixin,
                                     mixins.UpdateModelMixin,
                                     mixins.ListModelMixin,
                                     viewsets.GenericViewSet):
    """
    ViewSet for managing notification preferences.
    Each user has exactly one preference record.
    
    Supports: GET (retrieve/list), PUT (update), PATCH (partial_update)
    """
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = NotificationPreference.objects.all()
    
    def get_object(self):
        """Get or create preferences for current user."""
        pref, created = NotificationPreference.objects.get_or_create(
            user=self.request.user
        )
        return pref
    
    def get_queryset(self):
        """Return preferences for the current user only."""
        if getattr(self, 'swagger_fake_view', False):
            return NotificationPreference.objects.none()
        return NotificationPreference.objects.filter(user=self.request.user)
    
    def list(self, request, *args, **kwargs):
        """Get current user's preferences."""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def perform_update(self, serializer):
        """Clear cache when preferences are updated."""
        serializer.save()
        cache.delete(f'user_{self.request.user.id}_preferences')