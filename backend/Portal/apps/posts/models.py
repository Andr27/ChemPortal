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
    body = models.TextField(blank=True)
    external_url = models.URLField(blank=True)


    author = models.ForeignKey(User, on_delete=models.CASCADE)
    #tags = models.ManyToManyField(Tag)
    created_at = models.DateTimeField(auto_now_add=True)


    status = models.CharField(choices=[
        ('draft', "Черновик"),
        ("moderation", "На модерации"),
        ("published", "Опубликовано"),
        ("rejected", "Отклонено")
    ], default="draft")

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['created_at']),
        ]
    def __str__(self):
        return self.title



class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    parent = models.ForeignKey('self', null=True, blank=True, related_name='children', on_delete=models.CASCADE)
    text = models.TextField()
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


    def __str__(self):
        return f"Comment {self.id}"




class Like(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='likes')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'post')























