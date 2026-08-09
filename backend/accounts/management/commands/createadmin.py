"""
Management command to create superuser from environment variables.
"""
import os
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = 'Creates a superuser from ADMIN_USERNAME, ADMIN_EMAIL, and ADMIN_PASSWORD env vars'

    def handle(self, *args, **options):
        username = os.environ.get('ADMIN_USERNAME')
        email = os.environ.get('ADMIN_EMAIL')
        password = os.environ.get('ADMIN_PASSWORD')

        if not all([username, email, password]):
            self.stdout.write(self.style.WARNING(
                'ADMIN_USERNAME, ADMIN_EMAIL, or ADMIN_PASSWORD not set. Skipping admin creation.'
            ))
            return

        if User.objects.filter(username=username).exists():
            self.stdout.write(self.style.WARNING(
                f'Admin user "{username}" already exists. Skipping.'
            ))
            return

        User.objects.create_superuser(
            username=username,
            email=email,
            password=password
        )
        
        self.stdout.write(self.style.SUCCESS(
            f'Superuser "{username}" created successfully!'
        ))