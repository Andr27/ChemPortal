from email._header_value_parser import Section

from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import PermissionDenied, NotFound
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated, AllowAny
from rest_framework import status
from rest_framework.viewsets import GenericViewSet
from rest_framework.mixins import ListModelMixin

from Portal.mixins import StatusAccessMixin, ModeratorMixin
from Portal.permissions import IsCreator, IsModerator, IsAdmin, IsExpert
from Portal.choices import ModerationStatus, UserRole
from Portal.pagination import StandardPagination



from .models import EducationSection, SectionMaterial, Course, Chapter, Lesson, LessonComments
from .permissions import IsSectionOwner, IsCourseOwner
from .serializers import EducationSectionSerializer, SectionMaterialSerializer, CourseSerializer, \
    EducationSectionDetailSerializer, CourseDetailSerializer, ChapterSerializer, LessonSerializer, \
    LessonCommentsSerializer



class EducationSectionViewSet(ModeratorMixin, StatusAccessMixin, ModelViewSet):
    queryset = EducationSection.objects.all().prefetch_related(
        "materials",
        "courses",
    )
    owner_field = "created_by"
    status_field = "status"
    pagination_class = StandardPagination

    #serializers
    def get_serializer_class(self):
        if self.action == "retrieve":
            return EducationSectionDetailSerializer
        return EducationSectionSerializer

    #permissions
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        if self.action in ['approve', 'reject', 'moderation_list',
                           'my_sections', 'my_draft_sections',
                           'my_published_sections', 'my_reject_sections']:
            return [IsModerator()]
        return [AllowAny()]



    #create update delete
    def perform_create(self, serializer):
        serializer.save(
            created_by=self.request.user,
            status=ModerationStatus.PUBLISHED
        )

    def perform_update(self, serializer):
        user = self.request.user
        obj = self.get_object()
        if user.profile.role not in [UserRole.ADMIN]:
            raise PermissionDenied("Только администратор может редактировать разделы")
        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        if user.profile.role not in [UserRole.ADMIN]:
            raise PermissionDenied("Только администратор может удалять разделы")
        instance.delete()


    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def all_sections_detail(self, request, pk=None):
        sections = self.get_base_queryset().filter(pk=pk)
        serializer = self.get_serializer(sections, many=True)
        return Response(serializer.data)




class SectionMaterialViewSet(ModelViewSet):
    serializer_class = SectionMaterialSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsSectionOwner]
    pagination_class = StandardPagination

    def get_queryset(self):
        section = get_object_or_404(EducationSection, pk=self.kwargs['section_pk'])
        user = self.request.user

        if section.status != ModerationStatus.PUBLISHED:
            if not user.is_authenticated:
                return SectionMaterial.objects.none()
            if section.created_by != user and user.profile.role not in [UserRole.MODERATOR, UserRole.ADMIN]:
                return SectionMaterial.objects.none()

        return SectionMaterial.objects.filter(section=section)

    def perform_create(self, serializer):
        section = get_object_or_404(EducationSection, pk=self.kwargs['section_pk'])
        serializer.save(section=section)

    def get_permissions(self):
        if self.action == 'create':
            return [IsCreator()]
        return [IsAuthenticatedOrReadOnly()]



