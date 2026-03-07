from rest_framework import viewsets, status
from rest_framework.decorators import action, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import F
from rest_framework.exceptions import PermissionDenied
from django.core.cache import cache

from Portal.mixins import ModeratorMixin, StatusAccessMixin
from Portal.permissions import IsCreator, IsModerator
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

    def get_queryset(self):
        if self.action == 'list':
            return Post.objects.filter(status=ModerationStatus.PUBLISHED, type="article")
        return super().get_queryset()

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
        if action == 'create_and_send_to_moderation':
            serializer.save(author=self.request.user, status=ModerationStatus.MODERATION)
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


    @action(detail=False, methods=['get'])
    def moderation_list(self, request):
        posts = Post.objects.filter(status=ModerationStatus.MODERATION)
        page = self.paginate_queryset(posts)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)


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


        post = Post.objects.get(pk=pk)

        if post.status != ModerationStatus.PUBLISHED:
            user = request.user
            user_role = getattr(getattr(user, "profile", None), "role", None)
            if (not user.is_authenticated) or (
                    post.author != user
                    and user_role not in [UserRole.MODERATOR, UserRole.ADMIN]
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
        Dislike.objects.filter(user=request.user, post=post).delete()
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
        posts = Post.objects.filter(status=ModerationStatus.PUBLISHED, type='news')
        page = self.paginate_queryset(posts)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    @action(detail=False, methods=['get'])
    def videos(self, request):
        posts = Post.objects.filter(status=ModerationStatus.PUBLISHED, type='video')
        page = self.paginate_queryset(posts)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)








class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]

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
