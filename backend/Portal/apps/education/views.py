from rest_framework.exceptions import PermissionDenied
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from .models import EducationSection, SectionMaterial, Course, CourseModule
from .permissions import IsSectionOwner, IsCourseOwner
from .serializers import EducationSectionSerializer, SectionMaterialSerializer, CourseSerializer, \
    CourseModuleSerializer, EducationSectionDetailSerializer
from apps.users.permissions import IsCreator
from django.shortcuts import get_object_or_404




class EducationSectionViewSet(ModelViewSet):

    serializer_class = EducationSectionSerializer

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return EducationSectionDetailSerializer
        return EducationSectionSerializer

    def get_queryset(self):
        return (EducationSection.objects.filter(is_published=True).prefetch_related(
            "materials",
            "courses",
            "courses__modules",
        ))

    def get_permissions(self):
        if self.action == 'create':
            return [IsCreator()]
        return [IsAuthenticatedOrReadOnly()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class SectionMaterialViewSet(ModelViewSet):
    serializer_class = SectionMaterialSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsSectionOwner]

    def get_queryset(self):
        return SectionMaterial.objects.filter(section_id=self.kwargs['section_pk'])

    def perform_create(self, serializer):
        section = EducationSection.objects.get(pk=self.kwargs['section_pk'])
        if section.created_by != self.request.user:
            raise PermissionDenied("Вы не можете добавить материал в чужой раздел")
        serializer.save(section=section)

    def get_permissions(self):
        if self.action == 'create':
            return [IsCreator()]
        return [IsAuthenticatedOrReadOnly()]



class CourseViewSet(ModelViewSet):
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsSectionOwner]
    def get_queryset(self):
        return Course.objects.filter(section_id=self.kwargs['section_pk'])

    def perform_create(self, serializer):
        section = EducationSection.objects.get(pk=self.kwargs['section_pk'])
        if section.created_by != self.request.user:
            raise PermissionDenied("Вы не можете создавать курс в чужом разделе")
        serializer.save(section=section, created_by=self.request.user)

class CourseModuleViewSet(ModelViewSet):
    serializer_class = CourseModuleSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsCourseOwner]
    def get_queryset(self):
        return CourseModule.objects.filter(course_id=self.kwargs['course_pk'])

    def perform_create(self, serializer):
        course = get_object_or_404(
            Course,
            pk=self.kwargs['course_pk'],
            section_id=self.kwargs['section_pk'],
        )
        if course.created_by != self.request.user:
            raise PermissionDenied(
                "Вы не можете добавлять модули в чужой курс"
            )
        last_module = CourseModule.objects.filter(course=course).order_by('-order').first()
        next_order = 1
        if last_module:
            next_order = last_module.order + 1
        serializer.save(course=course, order=next_order)









