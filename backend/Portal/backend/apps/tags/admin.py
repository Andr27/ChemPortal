from django.contrib import admin
from .models import Tag, FavoriteTag, TagRequest


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}


@admin.register(TagRequest)
class TagRequestAdmin(admin.ModelAdmin):
    list_display = ('name', 'requested_by', 'status', 'created_at', 'reviewed_by')
    list_filter = ('status',)
    search_fields = ('name',)


@admin.register(FavoriteTag)
class FavoriteTagAdmin(admin.ModelAdmin):
    list_display = ('user', 'tag', 'created_at')