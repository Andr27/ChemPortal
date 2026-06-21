from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.db.models import Count

from rest_framework.exceptions import PermissionDenied
from django.core.cache import cache

from Portal.mixins import ModeratorMixin, StatusAccessMixin
from Portal.permissions import IsCreator, IsModerator, IsExpert
from Portal.choices import ModerationStatus, UserRole


from .models import Post, Comment, Like, Dislike
from .serializers import PostSerializer, CommentSerializer
from .pagination import PostAPIListPagination
from apps.bookmarks.models import Bookmark




class PostViewSet(ModeratorMixin, StatusAccessMixin, viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    pagination_class = PostAPIListPagination

    owner_field = "author"
    status_field = "status"

    def filter_by_teg(self, queryset):
        tag = self.request.query_params.get('tag')
        if tag:
            queryset = queryset.filter(tags__slug=tag)
        return queryset

    def get_queryset(self):
        user = self.request.user

        if self.action == 'list':
            queryset = Post.objects.filter(status=ModerationStatus.PUBLISHED, type="article")
            # Аннотируем счётчик лайков на уровне SQL, чтобы избежать N+1 в сериализаторе.
            # Только ОДНА Count-аннотация по many-relation: две (likes + dislikes) в одном
            # annotate() перемножают JOIN'ы и завышают счётчики (cartesian product).
            return self.filter_by_teg(queryset).annotate(
                likes_count_ann=Count('likes'),
            ).select_related('author__profile').prefetch_related(
                'tags', 'images')
        # Для не-list действий likes/dislikes нужны как полноценные объекты (флаги и т.п.)
        return super().get_queryset().select_related('author__profile').prefetch_related(
            'tags', 'likes', 'dislikes', 'bookmarked_by', 'images'
        )
    def get_serializer_context(self):
        context = super().get_serializer_context()
        user = self.request.user
        if user.is_authenticated:
            context['likes_ids'] = set(
                user.likes.values_list('post_id', flat=True)
            )
            context['dislikes_ids'] = set(
                user.dislikes.values_list('post_id', flat=True)
            )
            context['bookmarks_ids'] = set(
                user.bookmarks.values_list('post_id', flat=True)
            )
            context['subscribed_ids'] = set(
                user.subscriptions.values_list('author_id', flat=True)
            )
        else:
            context['likes_ids'] = set()
            context['dislikes_ids'] = set()
            context['bookmarks_ids'] = set()
            context['subscribed_ids'] = set()
        return context

    #PERMISSIONS

    def get_permissions(self):
        if self.action == 'create':
            return [IsCreator()]
        if self.action in ['approve', 'reject', 'moderation_list']:
            return [IsModerator()]
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return super().get_permissions()



    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


    def perform_update(self, serializer):
        obj = self.get_object()
        user = self.request.user
        if obj.author != user and user.profile.role not in [UserRole.MODERATOR, UserRole.ADMIN]:
            raise PermissionDenied("Вы не автор поста")
        serializer.save(author=self.request.user)

    def perform_destroy(self, instance):
        user = self.request.user
        if instance.author != user and user.profile.role not in [UserRole.MODERATOR, UserRole.ADMIN]:
            raise PermissionDenied("Вы не автор поста")
        instance.delete()

    @action(detail=False, methods=['post'], permission_classes=[IsCreator])
    def create_and_send_to_moderation(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(author=self.request.user, status=ModerationStatus.MODERATION)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


    @action(detail=False, methods=['get'], permission_classes=[IsModerator])
    def moderation_list(self, request):
        posts = Post.objects.filter(status=ModerationStatus.MODERATION)
        page = self.paginate_queryset(posts)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)
    @action(detail=True, methods=['post'], permission_classes=[IsModerator])
    def reject(self, request, pk=None):
        obj = get_object_or_404(
            self.get_base_queryset().filter(status=ModerationStatus.MODERATION),
            pk=pk
        )
        obj.status = ModerationStatus.REJECTED
        obj.reject_comment = request.data.get('comment', '')
        obj.save()
        return Response({'detail': "Отклонено"})


    @action(detail=False, methods=['get'], permission_classes=[IsCreator])
    def my_posts(self, request):
        posts = Post.objects.filter(author=self.request.user)
        page = self.paginate_queryset(posts)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsCreator])
    def my_draft_posts(self, request):
        posts = Post.objects.filter(status=ModerationStatus.DRAFT, author=self.request.user)
        page = self.paginate_queryset(posts)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsCreator])
    def my_rejected_posts(self, request):
        posts = Post.objects.filter(status=ModerationStatus.REJECTED, author=self.request.user)
        page = self.paginate_queryset(posts)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsCreator])
    def my_published_posts(self, request):
        posts = Post.objects.filter(status=ModerationStatus.PUBLISHED, author=self.request.user)
        page = self.paginate_queryset(posts)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    @action(detail=True, methods=['get'])
    def all_posts_detail(self, request, pk=None):

        post = Post.objects.select_related(
            'author__profile'
        ).prefetch_related(
            'tags', 'likes', 'dislikes', 'bookmarked_by', 'images'
        ).get(pk=pk)

        if post.status != ModerationStatus.PUBLISHED:
            user = request.user
            user_role = getattr(getattr(user, "profile", None), "role", None)
            if (not user.is_authenticated) or (
                    post.author != user
                    and user_role not in [UserRole.MODERATOR, UserRole.ADMIN, UserRole.EXPERT]
            ):
                raise PermissionDenied("У вас нет доступа к этому посту")


        if post.status == ModerationStatus.PUBLISHED:

            if request.user.is_authenticated:
                user_part = f"user_{request.user.id}"
            else:
                ip = request.META.get('REMOTE_ADDR')
                user_part = f"ip_{ip}"

            view_key = f"post_view:{post.id}:{user_part}"
            buffer_key = f"post_views_buffer:{post.id}"

            already_viewed = cache.get(view_key)

            if not already_viewed:

                if cache.get(buffer_key) is None:
                    cache.set(buffer_key, 0, timeout=None)

                cache.incr(buffer_key)

                cache.set(view_key, True, timeout=86400)

        self.check_object_permissions(request, post)
        serializer = self.get_serializer(post)
        return Response(serializer.data)


    #LIKE

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
        post = self.get_object()
        Dislike.objects.filter(user=request.user, post=post).delete()
        like, created = Like.objects.get_or_create(user=request.user, post=post)
        if not created:
            like.delete()
            return Response({"liked": False}, status=status.HTTP_200_OK)
        return Response({"liked": True}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def dislike(self, request, pk=None):
        post = self.get_object()
        Like.objects.filter(user=request.user, post=post).delete()
        dislike, created = Dislike.objects.get_or_create(user=request.user, post=post)
        if not created:
            dislike.delete()
            return Response({"disliked": False}, status=status.HTTP_200_OK)
        return Response({"disliked": True}, status=status.HTTP_201_CREATED)



    #bookmarks
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def bookmark(self, request, pk=None):
        post = self.get_object()
        bookmark, created = Bookmark.objects.get_or_create(user=request.user, post=post)
        if not created:
            return Response({"detail": "Уже добавлено в закладки"}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"detail": "Добавлено в закладки"}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def unbookmark(self, request, pk=None):
        post = self.get_object()
        deleted, _ = Bookmark.objects.filter(user=request.user, post=post).delete()
        if not deleted:
            return Response({"detail": "Закладка не найдена"}, status=status.HTTP_404_NOT_FOUND)
        return Response({"detail": "Закладка удалена"}, status=status.HTTP_204_NO_CONTENT)
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def bookmarks(self, request, pk=None):
        posts = Post.objects.filter(bookmarked_by__user=request.user, status=ModerationStatus.PUBLISHED)
        page = self.paginate_queryset(posts)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)


    #получить только тип постов
    @action(detail=False, methods=['get'])
    def news(self, request):
        queryset  = Post.objects.filter(status=ModerationStatus.PUBLISHED, type='news')
        queryset = self.filter_by_teg(queryset)
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    @action(detail=False, methods=['get'])
    def videos(self, request):
        queryset  = Post.objects.filter(status=ModerationStatus.PUBLISHED, type='video')
        queryset = self.filter_by_teg(queryset)
        page = self.paginate_queryset(queryset )
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def feed(self, request):
        from apps.subscriptions.models import Subscription
        from apps.tags.models import FavoriteTag

        type_of_posts = request.query_params.get('type')
        tag = request.query_params.get('tag')

        # ====================== НЕАВТОРИЗОВАННЫЙ ПОЛЬЗОВАТЕЛЬ ======================
        if not request.user.is_authenticated:
            queryset = Post.objects.filter(
                status=ModerationStatus.PUBLISHED,
            )
            if type_of_posts:
                queryset = queryset.filter(type=type_of_posts)
            if tag:
                queryset = queryset.filter(tags__slug=tag)

            queryset = self.filter_by_teg(queryset)  # твоя существующая функция
            page = self.paginate_queryset(queryset)
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        # ====================== АВТОРИЗОВАННЫЙ ПОЛЬЗОВАТЕЛЬ ======================
        subscribed_authors = Subscription.objects.filter(
            user=request.user,
        ).values_list('author_id', flat=True)

        favorite_tags = FavoriteTag.objects.filter(
            user=request.user,
        ).values_list('tag_id', flat=True)

        # Если у пользователя нет ни подписок, ни любимых тегов — сразу показываем всё
        if not subscribed_authors and not favorite_tags:
            queryset = Post.objects.filter(
                status=ModerationStatus.PUBLISHED,
            )
            if type_of_posts:
                queryset = queryset.filter(type=type_of_posts)
            if tag:
                queryset = queryset.filter(tags__slug=tag)

            queryset = self.filter_by_teg(queryset)
            page = self.paginate_queryset(queryset)
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        # Персонализированная лента
        posts_from_subscriptions = Post.objects.filter(
            author_id__in=subscribed_authors,
            status=ModerationStatus.PUBLISHED,
        )

        posts_from_tags = Post.objects.filter(
            tags__id__in=favorite_tags,
            status=ModerationStatus.PUBLISHED,
        )

        personalized = (posts_from_subscriptions | posts_from_tags).distinct()

        personalized_ids = personalized.values_list('id', flat=True)

        rest = Post.objects.filter(
            status=ModerationStatus.PUBLISHED,
        ).exclude(id__in=personalized_ids)


        if tag:
            personalized = personalized.filter(tags__slug=tag)
            rest = rest.filter(tags__slug=tag)

        if type_of_posts:
            personalized = personalized.filter(type=type_of_posts)
            rest = rest.filter(type=type_of_posts)

        from itertools import chain
        combined = list(chain(
            personalized.order_by('-created_at'),
            rest.order_by('-created_at'),
        ))

        page = self.paginate_queryset(combined)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    @action(detail=True, methods=['get'], permission_classes=[IsModerator])
    def ai_analyze(self, request, pk=None):
        post = self.get_object()
        from apps.search.ai_moderation import analyze_context
        result = analyze_context(post.title, post.body or '')
        return Response(
            {
                "post_id": post.id,
                "post_title": post.title,
                **result,
            }
        )



    @action(detail=True, methods=['post'], permission_classes=[IsExpert])
    def expert_vote(self, request, pk=None):
        from apps.education.expert_moderation import process_vote
        post = self.get_object()
        if post.status != ModerationStatus.MODERATION:
            return Response({'detail': 'Пост не на модерации'}, status=400)
        vote = request.data.get('vote')
        if vote not in ['approve', 'reject']:
            return Response({'detail': 'vote: approve / reject'}, status=400)
        result = process_vote(post, request.user, vote, request.data.get('comment', ''))
        return Response(result)

    @action(detail=True, methods=['get'], permission_classes=[IsExpert])
    def expert_reviews(self, request, pk=None):
        from apps.education.expert_moderation import get_votes
        post = self.get_object()
        votes = get_votes(post)
        return Response({
            'post_id': post.id,
            'status': post.status,
            'votes': {
                'approve': votes['approve'],
                'reject': votes['reject'],
                'total': votes['total'],
            },
            'reviews': [
                {
                    'expert': {
                        'id': r.expert.id,
                        'first_name': r.expert.first_name,
                        'last_name': r.expert.last_name,
                    },
                    'vote': r.vote,
                    'comment': r.comment,
                    'created_at': r.created_at,
                }
                for r in votes['reviews']
            ]
        })

    @action(detail=False, methods=['get'], permission_classes=[IsExpert])
    def expert_queue(self, request):
        from django.contrib.contenttypes.models import ContentType
        from apps.education.models import ExpertReview
        ct = ContentType.objects.get_for_model(Post)
        voted_ids = ExpertReview.objects.filter(
            content_type=ct, expert=request.user
        ).values_list('object_id', flat=True)
        posts = Post.objects.filter(
            status=ModerationStatus.MODERATION
        ).exclude(id__in=voted_ids).select_related('author__profile')
        page = self.paginate_queryset(posts)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)

class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer



    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]


    def get_queryset(self):
        post_id = self.kwargs["post_pk"]
        post = get_object_or_404(Post, id=post_id, status='published')
        if self.action == 'list':
            return Comment.objects.filter(post=post, parent__isnull=True).prefetch_related("children")
        return Comment.objects.filter(post=post)

    def perform_create(self, serializer):
        post_id = self.kwargs["post_pk"]
        post = get_object_or_404(Post, id=post_id, status='published')
        parent_id = self.request.data.get("parent")
        parent = None

        if parent_id:
            parent = get_object_or_404(Comment, id=parent_id, post=post)

        serializer.save(author=self.request.user, post=post, parent=parent)

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.text = "[comment deleted]"
        instance.save()





#all_posts_detail
#posts
#my_posts
#my_reject_posts
#my_draft_posts
#my_publish
