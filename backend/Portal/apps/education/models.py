from django.db import models
from django.contrib.auth import get_user_model
from Portal.choices import ModerationStatus


User = get_user_model()


class EducationSection(models.Model):

    title = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='education_sections')
    created_at = models.DateTimeField(auto_now_add=True)

    status = models.CharField(max_length=20, choices=ModerationStatus.choices, default=ModerationStatus.DRAFT)
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
    STATUS_CHOICES = [
        ("draft", "Черновик"),
        ("published", "Опубликовано"),
        ("moderation", "На модерации"),
        ("rejected", "Отклонено"),
    ]
    section = models.ForeignKey(EducationSection, on_delete=models.CASCADE, related_name='courses')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='courses')
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class CourseModule(models.Model):
    MODULE_TYPES = [
        ("lecture", "Лекция"),
        ("practice", "Практика"),
        ("link", "Ссылка"),
    ]
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='modules')
    title = models.CharField(max_length=255)
    type = models.CharField(max_length=100, choices=MODULE_TYPES)
    content = models.TextField(blank=True)
    external_url = models.URLField(blank=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "created_at"]

    def __str__(self):
        return f"{self.course.title} - {self.title}"



