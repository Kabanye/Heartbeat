"""
URL configuration for accounts app.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.user_profile_view, name='profile'),
    path('profile/update/', views.update_profile_view, name='profile-update'),
    path('change-password/', views.change_password_view, name='change-password'),
    path('csrf/', views.csrf_token_view, name='csrf'),
]