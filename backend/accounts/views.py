"""
Authentication views for the Heartbeat API.
"""
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.views.decorators.csrf import ensure_csrf_cookie
from .serializers import UserSerializer, RegisterSerializer


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_view(request):
    """
    Register a new user account.
    
    Creates a new user with hashed password and returns an auth token
    for immediate login after registration.
    """
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key,
            'message': 'Account created successfully'
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    """
    Login and get authentication token.
    
    Accepts username and password, returns user data and token
    for authenticating subsequent API requests.
    """
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')
    
    if not username or not password:
        return Response({
            'error': 'Please provide both username and password'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Authenticate user
    user = authenticate(username=username, password=password)
    
    if user is not None:
        if not user.is_active:
            return Response({
                'error': 'This account has been disabled'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Login for session
        login(request, user)
        
        # Get or create token for API authentication
        token, created = Token.objects.get_or_create(user=user)
        
        # If token was regenerated, mention it (optional)
        message = 'Login successful'
        if not created:
            # Token already existed - could be a re-login
            pass
        
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key,
            'message': message
        }, status=status.HTTP_200_OK)
    
    return Response({
        'error': 'Invalid username or password'
    }, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])  # Allow even with invalid/expired token
def logout_view(request):
    """
    Logout and delete the authentication token.
    
    This view accepts both authenticated and unauthenticated requests.
    If the user is authenticated, their token is deleted.
    The client should always clear the token locally regardless of response.
    """
    # If user is authenticated, delete their token
    if request.user.is_authenticated:
        try:
            request.user.auth_token.delete()
        except (AttributeError, Token.DoesNotExist):
            pass
        
        # Django session logout
        logout(request)
    
    # Always return success - client handles local cleanup
    return Response({
        'message': 'Logged out successfully'
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_profile_view(request):
    """
    Get current user's profile information.
    
    Requires valid authentication token.
    """
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
@ensure_csrf_cookie
def csrf_token_view(request):
    """
    Get CSRF token for the session.
    
    This is useful if you ever need to use session-based authentication
    alongside token authentication.
    """
    return Response({'detail': 'CSRF cookie set'})