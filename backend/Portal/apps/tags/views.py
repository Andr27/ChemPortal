from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.viewsets import GenericViewSet

from Portal.permissions import IsModerator
from .models import Tag, TagRequest, FavoriteTag
from .serializers import TagSerializer, TagRequestSerializer, TagRequestDetailSerializer
from Portal.pagination import StandardPagination




class TagViewSet(ListModelMixin, RetrieveModelMixin, GenericViewSet):
    queryset = Tag.objects.filter(is_active=True).order_by('name')
    serializer_class = TagSerializer
    lookup_field = 'slug'
    pagination_class = StandardPagination


    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        if self.action in ['requests_list', 'approve_request', 'reject_request']:
            return [IsModerator()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = Tag.objects.filter(is_active=True).order_by('name')
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search)
        return queryset



    @action(detail=True, methods=['post'], url_path='favorite')
    def favorite(self, request, slug=None):
        tag = self.get_object()
        favorite, created = FavoriteTag.objects.get_or_create(
            user=request.user,
            tag=tag,
        )
        if not created:
            favorite.delete()
            return Response({'status': "removed", 'tag': tag.name})

        return Response({'status': "added", 'tag': tag.name})

    @action(detail=False, methods=['get'], url_path='my_favorites')
    def my_favorites(self, request):
        favorites_ids = FavoriteTag.objects.filter(
            user=request.user,
        ).values_list('tag_id', flat=True)

        tags = Tag.objects.filter(id__in=favorites_ids, is_active=True)
        page = self.paginate_queryset(tags)
        serializer = TagSerializer(page, many=True, context={'request': request})
        return Response(serializer.data)


    @action(detail=False, methods=['post'], url_path='suggest')
    def suggest(self, request):
        text = request.data.get('text', '').strip()

        if not text:
            raise ValidationError({'text': "Это обязательное поле"})
        if len(text) < 30:
            raise ValidationError({'text': "Минимум 30 символов"})
        all_tags = list(Tag.objects.filter(is_active=True).values_list('name', flat=True))

        try:
            from .ml import suggest_tags
            suggested_tags = suggest_tags(text=text, all_tags=all_tags, top_n=5, threshold=0.5)
            tags = Tag.objects.filter(name__in=suggested_tags, is_active=True)
            tags_dict = {tag.name: tag for tag in tags}
            sorted_tags = [tags_dict[name] for name in suggested_tags if name in tags_dict]
            serializer = TagSerializer(sorted_tags, many=True, context={'request': request})
            return Response({'tags': serializer.data})
        except Exception as e:
            return Response(
                {'tags': [], 'detail': f'Ошибка модели: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


    @action(detail=False, methods=['post'], url_path='request_tag')
    def request_tag(self, request):
        name = request.data.get('name', '').strip()
        #тег есть
        if Tag.objects.filter(name__iexact=name, is_active=True).exists():
            return Response(
                {'detail': f'Тег "{name}" уже существует'},
                status=status.HTTP_400_BAD_REQUEST
            )
        #не дублирование заявок
        if TagRequest.objects.filter(name__iexact=name, status='pending').exists():
            return Response(
                {'detail': f'Заявка на тег "{name}" уже на рассмотрении.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = TagRequestSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save(requested_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='requests_list')
    def requests_list(self, request):
        status_filter = request.query_params.get('status', 'pending')
        requests = TagRequest.objects.filter(
            status=status_filter,
        ).select_related('requested_by', 'reviewed_by').order_by('-created_at')
        page = self.paginate_queryset(requests)
        serializer = TagRequestDetailSerializer(page, many=True)
        return Response(serializer.data)


    @action(detail=False, methods=['post'], url_path='approve_request')
    def approve_request(self, request):
        request_id = request.data.get('request_id')
        if not request_id:
            raise ValidationError({"request_id": "Это поле обязательное"})

        try:
            tag_request = TagRequest.objects.get(id=request_id, status='pending')
        except TagRequest.DoesNotExist:
            return Response({'detail': 'Заявка не найдена или уже обработана.'}, status=status.HTTP_404_NOT_FOUND)

        from django.utils.text import slugify

        tag, created = Tag.objects.get_or_create(
            name=tag_request.name,
            defaults={'slug': slugify(tag_request.name, allow_unicode=True)}
        )
        if not created:
            tag.is_active = True
            tag.save()

        tag_request.status = 'approved'
        tag_request.reviewed_by = request.user
        tag_request.save()
        from django.core.cache import cache
        cache.delete('tag_embeddings_v1')

        return Response({
            'detail': f'Тег "{tag.name}" добавлен.',
            'tag': TagSerializer(tag, context={'request': request}).data
        })
    @action(detail=False, methods=['post'], url_path='reject_request')
    def reject_request(self, request):
        request_id = request.data.get('request_id')
        if not request_id:
            raise ValidationError({"request_id": "Это поле обязательное"})
        try:
            tag_request = TagRequest.objects.get(id=request_id, status='pending')
        except TagRequest.DoesNotExist:
            return Response({'detail': 'Заявка не найдена или уже обработана.'}, status=status.HTTP_404_NOT_FOUND)
        tag_request.status = 'rejected'
        tag_request.reviewed_by = request.user
        tag_request.review_comment = request.data.get('comment', '')
        tag_request.save()
        return Response({'detail': f'Заявка на тег "{tag_request.name}" отклонена.'})