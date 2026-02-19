from django.shortcuts import get_object_or_404
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Post, Comment, Like, Dislike
from .serializers import PostSerializer, CommentSerializer
from rest_framework import generics, viewsets, status
from apps.users.permissions import *
from .pagination import PostAPIListPagination
from apps.bookmarks.models import Bookmark
from django.db.models import Q


class PostViewSet(viewsets.ModelViewSet):
    serializer_class = PostSerializer
    queryset = Post.objects.all()
    permission_classes = [ReadOnlyOrCreator]
    pagination_class = PostAPIListPagination



    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context


    #queryset
    def get_queryset(self):
        user = self.request.user
        if self.action == 'rejected_posts':
            return Post.objects.filter(status='rejected')
        #очередь модерации
        if self.action == 'moderation_list':
            return Post.objects.filter(status='moderation')
        if self.action in ['retrieve', 'update', 'partial_update', 'destroy']:
            if not user.is_authenticated:
                return Post.objects.filter(status='published')
            profile = getattr(user, 'profile', None)
            if profile and profile.role == 'admin':
                return Post.objects.all()
            return Post.objects.filter(Q(status='published') & Q(author=user))
        #главная лента(ток опубликованные)
        return Post.objects.filter(status='published')


    #permissions

    def get_permissions(self):
        if self.action == 'create':
            return [IsCreator()]

        if self.action in ["destroy", "update", "partial_update"]:
            return [IsOwnerOrAdmin()]

        if self.action == "send_to_moderation":
            return [IsCreator()]

        if self.action in ['approve', 'reject', 'moderation_list', 'moderation_detail']:
            return [IsModerator()]


        return super().get_permissions()


    #moderator actions

    @action(detail=True, methods=['post'])
    def send_to_moderation(self, request, pk=None):
        post = get_object_or_404(Post, pk=pk, author=self.request.user)

        if post.status != 'draft':
            return Response(
                {'error': "Only draft posts can be sent to moderation"}, status=400
            )

        post.status = 'moderation'
        post.save()
        return Response({'status': "sent to moderation"})

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        post = get_object_or_404(Post, pk=pk, status='moderation')
        post.status = 'published'
        post.save()
        return Response({'status': "approved post"})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        post = get_object_or_404(Post, pk=pk, status='moderation')
        post.status = 'rejected'
        post.save()
        return Response({'status': "rejected post"})

    @action(detail=False, methods=['get'])
    def moderation_list(self, request):
        posts = Post.objects.filter(status='moderation')
        serializer = self.get_serializer(posts, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def moderation_detail(self, request, pk=None):
        post = Post.objects.filter(pk=pk, status='moderation').first()
        if not post:
            return NotFound("Пост не найден или не находится на модерации")
        serializer = self.get_serializer(post)
        return Response(serializer.data)



    @action(detail=True, methods=['get'])
    def my_posts(self, request):
        posts = Post.objects.filter(author=self.request.user)
        serializer = self.get_serializer(posts, many=True)
        return Response(serializer.data)


    @action(detail=False, methods=['get'], permission_classes=[IsOwnerOrAdmin])
    def rejected_posts(self, request):
        posts = Post.objects.filter(status='rejected')
        serializer = self.get_serializer(posts, many=True)
        return Response(serializer.data)


    @action(detail=False, methods=['get'], permission_classes=[IsCreator])
    def my_posts(self, request):
        posts = Post.objects.filter(author=self.request.user)
        serializer = self.get_serializer(posts, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsCreator])
    def my_rejected_posts(self, request):
        posts = Post.objects.filter(status='rejected', author=self.request.user)
        page = self.paginate_queryset(posts)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(posts, many=True)
        return Response(serializer.data)
    @action(detail=False, methods=['get'], permission_classes=[IsCreator])
    def my_draft_posts(self, request):
        posts = Post.objects.filter(status='draft', author=self.request.user)
        page = self.paginate_queryset(posts)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(posts, many=True)
        return Response(serializer.data)
    @action(detail=False, methods=['get'], permission_classes=[IsCreator])
    def my_published_posts(self, request):
        posts = Post.objects.filter(status='published', author=self.request.user)
        page = self.paginate_queryset(posts)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(posts, many=True)
        return Response(serializer.data)
    @action(detail=False, methods=['get'], permission_classes=[ReadOnlyOrCreator])
    def all_posts(self, request):
        posts = Post.objects.all()
        serializer = self.get_serializer(posts, many=True)
        return Response(serializer.data)
    @action(detail=True, methods=['get'], permission_classes=[ReadOnlyOrCreator])
    def all_posts_detail(self, request, pk=None):
        post = Post.objects.get(pk=pk)
        self.check_object_permissions(request, post)
        serializer = self.get_serializer(post)
        return Response(serializer.data)

    #like
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
        post = self.get_object()
        user = request.user
        Dislike.objects.filter(user=user, post=post).delete()
        like, created = Like.objects.get_or_create(user=user, post=post)
        if not created:
            like.delete()
            return Response({'liked': False}, status=status.HTTP_200_OK)

        return Response({'liked': True}, status=status.HTTP_201_CREATED)
    #dislike
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def dislike(self, request, pk=None):
        post = self.get_object()
        user = request.user
        Like.objects.filter(user=user, post=post).delete()
        dislike, created = Dislike.objects.get_or_create(user=user, post=post)
        if not created:
            dislike.delete()
            return Response({'disliked': False}, status=status.HTTP_200_OK)
        return Response({'disliked': True}, status=status.HTTP_201_CREATED)

    #bookmarks
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def bookmark(self, request, pk=None):
        post = self.get_object()
        bookmark, created = Bookmark.objects.get_or_create(user=request.user, post=post)
        if not created:
            return Response({"detail": "Уже добавлен в закладки"}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"detail": "Пост добавлен в закладки"}, status=status.HTTP_201_CREATED)


    @action(detail=True, methods=['delete'], permission_classes=[IsAuthenticated])
    def unbookmark(self, request, pk=None):
        post = self.get_object()
        deleted, _ = Bookmark.objects.filter(user=request.user, post=post).delete()
        if not deleted:
            return Response({"detail": "Закладка не найдена"}, status=status.HTTP_404_NOT_FOUND)
        return Response({"detail": "Закладка удалена"}, status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def bookmarks(self, request, pk=None):
        posts = Post.objects.filter(bookmarked_by__user=request.user, status='published').distinct()
        serializer = self.get_serializer(posts, many=True)
        return Response(serializer.data)



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