class CourseViewSet(ModeratorMixin, StatusAccessMixin, ModelViewSet):
    queryset = Course.objects.all()
    owner_field = 'created_by'
    status_field = 'status'
    pagination_class = StandardPagination

    def get_serializer_class(self):
        if self.action in ['all_courses_detail', 'retrieve']:
            return CourseDetailSerializer
        return CourseSerializer

    def get_base_queryset(self):
        return Course.objects.filter(
            section_id=self.kwargs['section_pk']
        ).prefetch_related('chapters__lessons')

    def get_permissions(self):
        if self.action == 'create':
            return [IsCreator()]
        if self.action in ['approve', 'reject', 'moderation_list']:
            return [IsModerator()]
        return super().get_permissions()


    #cud
    def perform_create(self, serializer):
        section = get_object_or_404(EducationSection, pk=self.kwargs['section_pk'])
        serializer.save(
            created_by=self.request.user,
            section=section
        )

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
        page = self.paginate_queryset(courses)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(courses, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], permission_classes=[IsCreator])
    def create_and_send_to_moderation(self, request, section_pk=None):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(section_id=section_pk, created_by=request.user, status=ModerationStatus.MODERATION)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    #my courses
    @action(detail=False, methods=['get'], permission_classes=[IsCreator])
    def my_courses(self, request, **kwargs):
        courses = self.get_base_queryset().filter(created_by=self.request.user)
        page = self.paginate_queryset(courses)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(courses, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsCreator])
    def my_draft_courses(self, request, **kwargs):
        courses = self.get_base_queryset().filter(
            created_by=self.request.user,
            status=ModerationStatus.DRAFT
        )
        page = self.paginate_queryset(courses)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(courses, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsCreator])
    def my_reject_courses(self, request, **kwargs):
        courses = self.get_base_queryset().filter(
            created_by=self.request.user,
            status=ModerationStatus.REJECTED
        )
        page = self.paginate_queryset(courses)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(courses, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsCreator])
    def my_published_courses(self, request, **kwargs):
        courses = self.get_base_queryset().filter(
            created_by=self.request.user,
            status=ModerationStatus.PUBLISHED
        )
        page = self.paginate_queryset(courses)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(courses, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def all_courses_detail(self, request, pk=None, **kwargs):
        courses = self.get_base_queryset().filter(pk=pk).prefetch_related(
            "chapters__lessons"
        )
        serializer = self.get_serializer(courses, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsModerator])
    def approve(self, request, pk=None, **kwargs):
        from apps.quiz.models import Quiz
        obj = get_object_or_404(
            self.get_base_queryset().filter(status=ModerationStatus.MODERATION),
            pk=pk)
        obj.status = ModerationStatus.PUBLISHED
        obj.save()

        Quiz.objects.filter(
            chapter__course=obj
        ).update(status=ModerationStatus.PUBLISHED)
        Quiz.objects.filter(
            lesson__chapter__course=obj
        ).update(status=ModerationStatus.PUBLISHED)

        return Response({"detail": "Подтверждено"})


    @action(detail=True, methods=['post'], permission_classes=[IsCreator])
    def send_to_moderation(self, request, pk=None, **kwargs):
        from apps.quiz.models import Quiz

        obj = get_object_or_404(
            self.get_queryset(),
            pk=pk,
            created_by=self.request.user
        )
        if obj.status not in [ModerationStatus.DRAFT, ModerationStatus.REJECTED]:
            return Response({"detail": "Только черновики можно отправить на модерацию"}, status=400)

        obj.status = ModerationStatus.MODERATION
        obj.save()

        Quiz.objects.filter(
            chapter__course=obj
        ).update(status=ModerationStatus.MODERATION)
        Quiz.objects.filter(
            lesson__chapter__course=obj
        ).update(status=ModerationStatus.MODERATION)

        return Response({"detail": "Отправлено на модерацию"})


    @action(detail=True, methods=['post'], permission_classes=[IsModerator])
    def reject(self, request, pk=None, **kwargs):
        from apps.quiz.models import Quiz
        obj = get_object_or_404(
            self.get_base_queryset().filter(status=ModerationStatus.MODERATION),
            pk=pk,
        )
        obj.status = ModerationStatus.REJECTED
        obj.reject_comment = request.data.get('comment', '')
        obj.save()

        Quiz.objects.filter(
            chapter__course=obj
        ).update(status=ModerationStatus.DRAFT)
        Quiz.objects.filter(
            lesson__chapter__course=obj
        ).update(status=ModerationStatus.DRAFT)

        return Response({"detail": "Отклонено"})

    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None, **kwargs):
        from apps.enrollment.models import CourseEnrollment, LessonProgress
        from apps.quiz.models import QuizAttempt
        from django.db.models import Avg
        from django.core.cache import cache

        course = self.get_object()
        cache_key = f'course_stats_{course.id}'
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        enrollments = CourseEnrollment.objects.filter(course=course)
        total_students = enrollments.count()
        completed_students = enrollments.filter(status='completed').count()
        active_students = enrollments.filter(status='active').count()

        completion_rate = 0
        if total_students > 0:
            completion_rate = round(completed_students / total_students * 100, 1)

        avg_progress = enrollments.filter(
            status='active',
        ).aggregate(Avg('progress_percent'))['progress_percent__avg'] or 0


        avg_score = QuizAttempt.objects.filter(
            quiz__chapter__course=course,
            status='completed',
        ).aggregate(Avg('score'))['score__avg'] or 0

        avg_score_lessons = QuizAttempt.objects.filter(
            quiz__lesson__chapter__course=course,
            status='completed',
        ).aggregate(Avg('score'))['score__avg'] or 0

        scores = [s for s in [avg_score, avg_score_lessons] if s > 0]
        final_avg_score = round(sum(scores) / len(scores), 1) if scores else 0
        data = {
            'course_id': course.id,
            'course_title': course.title,
            'total_students': total_students,
            'active_students': active_students,
            'completed_students': completed_students,
            'completion_rate': completion_rate,
            'avg_progress': round(avg_progress, 1),
            'avg_score': final_avg_score,
            'rating': course.rating,
            'reviews_count': course.reviews_count,
        }
        cache.set(cache_key, data, timeout=1800)
        return Response(data)


    @action(detail=True, methods=['get'], permission_classes=[IsCreator])
    def export_json(self, request, **kwargs):
        course = self.get_object()

        if course.created_by != request.user:
            return Response({"detail": "Только автор может экспортировать курс"}, status=status.HTTP_403_FORBIDDEN)

        data = {
            'title': course.title,
            'description': course.description,
            'chapters': []
        }
        for chapter in course.chapters.all().order_by('order'):
            chapter_data = {
                'title': chapter.title,
                'description': chapter.description,
                'order': chapter.order,
                'lessons': []
            }
            for lesson in chapter.lessons.all().order_by('order'):
                chapter_data['lessons'].append({
                    'title': lesson.title,
                    'type': lesson.type,
                    'content': lesson.content,
                    'order': lesson.order,
                })
            data['chapters'].append(chapter_data)
        return Response(data)



    @action(detail=False, methods=['post'], permission_classes=[IsCreator])
    def import_json(self, request, **kwargs):
        section_pk = self.kwargs.get('section_pk')
        section = get_object_or_404(Section, pk=section_pk)

        data = request.data
        if not data.get('title'):
            return Response({'detail': "Нужен title"}, status=status.HTTP_400_BAD_REQUEST)

        course = Course.objects.create(
            title=data['title'],
            description=data.get('description', ''),
            section=section,
            created_by=request.user,
            status=ModerationStatus.DRAFT
        )

        for ch in data.get('chapters', []):
            chapter = Chapter.objects.create(
                course=course,
                title=ch['title'],
                description=ch.get('description', ''),
                order=ch.get('order', 0),
            )
            for ls in ch.get('lessons', []):
                Lesson.objects.create(
                    chapter=chapter,
                    title=ls['title'],
                    type=ls.get('type', 'lecture'),
                    content=ls.get('content', ''),
                    order=ls.get('order', 0),
                )
        serializer = CourseSerializer(course)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], permission_classes=[IsModerator])
    def ai_analyze(self, request, **kwargs):
        course = self.get_object()
        from apps.search.ai_moderation import analyze_context
        result = analyze_context(course.title, course.description or '')
        return Response(
            {
                "course_id": course.id,
                "course_title": course.title,
                **result,
            }
        )

    @action(detail=True, methods=['post'], permission_classes=[IsExpert])
    def expert_vote(self, request, **kwargs):
        from .expert_moderation import process_vote
        course = self.get_object()
        if course.status != ModerationStatus.MODERATION:
            return Response({'detail': 'Курс не на модерации'}, status=400)
        vote = request.data.get('vote')
        if vote not in ['approve', 'reject']:
            return Response({'detail': 'vote: approve / reject'}, status=400)
        result = process_vote(course, request.user, vote, request.data.get('comment', ''))
        return Response(result)

    @action(detail=True, methods=['get'], permission_classes=[IsExpert])
    def expert_reviews(self, request, **kwargs):
        from .expert_moderation import get_votes
        course = self.get_object()
        votes = get_votes(course)
        return Response({
            'course_id': course.id,
            'status': course.status,
            'votes': {
                'approve': votes['approve'],
                'reject': votes['reject'],
                'total': votes['total'],
            },
            'reviews': [
                {
                    'expert': {
                        'id': r.expert.id,
                        'first_name': r.expert.first_name,
                        'last_name': r.expert.last_name,
                    },
                    'vote': r.vote,
                    'comment': r.comment,
                    'created_at': r.created_at,
                }
                for r in votes['reviews']
            ]
        })

    @action(detail=False, methods=['get'], permission_classes=[IsExpert])
    def expert_queue(self, request, **kwargs):
        from django.contrib.contenttypes.models import ContentType
        from .models import ExpertReview
        ct = ContentType.objects.get_for_model(Course)
        voted_ids = ExpertReview.objects.filter(
            content_type=ct, expert=request.user
        ).values_list('object_id', flat=True)
        courses = Course.objects.filter(
            status=ModerationStatus.MODERATION
        ).exclude(id__in=voted_ids).select_related('section', 'created_by')
        page = self.paginate_queryset(courses)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)


