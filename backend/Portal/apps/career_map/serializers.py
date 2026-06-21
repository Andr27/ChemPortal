from rest_framework import serializers

from .models import Organization, Industry, Direction, Vacancy


class IndustrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Industry
        fields = ('id', 'name', 'slug')


class DirectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Direction
        fields = ('id', 'name', 'slug')


class VacancySerializer(serializers.ModelSerializer):
    class Meta:
        model = Vacancy
        fields = (
            'id', 'title', 'description', 'requirements',
            'employment', 'salary', 'contact', 'url',
        )


class OrganizationListSerializer(serializers.ModelSerializer):
    """Лёгкий сериализатор для отрисовки меток на карте (без тяжёлых полей)."""
    org_type_display = serializers.CharField(source='get_org_type_display', read_only=True)
    industries = serializers.SlugRelatedField(slug_field='slug', many=True, read_only=True)
    directions = serializers.SlugRelatedField(slug_field='slug', many=True, read_only=True)
    vacancies_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Organization
        fields = (
            'id', 'name', 'slug', 'org_type', 'org_type_display',
            'latitude', 'longitude', 'industries', 'directions',
            'vacancies_count',
        )


class OrganizationDetailSerializer(serializers.ModelSerializer):
    """Полная карточка метки: описание, контакты, фото, вакансии."""
    org_type_display = serializers.CharField(source='get_org_type_display', read_only=True)
    industries = IndustrySerializer(many=True, read_only=True)
    directions = DirectionSerializer(many=True, read_only=True)
    vacancies = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = (
            'id', 'name', 'slug', 'org_type', 'org_type_display',
            'description', 'address', 'phone', 'email', 'website', 'photo',
            'latitude', 'longitude', 'industries', 'directions',
            'vacancies', 'created_at',
        )

    def get_vacancies(self, obj):
        active = obj.vacancies.filter(is_active=True)
        return VacancySerializer(active, many=True, context=self.context).data


class OrganizationWriteSerializer(serializers.ModelSerializer):
    """Сериализатор для создания/обновления меток (админ). M2M по id."""
    industries = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Industry.objects.all(), required=False,
    )
    directions = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Direction.objects.all(), required=False,
    )

    class Meta:
        model = Organization
        fields = (
            'id', 'name', 'slug', 'org_type', 'description',
            'address', 'phone', 'email', 'website', 'photo',
            'latitude', 'longitude', 'industries', 'directions', 'is_active',
        )
        read_only_fields = ('slug',)
