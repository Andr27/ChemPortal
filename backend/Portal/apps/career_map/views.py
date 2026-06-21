from rest_framework import viewsets, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db.models import Count, Q

from Portal.permissions import IsAdmin
from .models import Organization, Industry, Direction, OrganizationType
from .serializers import (
    OrganizationListSerializer,
    OrganizationDetailSerializer,
    OrganizationWriteSerializer,
    IndustrySerializer,
    DirectionSerializer,
)


class OrganizationViewSet(viewsets.ModelViewSet):
    """
    Метки профориентационного навигатора.

    Чтение (карта, карточки) — публично. CRUD меток — только администратор
    (Модуль 5 ТЗ: «полный цикл CRUD для всех сущностей, в т.ч. метки»).

    Фильтрация (ТЗ: «по типу, направлению и отраслям»):
      ?type=enterprise            — по типу организации
      ?industry=neftehimiya       — по slug отрасли (можно несколько: ?industry=a&industry=b)
      ?direction=nanomaterialy    — по slug направления (можно несколько)
      ?search=ТОГУ                — по названию
    """
    lookup_field = 'slug'

    def get_permissions(self):
        if self.action in ('list', 'retrieve', 'types'):
            return [AllowAny()]
        return [IsAdmin()]

    def get_serializer_class(self):
        if self.action == 'list':
            return OrganizationListSerializer
        if self.action in ('create', 'update', 'partial_update'):
            return OrganizationWriteSerializer
        return OrganizationDetailSerializer

    def get_queryset(self):
        qs = Organization.objects.all()

        # Для публичного чтения отдаём только активные метки.
        if self.action in ('list', 'retrieve'):
            qs = qs.filter(is_active=True)

        params = self.request.query_params

        org_type = params.get('type')
        if org_type:
            qs = qs.filter(org_type=org_type)

        industries = params.getlist('industry')
        if industries:
            qs = qs.filter(industries__slug__in=industries)

        directions = params.getlist('direction')
        if directions:
            qs = qs.filter(directions__slug__in=directions)

        search = params.get('search')
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(description__icontains=search))

        qs = qs.prefetch_related('industries', 'directions')

        if self.action == 'list':
            # Считаем активные вакансии без N+1. distinct=True обязателен:
            # при фильтрации по отрасли/направлению добавляются JOIN'ы по M2M,
            # которые иначе размножили бы счётчик (cartesian product).
            qs = qs.annotate(
                vacancies_count=Count('vacancies', filter=Q(vacancies__is_active=True), distinct=True)
            )
        else:
            qs = qs.prefetch_related('vacancies')

        # distinct нужен из-за JOIN'ов по M2M при фильтрации.
        return qs.distinct()

    @action(detail=False, methods=['get'])
    def types(self, request):
        """Справочник типов меток для построения фильтра на фронте."""
        return Response([
            {'value': value, 'label': label}
            for value, label in OrganizationType.choices
        ])


class IndustryViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """Справочник отраслей (для фильтра). Чтение публично, CRUD — через админку."""
    serializer_class = IndustrySerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'

    def get_queryset(self):
        return Industry.objects.filter(is_active=True)


class DirectionViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """Справочник направлений (для фильтра). Чтение публично, CRUD — через админку."""
    serializer_class = DirectionSerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'

    def get_queryset(self):
        return Direction.objects.filter(is_active=True)
