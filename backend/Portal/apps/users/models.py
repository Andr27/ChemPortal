import uuid
from django.db import models
from django.contrib.auth.models import User



class Profile(models.Model):
    ROLE_CHOICES = [
        ('guest', 'Гость'),
        ('user', 'Пользователь'),
        ('creator', 'Создатель контента'),
        ('moderator', 'Модератор'),
        ('admin', 'Админ'),
    ]


    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')

    def __str__(self):
        return f"{self.role}"




class EmailConfirmationToken(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='email_token')
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def __str__(self):
        return f"Email token for {self.user.email}"