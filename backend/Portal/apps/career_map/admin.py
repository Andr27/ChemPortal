from django.contrib import admin

from .models import Organization, Industry, Direction, Vacancy


class VacancyInline(admin.TabularInline):
    model = Vacancy
    extra = 1
    fields = ('title', 'employment', 'salary', 'contact', 'url', 'is_active')


@admin.register(Industry)
class IndustryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'is_active')
    list_editable = ('is_active',)
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Direction)
class DirectionAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'is_active')
    list_editable = ('is_active',)
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ('name', 'org_type', 'is_active', 'latitude', 'longitude', 'vacancies_count')
    list_filter = ('org_type', 'is_active', 'industries', 'directions')
    list_editable = ('is_active',)
    search_fields = ('name', 'description', 'address')
    filter_horizontal = ('industries', 'directions')
    inlines = [VacancyInline]
    fieldsets = (
        (None, {'fields': ('name', 'org_type', 'description', 'is_active')}),
        ('Классификация', {'fields': ('industries', 'directions')}),
        ('Контакты', {'fields': ('address', 'phone', 'email', 'website', 'photo')}),
        ('Координаты на карте', {
            'fields': ('latitude', 'longitude'),
            'description': 'Найдите место по адресу или поставьте метку на карте — '
                           'координаты заполнятся автоматически.',
        }),
    )

    class Media:
        # Leaflet с CDN + наш пикер координат на карте.
        css = {'all': (
            'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
            'career_map/admin_map_picker.css',
        )}
        js = (
            'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
            'career_map/admin_map_picker.js',
        )

    @admin.display(description='Вакансий')
    def vacancies_count(self, obj):
        return obj.vacancies.count()


@admin.register(Vacancy)
class VacancyAdmin(admin.ModelAdmin):
    list_display = ('title', 'organization', 'employment', 'is_active', 'created_at')
    list_filter = ('is_active', 'employment')
    search_fields = ('title', 'organization__name')
    autocomplete_fields = ('organization',)
