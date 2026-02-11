from django.contrib import admin

from apps.posts.models import Post


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


