from django.contrib import admin
from .models import PostEmbedding, CourseEmbedding, SectionEmbedding


class ReadOnlyEmbeddingAdmin(admin.ModelAdmin):
    """Эмбеддинги генерируются ИИ автоматически — в админке только для просмотра."""
    list_display = ('id', '_target', 'updated_at')
    readonly_fields = ('updated_at',)
    list_per_page = 50
    target_field = None

    @admin.display(description='Объект')
    def _target(self, obj):
        return getattr(obj, self.target_field, None)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(PostEmbedding)
class PostEmbeddingAdmin(ReadOnlyEmbeddingAdmin):
    target_field = 'post'
    search_fields = ('post__title',)


@admin.register(CourseEmbedding)
class CourseEmbeddingAdmin(ReadOnlyEmbeddingAdmin):
    target_field = 'course'
    search_fields = ('course__title',)


@admin.register(SectionEmbedding)
class SectionEmbeddingAdmin(ReadOnlyEmbeddingAdmin):
    target_field = 'section'
    search_fields = ('section__title',)
