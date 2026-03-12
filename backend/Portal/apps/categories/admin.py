from django.contrib import admin
from .models import Category


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'order', 'is_active', 'sections_count', 'courses_count')
    list_editable = ('order', 'is_active')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)

    def sections_count(self, obj):
        return obj.sections.count()
    sections_count.short_description = 'Разделов'

    def courses_count(self, obj):
        from apps.education.models import Course
        return Course.objects.filter(
            section__category=obj,
            status='published'
        ).count()
    courses_count.short_description = 'Курсов'