from django.contrib import admin
from .models import EducationSection, Course


@admin.register(EducationSection)
class PostAdmin(admin.ModelAdmin):
    list_display = [
        'title',
        "description",
        "created_at",
        "status",
        "created_by"
        ]
    list_filter = ["title", "created_by", "description", "created_at", "status"]


@admin.register(Course)
class PostAdmin(admin.ModelAdmin):
    list_display = [
        'title',
        "description",
        "created_at",
        "status",
        "created_by",
        'section'
    ]
    list_filter = ["title", "created_by", "section", "status"]


