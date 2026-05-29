from django.contrib import admin
from .models import CourseEnrollment, ChapterProgress, LessonProgress, CourseCertificate


class ChapterProgressInline(admin.TabularInline):
    model = ChapterProgress
    extra = 0
    readonly_fields = ('completed_at',)


class LessonProgressInline(admin.TabularInline):
    model = LessonProgress
    extra = 0
    readonly_fields = ('completed_at',)


@admin.register(CourseEnrollment)
class CourseEnrollmentAdmin(admin.ModelAdmin):
    list_display = ('user', 'course', 'status', 'progress_percent', 'enrolled_at')
    list_filter = ('status', 'enrolled_at')
    search_fields = ('user__email', 'course__title')
    readonly_fields = ('enrolled_at', 'completed_at', 'progress_percent')
    inlines = [ChapterProgressInline, LessonProgressInline]


@admin.register(CourseCertificate)
class CourseCertificateAdmin(admin.ModelAdmin):
    list_display = ('user', 'course', 'certificate_number', 'issued_at')
    search_fields = ('user__email', 'course__title', 'certificate_number')
    readonly_fields = ('issued_at', 'certificate_number')