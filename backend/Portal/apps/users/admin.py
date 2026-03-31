from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from .models import Profile, CreatorApplication


class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False


class CustomUserAdmin(UserAdmin):
    inlines = [ProfileInline]
    list_display = ('email', 'first_name', 'last_name', 'get_role', 'is_active', 'date_joined')
    list_filter = ('is_active', 'is_staff', 'profile__role')
    search_fields = ('email', 'first_name', 'last_name')

    def get_role(self, obj):
        return obj.profile.role if hasattr(obj, 'profile') else '—'
    get_role.short_description = 'Роль'


admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)


@admin.register(CreatorApplication)
class CreatorApplicationAdmin(admin.ModelAdmin):
    list_display = ('user', 'status', 'affiliation', 'created_at', 'reviewed_by')
    list_filter = ('status',)
    search_fields = ('user__email', 'affiliation')
