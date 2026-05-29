from django.db import models
from django.contrib.auth import get_user_model

from apps.education.models import Course

User = get_user_model()




from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class CourseEnrollment(models.Model):
    STATUS_CHOICES = [
        ('active', 'Активен'),
        ('completed', 'Завершён'),
        ('dropped', 'Покинул'),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='enrollments'
    )
    course = models.ForeignKey(
        'education.Course',
        on_delete=models.CASCADE,
        related_name='enrollments'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active'
    )
    enrolled_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    progress_percent = models.FloatField(default=0.0)

    class Meta:
        unique_together = ('user', 'course')
        ordering = ['-enrolled_at']

    def __str__(self):
        return f"{self.user} → {self.course} ({self.status})"

    def recalculate_progress(self):
        total_lessons = LessonProgress.objects.filter(
            enrollment=self
        ).count()

        if total_lessons == 0:
            self.progress_percent = 0.0
            self.save()
            return

        done_lessons = LessonProgress.objects.filter(
            enrollment=self,
            is_completed=True,
        ).count()

        self.progress_percent = round(done_lessons / total_lessons * 100, 1)

        if self.progress_percent >= 100.0 and self.status == 'active':
            from django.utils import timezone
            self.status = 'completed'
            self.completed_at = timezone.now()
            CourseCertificate.objects.get_or_create(
                user=self.user,
                course=self.course,
                defaults={'enrollment': self},
            )

        self.save()

class ChapterProgress(models.Model):
    enrollment = models.ForeignKey(
        CourseEnrollment,
        on_delete=models.CASCADE,
        related_name='chapter_progresses'
    )
    chapter = models.ForeignKey(
        'education.Chapter',
        on_delete=models.CASCADE,
        related_name='progresses'
    )
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    best_score = models.FloatField(null=True, blank=True)

    class Meta:
        unique_together = ('enrollment', 'chapter')
        ordering = ['chapter__order']

    def __str__(self):
        status = '✓' if self.is_completed else '○'
        return f"{status} {self.enrollment.user} | {self.chapter.title}"

    def mark_complete(self):
        from django.utils import timezone
        if not self.is_completed:
            self.is_completed = True
            self.completed_at = timezone.now()
            self.save()



class LessonProgress(models.Model):
    enrollment = models.ForeignKey(
        CourseEnrollment,
        on_delete=models.CASCADE,
        related_name='lesson_progresses'
    )
    lesson = models.ForeignKey(
        'education.Lesson',
        on_delete=models.CASCADE,
        related_name='progresses'
    )
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    best_score = models.FloatField(null=True, blank=True)

    class Meta:
        unique_together = ('enrollment', 'lesson')
        ordering = ['lesson__order']

    def __str__(self):
        status = '✓' if self.is_completed else '○'
        return f"{status} {self.enrollment.user} | {self.lesson.title}"

    def mark_complete(self):
        from django.utils import timezone
        if self.is_completed:
            return

        self.is_completed = True
        self.completed_at = timezone.now()
        self.save()

        # Проверяем — все ли уроки главы пройдены
        chapter = self.lesson.chapter
        total = LessonProgress.objects.filter(
            enrollment=self.enrollment,
            lesson__chapter=chapter,
        ).count()
        done = LessonProgress.objects.filter(
            enrollment=self.enrollment,
            lesson__chapter=chapter,
            is_completed=True,
        ).count()

        # Если все уроки главы пройдены — закрываем главу
        if total > 0 and done == total:
            chapter_progress, _ = ChapterProgress.objects.get_or_create(
                enrollment=self.enrollment,
                chapter=chapter,
            )
            chapter_progress.mark_complete()

        # Пересчитываем общий прогресс курса
        self.enrollment.recalculate_progress()



class CourseCertificate(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='certificates'
    )
    course = models.ForeignKey(
        'education.Course',
        on_delete=models.CASCADE,
        related_name='certificates'
    )
    enrollment = models.OneToOneField(
        CourseEnrollment,
        on_delete=models.CASCADE,
        related_name='certificate'
    )
    issued_at = models.DateTimeField(auto_now_add=True)
    certificate_number = models.CharField(
        max_length=64,
        unique=True,
        blank=True,
    )

    class Meta:
        unique_together = ('user', 'course')
        ordering = ['-issued_at']

    def __str__(self):
        return f"Сертификат: {self.user} — {self.course}"

    def save(self, *args, **kwargs):
        if not self.certificate_number:
            import uuid
            self.certificate_number = f"CERT-{uuid.uuid4().hex[:12].upper()}"
        super().save(*args, **kwargs)






class CourseReview(models.Model):
    course = models.ForeignKey(
        'education.Course',
        on_delete=models.CASCADE,
        related_name='reviews'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='course_reviews'
    )
    rating = models.PositiveSmallIntegerField()
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('course', 'user')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user} → {self.course} ({self.rating}★)"