class ChapterViewSet(ModelViewSet):
    serializer_class = ChapterSerializer

    def get_queryset(self):
        course = get_object_or_404(Course, pk=self.kwargs['course_pk'])
        user = self.request.user

        # если курс не опубликован — главы видит только владелец и модератор
        if course.status != ModerationStatus.PUBLISHED:
            if not user.is_authenticated:
                return Chapter.objects.none()
            if course.created_by != user and user.profile.role not in [UserRole.MODERATOR, UserRole.ADMIN]:
                return Chapter.objects.none()

        return Chapter.objects.filter(
            course_id=self.kwargs['course_pk']
        ).prefetch_related('lessons')

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsCreator()]
        return [IsAuthenticatedOrReadOnly()]

    def perform_create(self, serializer):
        course = get_object_or_404(
            Course,
            pk=self.kwargs['course_pk'],
            section_id=self.kwargs['section_pk'],
        )
        if course.created_by != self.request.user:
            raise PermissionDenied("Вы не можете добавлять главы в чужой курс")

        last = Chapter.objects.filter(course=course).order_by('-order').first()
        next_order = (last.order + 1) if last else 1
        serializer.save(course=course, order=next_order)

    def perform_update(self, serializer):
        obj = self.get_object()
        if obj.course.created_by != self.request.user:
            raise PermissionDenied("Вы не можете редактировать эту главу")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.course.created_by != self.request.user:
            raise PermissionDenied("Вы не можете удалить эту главу")
        instance.delete()


