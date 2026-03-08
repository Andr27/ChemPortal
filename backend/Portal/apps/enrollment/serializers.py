from rest_framework import serializers
from .models import CourseEnrollment, ChapterProgress, LessonProgress, CourseCertificate


class LessonProgressSerializer(serializers.ModelSerializer):
    lesson_id = serializers.IntegerField(source='lesson.id')
    lesson_title = serializers.CharField(source='lesson.title')
    lesson_type = serializers.CharField(source='lesson.type')
    lesson_order = serializers.IntegerField(source='lesson.order')
    has_quiz = serializers.SerializerMethodField()

    class Meta:
        model = LessonProgress
        fields = (
            'id',
            'lesson_id', 'lesson_title',
            'lesson_type', 'lesson_order',
            'has_quiz',
            'is_completed', 'completed_at',
            'best_score',
        )

    def get_has_quiz(self, obj):
        return hasattr(obj.lesson, 'quiz')


class ChapterProgressSerializer(serializers.ModelSerializer):
    chapter_id = serializers.IntegerField(source='chapter.id')
    chapter_title = serializers.CharField(source='chapter.title')
    chapter_order = serializers.IntegerField(source='chapter.order')
    has_quiz = serializers.SerializerMethodField()
    lesson_progresses = serializers.SerializerMethodField()

    class Meta:
        model = ChapterProgress
        fields = (
            'id',
            'chapter_id', 'chapter_title', 'chapter_order',
            'has_quiz',
            'is_completed', 'completed_at',
            'best_score',
            'lesson_progresses',
        )

    def get_has_quiz(self, obj):
        return hasattr(obj.chapter, 'quiz')

    def get_lesson_progresses(self, obj):
        lessons = LessonProgress.objects.filter(
            enrollment=obj.enrollment,
            lesson__chapter=obj.chapter,
        ).order_by('lesson__order')
        return LessonProgressSerializer(lessons, many=True).data


class CourseEnrollmentSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title')
    course_id = serializers.IntegerField(source='course.id')
    chapter_progresses = ChapterProgressSerializer(many=True, read_only=True)

    class Meta:
        model = CourseEnrollment
        fields = (
            'id',
            'course_id', 'course_title',
            'status', 'enrolled_at', 'completed_at',
            'progress_percent',
            'chapter_progresses',
        )
        read_only_fields = (
            'status', 'enrolled_at',
            'completed_at', 'progress_percent',
        )


class CourseEnrollmentListSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title')
    course_id = serializers.IntegerField(source='course.id')

    class Meta:
        model = CourseEnrollment
        fields = (
            'id',
            'course_id', 'course_title',
            'status', 'enrolled_at',
            'completed_at', 'progress_percent',
        )


class CourseCertificateSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title')
    course_id = serializers.IntegerField(source='course.id')

    class Meta:
        model = CourseCertificate
        fields = (
            'id',
            'course_id', 'course_title',
            'issued_at', 'certificate_number',
        )