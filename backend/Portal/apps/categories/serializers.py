from rest_framework import serializers

from Portal.choices import ModerationStatus
from .models import Category


class CategorySerializer(serializers.ModelSerializer):
    sections_count = serializers.SerializerMethodField()
    courses_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = (
            'id', 'name', 'slug', 'description',
            'order', 'sections_count', 'courses_count',
        )

    def get_sections_count(self, obj):
        return obj.sections.filter(status=ModerationStatus.PUBLISHED).count()

    def get_courses_count(self, obj):
        from apps.education.models import Course
        return Course.objects.filter(
            section__category=obj,
            status='published'
        ).count()