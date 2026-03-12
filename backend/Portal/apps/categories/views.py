from rest_framework.viewsets import GenericViewSet
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin
from rest_framework.decorators import action
from rest_framework.response import Response

from django.shortcuts import get_object_or_404


from Portal.choices import ModerationStatus
from .models import Category
from .serializers import CategorySerializer
from ..education.models import EducationSection


class CategoryViewSet(ListModelMixin, RetrieveModelMixin, GenericViewSet):
    serializer_class = CategorySerializer
    lookup_field = 'slug'


    def get_queryset(self):
        return Category.objects.filter(is_active=True)

    @action(detail=True, methods=['get'])
    def sections(self, request, slug=None):
        from apps.education.serializers import EducationSectionSerializer
        category = get_object_or_404(Category, slug=slug, is_active=True)
        sections = category.sections.filter(status=ModerationStatus.PUBLISHED)
        serializer = EducationSectionSerializer(sections, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def courses(self, request, slug=None):
        from apps.education.serializers import CourseSerializer
        category = get_object_or_404(Category, slug=slug, is_active=True)
        courses = category.sections.filter(
            status=ModerationStatus.PUBLISHED
        ).prefetch_related('courses').values_list('courses', flat=True)
        from apps.education.models import Course
        courses = Course.objects.filter(
            section__category=category,
            status=ModerationStatus.PUBLISHED
        )
        serializer = CourseSerializer(courses, many=True)
        return Response(serializer.data)