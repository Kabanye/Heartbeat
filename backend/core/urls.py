"""
URL configuration for core app.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('health/', views.health_check, name='health-check'),
    path('db-info/', views.db_info, name='db-info'),
]