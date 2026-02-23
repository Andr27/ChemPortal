from datetime import timedelta
from django.utils import timezone
import uuid
from django.db import models
from django.contrib.auth.models import User
from Portal.choices import UserRole


class Profile(models.Model):



    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')

    role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.USER)

    def __str__(self):
        return f"{self.role}"




class EmailConfirmationToken(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='email_token')
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def __str__(self):
        return f"Email token for {self.user.email}"




class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        return timezone.now() >= self.created_at + timedelta(hours=1)


class PendingUser(models.Model):
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=100)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    password = models.CharField(max_length=100)
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        return timezone.now() > self.created_at + timedelta(hours=24)