class LessonViewSet(ModelViewSet):
    serializer_class = LessonSerializer

    def get_queryset(self):
        chapter = get_object_or_404(Chapter, pk=self.kwargs['chapter_pk'])
        user = self.request.user

        if chapter.course.status != ModerationStatus.PUBLISHED:
            if not user.is_authenticated:
                return Lesson.objects.none()
            if chapter.course.created_by != user and user.profile.role not in [UserRole.MODERATOR, UserRole.ADMIN]:
                return Lesson.objects.none()

        return Lesson.objects.filter(chapter_id=self.kwargs['chapter_pk'])

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsCreator()]
        return [IsAuthenticatedOrReadOnly()]

    def perform_create(self, serializer):
        chapter = get_object_or_404(
            Chapter,
            pk=self.kwargs['chapter_pk'],
            course_id=self.kwargs['course_pk'],
        )
        if chapter.course.created_by != self.request.user:
            raise PermissionDenied("Вы не можете добавлять уроки в чужой курс")

        last = Lesson.objects.filter(chapter=chapter).order_by('-order').first()
        next_order = (last.order + 1) if last else 1
        serializer.save(chapter=chapter, order=next_order)

    def perform_update(self, serializer):
        obj = self.get_object()
        if obj.chapter.course.created_by != self.request.user:
            raise PermissionDenied("Вы не можете редактировать этот урок")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.chapter.course.created_by != self.request.user:
            raise PermissionDenied("Вы не можете удалить этот урок")
        instance.delete()



class GlobalCourseViewSet(ListModelMixin, GenericViewSet):
    serializer_class = CourseSerializer
    permission_classes = [IsModerator]
    pagination_class = StandardPagination

    def get_queryset(self):
        return Course.objects.select_related('section').all()

    @action(detail=False, methods=['get'])
    def moderation_list(self, request):
        courses = Course.objects.filter(status=ModerationStatus.MODERATION).select_related('section')
        page = self.paginate_queryset(courses)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsCreator])
    def my_courses(self, request):
        courses = Course.objects.filter(
            created_by=request.user
        ).select_related('section')
        page = self.paginate_queryset(courses)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)




class LessonCommentsViewSet(ModelViewSet):
    serializer_class = LessonCommentsSerializer


    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        if self.action == 'pin':
            return [IsCreator()]
        return [IsAuthenticated()]


    def get_queryset(self):
        lesson_id = self.kwargs['lesson_pk']
        lesson = get_object_or_404(Lesson, pk=lesson_id)
        if self.action == 'list':
            return LessonComments.objects.filter(
                lesson=lesson,
                parent__isnull=True).prefetch_related(
                'children__author__profile'
            ).select_related(
                'author__profile'
            )
        return LessonComments.objects.filter(lesson=lesson)


    def perform_create(self, serializer):
        lesson_id = self.kwargs['lesson_pk']
        lesson = get_object_or_404(Lesson, pk=lesson_id)
        parent_id = self.request.data.get('parent')
        parent = None
        if parent_id:
            parent = get_object_or_404(LessonComments, id=parent_id, lesson=lesson)
        serializer.save(author=self.request.user, lesson=lesson, parent=parent)


    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.text = '[комментарий удален]'
        instance.save()

    @action(detail=True, methods=['post'])
    def pin(self, request, **kwargs):
        comment = self.get_object()
        lesson = comment.lesson
        course = lesson.chapter.course
        if course.created_by != self.request.user:
            return Response({
                "detail": "Только автор курса может закреплять комментарии"
            }, status=status.HTTP_403_FORBIDDEN)
        LessonComments.objects.filter(lesson=lesson, is_pinned=True).update(is_pinned=False)
        comment.is_pinned = True
        comment.save()
        return Response({"detail": "Комментарий закреплен"})
