from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q
from rest_framework.exceptions import PermissionDenied, NotFound
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated

from Portal.mixins import StatusAccessMixin, ModeratorMixin
from Portal.permissions import IsCreator, IsModerator
from Portal.choices import ModerationStatus, UserRole




from .models import EducationSection, SectionMaterial, Course, CourseModule
from .permissions import IsSectionOwner, IsCourseOwner
from .serializers import EducationSectionSerializer, SectionMaterialSerializer, CourseSerializer, \
    CourseModuleSerializer, EducationSectionDetailSerializer, CourseDetailSerializer


class EducationSectionViewSet(ModeratorMixin, StatusAccessMixin, ModelViewSet):
    queryset = EducationSection.objects.all().prefetch_related(
        "materials",
        "courses",
        "courses__modules",
    )
    owner_field = "created_by"
    status_field = "status"


    #serializers
    def get_serializer_class(self):
        if self.action == "retrieve":
            return EducationSectionDetailSerializer
        return EducationSectionSerializer

    #permissions
    def get_permissions(self):
        if self.action == "create":
            return [IsCreator()]
        if self.action in ['approve', 'reject', 'moderation_list']:
            return [IsModerator()]
        return super().get_permissions()



    #create update delete
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        obj = self.get_object()
        user = self.request.user

        if obj.created_by != user and user.profile.role not in [UserRole.MODERATOR, UserRole.ADMIN]:
            raise PermissionDenied("Вы не можете редактировать этот раздел")

        if obj.status == ModerationStatus.PUBLISHED and user.profile.role not in [UserRole.MODERATOR, UserRole.ADMIN]:
            raise PermissionDenied("Нельзя редактировать опубликованный раздел")

        serializer.save(status=ModerationStatus.DRAFT)


    def perform_destroy(self, instance):
        user = self.request.user
        if instance.created_by != user and user.profile.role not in [UserRole.MODERATOR, UserRole.ADMIN]:
            raise PermissionDenied("Вы не можете удалить этот раздел")
        instance.delete()


    #moderation list
    @action(detail=False, methods=['get'], permission_classes=[IsModerator])
    def moderation_list(self, request):
        sections = self.get_base_queryset().filter(status=ModerationStatus.MODERATION)
        serializer = self.get_serializer(sections, many=True)
        return Response(serializer.data)

    #my section
    @action(detail=False, methods=['get'], permission_classes=[IsCreator])
    def my_sections(self, request):
        sections = self.get_base_queryset().filter(created_by=self.request.user)
        serializer = self.get_serializer(sections, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsCreator])
    def my_draft_sections(self, request):
        sections = self.get_base_queryset().filter(
            created_by=self.request.user,
            status=ModerationStatus.DRAFT,
        )
        serializer = self.get_serializer(sections, many=True)
        return Response(serializer.data)


    @action(detail=False, methods=['get'], permission_classes=[IsCreator])
    def my_reject_sections(self, request):
        sections = self.get_base_queryset().filter(
            created_by=self.request.user,
            status=ModerationStatus.REJECTED,
        )
        serializer = self.get_serializer(sections, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsCreator])
    def my_published_sections(self, request):
        sections = self.get_base_queryset().filter(
            status=ModerationStatus.PUBLISHED,
            created_by=self.request.user,
        )
        serializer = self.get_serializer(sections, many=True)
        return Response(serializer.data)


    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def all_sections_detail(self, request, pk=None):
        sections = self.get_base_queryset().filter(pk=pk)
        serializer = self.get_serializer(sections, many=True)
        return Response(serializer.data)




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



class CourseViewSet(ModeratorMixin, StatusAccessMixin, ModelViewSet):
    queryset = Course.objects.all()
    owner_field = 'created_by'
    status_field = 'status'


    def get_serializer_class(self):
        if self.action == 'all_courses_detail':
            return CourseDetailSerializer
        return CourseSerializer


    def get_queryset(self):
        return Course.objects.filter(section_id=self.kwargs['section_pk'])

    def get_permissions(self):
        if self.action == 'create':
            return [IsCreator()]
        if self.action in ['approve', 'reject', 'moderation_list']:
            return [IsModerator()]
        return super().get_permissions()


    #cud
    def perform_create(self, serializer):
        section = EducationSection.objects.get(pk=self.kwargs['section_pk'])
        if section.created_by != self.request.user:
            raise PermissionDenied('Вы не можете создать курс в чужом разделе')
        serializer.save(section=section, created_by=self.request.user)

    def perform_update(self, serializer):
        obj = self.get_object()
        user = self.request.user
        if obj.created_by != user and user.profile.role not in [UserRole.MODERATOR, UserRole.ADMIN]:
            raise PermissionDenied("Вы не можете отредактировать данный курс")
        if obj.status == ModerationStatus.PUBLISHED and user.profile.role not in [UserRole.MODERATOR, UserRole.ADMIN]:
            raise PermissionDenied("Нельзя редактировать опубликованный курс")
        serializer.save(status=ModerationStatus.DRAFT)

    def perform_destroy(self, instance):
        user = self.request.user
        if instance.created_by != user and user.profile.role not in [UserRole.MODERATOR, UserRole.ADMIN]:
            return PermissionDenied("Вы не можете удалить этот курс")
        instance.delete()


    #moderation list
    @action(detail=False, methods=['get'], permission_classes=[IsModerator])
    def moderation_list(self, request, **kwargs):
        courses = self.get_base_queryset().filter(status=ModerationStatus.MODERATION)
        serializer = self.get_serializer(courses, many=True)
        return Response(serializer.data)

    #my courses
    @action(detail=False, methods=['get'], permission_classes=[IsCreator])
    def my_courses(self, request, **kwargs):
        courses = self.get_base_queryset().filter(created_by=self.request.user)
        serializer = self.get_serializer(courses, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsCreator])
    def my_draft_courses(self, request, **kwargs):
        courses = self.get_base_queryset().filter(
            created_by=self.request.user,
            status=ModerationStatus.DRAFT
        )
        serializer = self.get_serializer(courses, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsCreator])
    def my_reject_courses(self, request, **kwargs):
        courses = self.get_base_queryset().filter(
            created_by=self.request.user,
            status=ModerationStatus.REJECTED
        )
        serializer = self.get_serializer(courses, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsCreator])
    def my_published_courses(self, request, **kwargs):
        courses = self.get_base_queryset().filter(
            created_by=self.request.user,
            status=ModerationStatus.PUBLISHED
        )
        serializer = self.get_serializer(courses, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def all_courses_detail(self, request, pk=None, **kwargs):
        courses = self.get_base_queryset().filter(pk=pk).prefetch_related(
            "modules"
        )
        serializer = self.get_serializer(courses, many=True)
        return Response(serializer.data)





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











