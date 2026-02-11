from django.contrib.auth.models import User
from django.db import models



class Post(models.Model):
    POST_TYPE_CHOICES = [
        ("article", "Статья"),
        ("news", "Новость"),
        ('video', "Видео"),
        ("link", "Ссылка")
    ]

    type = models.CharField(max_length=20, choices=POST_TYPE_CHOICES)
    title = models.CharField(max_length=255)
    text = models.TextField(blank=True)
    video_url = models.URLField(blank=True)
    link_url = models.URLField(blank=True)

    author = models.ForeignKey(User, on_delete=models.CASCADE)
    #tags = models.ManyToManyField(Tag)
    created_at = models.DateTimeField(auto_now_add=True)


    status = models.CharField(choices=[
        ('draft', "Черновик"),
        ("moderation", "На модерации"),
        ("published", "Опубликовано")
    ])

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['created_at']),
        ]
    def __str__(self):
        return self.title
