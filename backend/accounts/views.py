"""
Authentication views for the Heartbeat API.
"""
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
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
        
        message = 'Login successful'
        
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key,
            'message': message
        }, status=status.HTTP_200_OK)
    
    return Response({
        'error': 'Invalid username or password'
    }, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def logout_view(request):
    """
    Logout and delete the authentication token.
    
    This view accepts both authenticated and unauthenticated requests.
    If the user is authenticated, their token is deleted.
    The client should always clear the token locally regardless of response.
    """
    if request.user.is_authenticated:
        try:
            request.user.auth_token.delete()
        except (AttributeError, Token.DoesNotExist):
            pass
        
        logout(request)
    
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


@api_view(['PATCH', 'PUT'])
@permission_classes([permissions.IsAuthenticated])
def update_profile_view(request):
    """
    Update user profile information.
    
    Allows updating username, email, first_name, and last_name.
    Validates uniqueness of username and email.
    """
    user = request.user
    data = request.data if request.data else {}
    
    changed = False
    
    # Update username if provided and different
    if 'username' in data:
        new_username = data['username'].strip() if data['username'] else ''
        if new_username and new_username != user.username:
            if User.objects.filter(username=new_username).exclude(id=user.id).exists():
                return Response({
                    'error': 'Username is already taken'
                }, status=status.HTTP_400_BAD_REQUEST)
            user.username = new_username
            changed = True
    
    # Update email if provided and different
    if 'email' in data:
        new_email = data['email'].strip() if data['email'] else ''
        if new_email and new_email != user.email:
            if User.objects.filter(email=new_email).exclude(id=user.id).exists():
                return Response({
                    'error': 'Email is already in use'
                }, status=status.HTTP_400_BAD_REQUEST)
            user.email = new_email
            changed = True
    
    # Update first_name if provided
    if 'first_name' in data:
        new_first = data['first_name'].strip() if data['first_name'] else ''
        if new_first != user.first_name:
            user.first_name = new_first
            changed = True
    
    # Update last_name if provided
    if 'last_name' in data:
        new_last = data['last_name'].strip() if data['last_name'] else ''
        if new_last != user.last_name:
            user.last_name = new_last
            changed = True
    
    if changed:
        try:
            user.save()
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    return Response({
        'user': UserSerializer(user).data,
        'message': 'Profile updated' if changed else 'No changes made'
    })

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password_view(request):
    """
    Change user password.
    
    Requires current password for verification.
    Returns a new auth token after password change.
    """
    user = request.user
    current_password = request.data.get('current_password', '')
    new_password = request.data.get('new_password', '')
    confirm_password = request.data.get('confirm_password', '')
    
    # Validate inputs
    if not current_password:
        return Response({
            'error': 'Current password is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if not new_password:
        return Response({
            'error': 'New password is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if new_password != confirm_password:
        return Response({
            'error': 'New passwords do not match'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate password strength
    try:
        validate_password(new_password, user)
    except ValidationError as e:
        return Response({
            'error': e.messages
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Verify current password
    if not user.check_password(current_password):
        return Response({
            'error': 'Current password is incorrect'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Set new password
    user.set_password(new_password)
    user.save()
    
    # Regenerate auth token (invalidates old sessions)
    Token.objects.filter(user=user).delete()
    token = Token.objects.create(user=user)
    
    return Response({
        'token': token.key,
        'message': 'Password changed successfully'
    })


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