from django.db import models
from django.contrib.auth.models import User



class Subscription(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subscriptions')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subscribers')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = (('user', 'author'),)

    def __str__(self):
        return f"{self.user.email} -> {self.author.email}"