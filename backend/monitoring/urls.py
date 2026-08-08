"""
URL configuration for monitoring app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HealthCheckViewSet, IncidentViewSet

router = DefaultRouter()
router.register(r'health-checks', HealthCheckViewSet, basename='healthcheck')
router.register(r'incidents', IncidentViewSet, basename='incident')

urlpatterns = [
    path('', include(router.urls)),
]