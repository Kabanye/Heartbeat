"""
Serializers for the Services API.
"""
from rest_framework import serializers
from .models import Service


class ServiceSerializer(serializers.ModelSerializer):
    """Serializer for viewing service details (password masked)."""
    
    owner_email = serializers.EmailField(source='owner.email', read_only=True)
    service_type_display = serializers.CharField(
        source='get_service_type_display',
        read_only=True
    )
    provider_display = serializers.CharField(
        source='get_provider_display',
        read_only=True
    )
    status_display = serializers.CharField(
        source='get_current_status_display',
        read_only=True
    )
    
    class Meta:
        model = Service
        fields = [
            'id',
            'name',
            'provider',
            'provider_display',
            'service_type',
            'service_type_display',
            'host',
            'port',
            'database_name',
            'ssl_mode',
            'enabled',
            'check_interval',
            'current_status',
            'status_display',
            'last_checked_at',
            'owner_email',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'current_status',
            'last_checked_at',
            'owner_email',
            'created_at',
            'updated_at',
        ]


class ServiceCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating/updating services.
    Includes write-only fields for credentials.
    """
    username = serializers.CharField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False, style={'input_type': 'password'})
    
    class Meta:
        model = Service
        fields = [
            'id',
            'name',
            'provider',
            'service_type',
            'host',
            'port',
            'database_name',
            'ssl_mode',
            'enabled',
            'check_interval',
            'username',
            'password',
        ]
    
    def create(self, validated_data):
        """Create service with encrypted credentials."""
        username = validated_data.pop('username', '')
        password = validated_data.pop('password', '')
        
        service = Service.objects.create(**validated_data)
        service.set_credentials(username, password)
        service.save()
        
        return service
    
    def update(self, instance, validated_data):
        """Update service, re-encrypting credentials if provided."""
        username = validated_data.pop('username', None)
        password = validated_data.pop('password', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if username is not None or password is not None:
            current_username, current_password = instance.get_credentials()
            instance.set_credentials(
                username if username is not None else current_username,
                password if password is not None else current_password
            )
        
        instance.save()
        return instance