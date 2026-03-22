from django.utils import timezone
from django.shortcuts import get_object_or_404

from rest_framework.viewsets import GenericViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError

from Portal.choices import ModerationStatus
from Portal.pagination import StandardPagination

from apps.education.models import Course, Chapter, Lesson
from .models import CourseEnrollment, ChapterProgress, LessonProgress, CourseCertificate
from .serializers import (
    CourseEnrollmentSerializer,
    CourseEnrollmentListSerializer,
    CourseCertificateSerializer,
)


class CourseEnrollmentViewSet(GenericViewSet):
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination

    def get_queryset(self):
        return CourseEnrollment.objects.filter(
            user=self.request.user
        ).select_related('course').prefetch_related(
            'chapter_progresses__chapter',
            'lesson_progresses__lesson',
        )

    @action(detail=False, methods=['post'])
    def enroll(self, request):
        course_id = request.data.get('course_id')
        if not course_id:
            raise ValidationError("Укажите course_id")

        course = get_object_or_404(
            Course,
            pk=course_id,
            status=ModerationStatus.PUBLISHED
        )

        enrollment, created = CourseEnrollment.objects.get_or_create(
            user=request.user,
            course=course,
            defaults={'status': 'active'}
        )

        if not created:
            if enrollment.status == 'dropped':
                enrollment.status = 'active'
                enrollment.save()
                return Response({
                    'detail': 'Вы снова записаны на курс',
                    'enrollment_id': enrollment.id
                })
            return Response({
                'detail': 'Вы уже записаны на этот курс',
                'enrollment_id': enrollment.id
            })

        # Создаём ChapterProgress и LessonProgress для каждой главы и урока
        chapters = course.chapters.prefetch_related('lessons').all()
        lessons_count = 0
        for chapter in chapters:
            ChapterProgress.objects.get_or_create(
                enrollment=enrollment,
                chapter=chapter,
            )
            for lesson in chapter.lessons.all():
                LessonProgress.objects.get_or_create(
                    enrollment=enrollment,
                    lesson=lesson,
                )
                lessons_count += 1

        return Response({
            'detail': 'Вы записаны на курс',
            'enrollment_id': enrollment.id,
            'chapters_count': chapters.count(),
            'lessons_count': lessons_count,
        }, status=201)

    @action(detail=False, methods=['post'])
    def drop(self, request):
        course_id = request.data.get('course_id')
        if not course_id:
            raise ValidationError("Укажите course_id")

        enrollment = get_object_or_404(
            CourseEnrollment,
            user=request.user,
            course_id=course_id
        )
        enrollment.status = 'dropped'
        enrollment.save()
        return Response({'detail': 'Вы покинули курс'})

    @action(detail=False, methods=['get'])
    def my(self, request):
        enrollments = self.get_queryset()
        serializer = CourseEnrollmentListSerializer(enrollments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def progress(self, request, pk=None):
        enrollment = get_object_or_404(
            CourseEnrollment,
            pk=pk,
            user=request.user
        )
        serializer = CourseEnrollmentSerializer(enrollment)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def next_lesson(self, request):
        course_id = request.query_params.get('course_id')
        if not course_id:
            raise ValidationError("Укажите course_id")

        enrollment = get_object_or_404(
            CourseEnrollment,
            user=request.user,
            course_id=course_id,
            status='active'
        )

        next_progress = LessonProgress.objects.filter(
            enrollment=enrollment,
            is_completed=False,
        ).order_by('lesson__chapter__order', 'lesson__order').first()

        if not next_progress:
            return Response({
                'detail': 'Все уроки пройдены',
                'completed': True
            })

        return Response({
            'completed': False,
            'chapter_id': next_progress.lesson.chapter.id,
            'chapter_title': next_progress.lesson.chapter.title,
            'lesson_id': next_progress.lesson.id,
            'lesson_title': next_progress.lesson.title,
            'lesson_type': next_progress.lesson.type,
            'lesson_order': next_progress.lesson.order,
            'has_quiz': hasattr(next_progress.lesson, 'quiz'),
        })

    @action(detail=True, methods=['post'])
    def complete_lesson(self, request, pk=None):
        enrollment = get_object_or_404(
            CourseEnrollment,
            pk=pk,
            user=request.user,
            status='active'
        )

        lesson_id = request.data.get('lesson_id')
        if not lesson_id:
            raise ValidationError("Укажите lesson_id")

        lesson = get_object_or_404(
            Lesson,
            pk=lesson_id,
            chapter__course=enrollment.course
        )

        # Проверка порядка уроков внутри главы
        prev_lesson = Lesson.objects.filter(
            chapter=lesson.chapter,
            order__lt=lesson.order,
        ).order_by('-order').first()

        if prev_lesson:
            prev_progress = LessonProgress.objects.filter(
                enrollment=enrollment,
                lesson=prev_lesson,
            ).first()
            if not prev_progress or not prev_progress.is_completed:
                raise ValidationError(
                    f"Сначала завершите предыдущий урок: «{prev_lesson.title}»"
                )

        # Проверка порядка глав
        prev_chapter = Chapter.objects.filter(
            course=enrollment.course,
            order__lt=lesson.chapter.order,
        ).order_by('-order').first()

        if prev_chapter:
            prev_chapter_progress = ChapterProgress.objects.filter(
                enrollment=enrollment,
                chapter=prev_chapter,
            ).first()
            if not prev_chapter_progress or not prev_chapter_progress.is_completed:
                raise ValidationError(
                    f"Сначала завершите предыдущую главу: «{prev_chapter.title}»"
                )

        # Если у урока есть тест — проверяем что сдан
        if hasattr(lesson, 'quiz'):
            from apps.quiz.models import QuizAttempt
            best_attempt = QuizAttempt.objects.filter(
                quiz=lesson.quiz,
                user=request.user,
                status='completed',
                is_passed=True,
            ).first()
            if not best_attempt:
                raise ValidationError(
                    f"Для завершения урока «{lesson.title}» необходимо сдать тест"
                )

        lesson_progress, _ = LessonProgress.objects.get_or_create(
            enrollment=enrollment,
            lesson=lesson,
        )

        if lesson_progress.is_completed:
            return Response({
                'detail': 'Урок уже пройден',
                'progress_percent': enrollment.progress_percent,
            })

        if hasattr(lesson, 'quiz'):
            lesson_progress.best_score = best_attempt.score

        lesson_progress.mark_complete()
        enrollment.refresh_from_db()

        return Response({
            'detail': 'Урок завершён',
            'progress_percent': enrollment.progress_percent,
            'course_completed': enrollment.status == 'completed',
        })

    @action(detail=False, methods=['get'])
    def certificates(self, request):
        certs = CourseCertificate.objects.filter(
            user=request.user
        ).select_related('course')
        serializer = CourseCertificateSerializer(certs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def certificate_detail(self, request):
        number = request.query_params.get('number')
        if not number:
            raise ValidationError("Укажите number")

        cert = get_object_or_404(
            CourseCertificate,
            certificate_number=number
        )
        return Response(CourseCertificateSerializer(cert).data)


    @action(detail=False, methods=['post'])
    def leave_review(self, request):
        from .models import CourseReview
        from .serializers import CourseReviewSerializer

        course_id = request.data.get('course_id')
        if not course_id:
            raise ValidationError("Укажите course_id")

        enrollment = get_object_or_404(
            CourseEnrollment,
            user=request.user,
            course_id=course_id,
        )

        rating = request.data.get('rating')
        if not rating or not (1<= int(rating) <= 5):
            raise ValidationError("Рейтинг должен быть от 1 до 5")

        review, created = CourseReview.objects.update_or_create(
            course_id=course_id,
            user=request.user,
            defaults={
                'rating': rating,
                'comment': request.data.get('comment', '')
            }
        )
        serializer = CourseReviewSerializer(review)
        return Response(serializer.data, status=201 if created else 200)


    @action(detail=False, methods=['get'])
    def course_reviews(self, request):
        from .models import CourseReview
        from .serializers import CourseReviewSerializer

        course_id = request.query_params.get('course_id')
        if not course_id:
            raise ValidationError('Укажите course_id')

        only_with_comment = request.query_params.get('with_comment')
        reviews = CourseReview.objects.filter(course_id=course_id).select_related('user')
        if only_with_comment:
            reviews = reviews.exclude(comment='')

        sort = request.query_params.get('sort', '-created_at')
        if sort == 'useful':
            reviews = reviews.order_by('-rating')
        else:
            reviews = reviews.order_by('-created_at')

        page = self.paginate_queryset(reviews)
        serializer = CourseReviewSerializer(page, many=True)
        return self.get_paginated_response(serializer.data)