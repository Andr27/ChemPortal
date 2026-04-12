from django.db import models
from pgvector.django import VectorField

class PostEmbedding(models.Model):
    post = models.OneToOneField(
        'posts.Post',
        on_delete=models.CASCADE,
        related_name='embedding'
    )
    vector = VectorField(
        dimensions=384
    )
    updated_at = models.DateTimeField(auto_now=True)


    class Meta:
        verbose_name = "Эмбеддинг постов"


class CourseEmbedding(models.Model):
    course = models.OneToOneField(
        'education.Course',
        on_delete=models.CASCADE,
        related_name='embedding'
    )
    vector = VectorField(
        dimensions=384
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Эмбеддинг курса'


class SectionEmbedding(models.Model):
    section = models.OneToOneField(
        'education.EducationSection',
        on_delete=models.CASCADE,
        related_name='embedding'
    )
    vector = VectorField(dimensions=384)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Эмбеддинг раздела'


