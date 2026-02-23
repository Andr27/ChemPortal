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
    CourseModuleSerializer, EducationSectionDetailSerializer





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

        serializer.save(status=ModerationStatus.PUBLISHED)


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






















'''

class EducationSectionViewSet(ModelViewSet):
    serializer_class = EducationSectionSerializer



    def get_serializer_class(self):
        if self.action == 'retrieve':
            return EducationSectionDetailSerializer
        return EducationSectionSerializer

    def get_queryset(self):
        user = self.request.user
        if self.action == 'moderation_list':
            return EducationSection.objects.filter(status='moderation')
        if self.action == 'rejected_sections':
            return EducationSection.objects.filter(status='rejected')

        queryset = EducationSection.objects.filter(status='published').prefetch_related(
            "materials",
            "courses",
            "courses__modules",
        )
        if not user.is_authenticated:
            return queryset.filter(status='published')

        if hasattr(user, 'profile') and user.profile.role in ["admin", "moderator"]:
            return queryset
        return queryset.filter(
            Q(status='published') |
            Q(created_by=user)
        )


    def get_permissions(self):
        if self.action == 'create':
            return [IsCreator()]
        if self.action in ['destroy', 'update', 'partial_update']:
            return [IsOwnerOrAdmin()]
        if self.action == "send_to_moderation":
            return [IsCreator()]
        if self.action in ['approve', 'reject', 'moderation_list',]:
            return [IsModerator()]
        return [IsAuthenticatedOrReadOnly()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        obj = self.get_object()
        if obj.status == "published" and self.request.user.profile.role not in ["admin", "moderator"]:
            raise PermissionDenied("Нельзя редактировать опубликованные объект")


    @action(detail=False, methods=['get'])
    def moderation_list(self, request):
        education_section = EducationSection.objects.filter(status='moderation')
        serializer = self.get_serializer(education_section, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def send_to_moderation(self, request, pk=None):
        education_section = get_object_or_404(EducationSection, pk=pk, created_by=self.request.user)
        if education_section.status !='draft':
            return Response({"detail": "Только черновики можно отправить на модерацию"}, status=400)
        education_section.status = 'moderation'
        education_section.save()
        return Response({"detail": "Отправлено на модерацию"})

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        education_section = get_object_or_404(EducationSection, pk=pk, status='moderation')
        education_section.status = 'published'
        education_section.save()
        return Response({'detail': "Секция подтверждена"})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        education_section = get_object_or_404(EducationSection, pk=pk, status='moderation')
        education_section.status = 'rejected'
        education_section.save()
        return Response({'detail': "Секция отклонена"})

    @action(detail=False, methods=['get'], permission_classes=[IsOwnerOrAdmin])
    def rejected_sections(self, request):
        education_sections = EducationSection.objects.filter(status='rejected')
        serializer = self.get_serializer(education_sections, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_education_sections(self, request):
        education_sections = EducationSection.objects.filter(created_by=self.request.user)
        serializer = self.get_serializer(education_sections, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsCreator])
    def my_rejected_sections(self, request):
        education_sections = EducationSection.objects.filter(status='rejected', created_by=self.request.user)
        page = self.paginate_queryset(education_sections)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(education_sections, many=True)
        return Response(serializer.data)


    @action(detail=False, methods=['get'], permission_classes=[IsCreator])
    def my_published_sections(self, request):
        education_sections = EducationSection.objects.filter(status='published', created_by=self.request.user)
        page = self.paginate_queryset(education_sections)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(education_sections, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsCreator])
    def my_draft_sections(self, request):
        education_sections = EducationSection.objects.filter(status='draft', created_by=self.request.user)
        page = self.paginate_queryset(education_sections)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(education_sections, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], permission_classes=[ReadOnlyOrCreator])
    def all_sections_detail(self, request, pk=None):
        education_sections = EducationSection.objects.get(pk=pk)
        self.check_object_permissions(request, education_sections)
        serializer = self.get_serializer(education_sections)
        return Response(serializer.data)
'''
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
        user = self.request.user

        qs =Course.objects.filter(section_id=self.kwargs['section_pk'])
        if not user.is_authenticated:
            return qs.filter(status='published')
        if hasattr(user, 'profile') and user.profile.role in ["admin", "moderator"]:
            return qs
        return qs.filter(
            Q(status='published') |
            Q(created_by=user)
        )

    def perform_create(self, serializer):
        section = EducationSection.objects.get(pk=self.kwargs['section_pk'])
        if section.created_by != self.request.user:
            raise PermissionDenied("Вы не можете создавать курс в чужом разделе")
        serializer.save(section=section, created_by=self.request.user)

    def perform_update(self, serializer):
        obj = self.get_object()
        if obj.status == "published" and self.request.user.profile.role not in ["admin", "moderator"]:
            raise PermissionDenied("Нельзя редактировать опубликованные объект")

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











