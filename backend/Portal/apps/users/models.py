from datetime import timedelta
from django.utils import timezone
import uuid
from django.db import models
from django.contrib.auth.models import User
from Portal.choices import UserRole


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.USER)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    rating = models.IntegerField(default=0)


    bio = models.TextField(blank=True)
    affiliation = models.CharField(max_length=255, blank=True)
    scientific_interests = models.TextField(blank=True)
    vk_url = models.URLField(blank=True)
    telegram_url = models.URLField(blank=True)
    website_url = models.URLField(blank=True)



    def __str__(self):
        return f"{self.role}"

    def get_level(self):
        if self.rating <= 50:
            return "Новичок"
        elif self.rating <= 200:
            return "Участник"
        elif self.rating <= 500:
            return "Автор"
        return "Эксперт"




class CreatorApplication(models.Model):
    STATUS_CHOICES = [
        ('pending', 'На рассмотрении'),
        ('approved', 'Одобрено'),
        ('rejected', 'Отклонено'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='creator_application')
    bio = models.TextField()
    affiliation = models.CharField(max_length=255, blank=True)
    scientific_interests = models.TextField()
    vk_url = models.URLField(blank=True)
    telegram_url = models.URLField(blank=True)
    website_url = models.URLField(blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reject_comment = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(
        User,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='reviewed_applications'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Заявка на Creator'
        verbose_name_plural = 'Заявки на Creator'

    def __str__(self):
        return f"Заявка {self.user.email} ({self.status})"


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






