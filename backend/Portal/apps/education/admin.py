from django.contrib import admin
from .models import EducationSection, SectionMaterial, Course, Chapter, Lesson, SectionMaterialImage


class SectionMaterialInline(admin.TabularInline):
    model = SectionMaterial
    extra = 0

class SectionMaterialImageInline(admin.TabularInline):
    model = SectionMaterialImage
    extra = 1

class ChapterInline(admin.TabularInline):
    model = Chapter
    extra = 0
    fields = ('title', 'order')


class LessonInline(admin.TabularInline):
    model = Lesson
    extra = 0
    fields = ('title', 'type', 'order')


@admin.register(EducationSection)
class EducationSectionAdmin(admin.ModelAdmin):
    list_display = ('title', 'created_by', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('title', 'created_by__email')
    readonly_fields = ('created_at',)
    inlines = [SectionMaterialInline]


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('title', 'section', 'created_by', 'status', 'chapters_count', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('title', 'created_by__email')
    readonly_fields = ('created_at',)
    inlines = [ChapterInline]

    def chapters_count(self, obj):
        return obj.chapters.count()
    chapters_count.short_description = 'Глав'


@admin.register(Chapter)
class ChapterAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'order', 'lessons_count')
    search_fields = ('title', 'course__title')
    inlines = [LessonInline]

    def lessons_count(self, obj):
        return obj.lessons.count()
    lessons_count.short_description = 'Уроков'


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ('title', 'chapter', 'type', 'order')
    list_filter = ('type',)
    search_fields = ('title', 'chapter__title')

@admin.register(SectionMaterial)
class SectionMaterialAdmin(admin.ModelAdmin):
    inlines = [SectionMaterialImageInline]