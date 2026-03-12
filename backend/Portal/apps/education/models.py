from django.db import models
from django.contrib.auth import get_user_model
from Portal.choices import ModerationStatus
from apps.categories.models import Category


User = get_user_model()


class EducationSection(models.Model):

    title = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='education_sections')
    created_at = models.DateTimeField(auto_now_add=True)

    status = models.CharField(max_length=20, choices=ModerationStatus.choices, default=ModerationStatus.DRAFT)

    category = models.ForeignKey(Category,
                                 on_delete=models.SET_NULL,
                                 null=True,
                                 blank=True,
                                 related_name='sections'
                                 )
    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title



class SectionMaterial(models.Model):
    MATERIAL_TYPES = [
        ("text", "Текст"),
        ("video", "Видео"),
        ("link", "Ссылка")
    ]

    section = models.ForeignKey(EducationSection, on_delete=models.CASCADE, related_name='materials')
    title = models.CharField(max_length=255)

    type = models.CharField(max_length=100, choices=MATERIAL_TYPES)

    content = models.TextField(blank=True)
    external_url = models.URLField(blank=True)

    order = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "created_at"]

    def __str__(self):
        return self.title



class Course(models.Model):

    section = models.ForeignKey(EducationSection, on_delete=models.CASCADE, related_name='courses')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='courses')
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=ModerationStatus.choices, default=ModerationStatus.DRAFT)
    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title



class Chapter(models.Model):
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='chapters'
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"{self.course.title} — {self.title}"


class Lesson(models.Model):
    LESSON_TYPES = [
        ('lecture', 'Лекция'),
        ('practice', 'Практика'),
        ('link', 'Ссылка'),
    ]

    chapter = models.ForeignKey(
        Chapter,
        on_delete=models.CASCADE,
        related_name='lessons'
    )
    title = models.CharField(max_length=255)
    type = models.CharField(max_length=100, choices=LESSON_TYPES)
    content = models.TextField(blank=True)
    external_url = models.URLField(blank=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"{self.chapter.title} — {self.title}"



