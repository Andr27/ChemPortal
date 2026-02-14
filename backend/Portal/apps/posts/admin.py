from django.contrib import admin

from apps.posts.models import Post, Comment


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = [
        'type',
        'title',
        "author",
        "created_at",
        "status"
        ]
    list_filter = ["type", "author", "created_at", "status"]


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = [
        'text',
        'author',
        'created_at',
        'parent_id',
        'parent'
    ]

