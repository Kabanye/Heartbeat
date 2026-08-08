"""
Main URL configuration for Heartbeat project.
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('services.urls')),
    path('api/auth/', include('accounts.urls')),
    
    path('api/', include('monitoring.urls')),
    path('api/', include('notifications.urls')),
    path('', include('core.urls')),
]