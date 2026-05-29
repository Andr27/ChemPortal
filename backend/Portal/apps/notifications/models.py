from django.db import models
from django.contrib.auth import get_user_model






User = get_user_model()


class Notification(models.Model):
    TYPE_CHOICES = [
        ('moderation_approved', 'Контент одобрен'),
        ('moderation_rejected', 'Контент отклонён'),
        ('comment_reply', 'Ответ на комментарий'),
        ('new_lesson', 'Новый урок в курсе'),
        ('certificate', 'Сертификат получен'),
        ('new_follower', 'Новый подписчик'),
        ('course_review', 'Отзыв на курс'),
        ('expert_review_needed', 'Требуется экспертная оценка'),
    ]



    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    title = models.CharField(max_length=100)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    post_id = models.IntegerField(null=True, blank=True)
    course_id = models.IntegerField(null=True, blank=True)
    lesson_id = models.IntegerField(null=True, blank=True)
    comment_id = models.IntegerField(null=True, blank=True)


    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Уведомление'
        verbose_name_plural = 'Уведомления'



    def __str__(self):
        return f"{self.user.email} — {self.type}"



