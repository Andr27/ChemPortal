from django.shortcuts import render, get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Post
from .serializers import PostSerializer
from rest_framework import generics, viewsets
from apps.users.permissions import *









class PostViewSet(viewsets.ModelViewSet):
    serializer_class = PostSerializer
    queryset = Post.objects.all()
    permission_classes = [ReadOnlyOrCreator]

    #queryset

    def get_queryset(self):
        #очередь модерации
        if self.action == 'moderation_list':
            return Post.objects.filter(status='moderation')

        #главная лента(ток опубликованные)
        return Post.objects.filter(status='published')


    #permissions

    def get_permissions(self):
        if self.action == 'create':
            return [IsCreator()]

        if self.action in ["update", "partial_update", "destroy"]:
            return [IsOwnerOrAdmin()]

        if self.action == "send_to_moderation":
            return [IsCreator()]

        if self.action in ['approve', 'reject', 'moderation_list']:
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
    def my_posts(self, request):
        posts = Post.objects.filter(author=self.request.user)
        serializer = self.get_serializer(posts, many=True)
        return Response(serializer.data)






