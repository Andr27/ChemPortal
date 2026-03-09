from django.contrib import admin
from .models import Post, Comment, Like, Dislike, PostImage


class PostImageInline(admin.TabularInline):
    model = PostImage
    extra = 0


class CommentInline(admin.TabularInline):
    model = Comment
    extra = 0
    fields = ('author', 'text', 'is_deleted', 'created_at')
    readonly_fields = ('created_at',)


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('title', 'type', 'author', 'status', 'views', 'likes_count', 'created_at')
    list_filter = ('status', 'type', 'created_at')
    search_fields = ('title', 'body', 'author__email')
    readonly_fields = ('views', 'created_at')
    inlines = [PostImageInline, CommentInline]
    date_hierarchy = 'created_at'
    list_per_page = 25

    def likes_count(self, obj):
        return obj.likes.count()
    likes_count.short_description = 'Лайки'


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('id', 'author', 'post', 'is_deleted', 'created_at')
    list_filter = ('is_deleted', 'created_at')
    search_fields = ('text', 'author__email')
    readonly_fields = ('created_at',)