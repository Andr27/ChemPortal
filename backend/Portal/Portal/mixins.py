from django.db.models import Q
from Portal.choices import ModerationStatus, UserRole
from rest_framework.decorators import action, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from Portal.permissions import IsCreator, IsModerator


class StatusAccessMixin:
    owner_field = 'author'
    status_field = 'status'

    def get_base_queryset(self):
        return super().get_queryset()

    def get_queryset(self):
        queryset = self.get_base_queryset()
        user = self.request.user
        #главная страница
        if self.action == 'list':
            return queryset.filter(
                **{self.status_field: ModerationStatus.PUBLISHED}
            )

        if self.action == 'retrieve':
            if not user.is_authenticated:
                return queryset.filter(
                    **{self.status_field: ModerationStatus.PUBLISHED}
                )
            if user.profile.role in [UserRole.MODERATOR, UserRole.ADMIN]:
                return queryset

            return queryset.filter(
                Q(**{self.status_field: ModerationStatus.PUBLISHED}) |
                Q(**{self.owner_field: user})
            )
        #update delete
        if self.action in ['update', 'partial_update', 'destroy']:
            if user.profile.role in [UserRole.MODERATOR, UserRole.ADMIN]:
                return queryset
            return queryset.filter(
                **{self.owner_field: user}
            )
        return queryset


class ModeratorMixin:
    owner_field = 'author'
    status_field = 'status'

    @action(detail=True, methods=['post'], permission_classes=[IsCreator])
    def send_to_moderation(self, request, pk=None):
        obj = get_object_or_404(
            self.get_queryset(),
            pk=pk,
            **{self.owner_field: request.user}
        )
        if getattr(obj, self.status_field) != ModerationStatus.DRAFT:
            return Response({"detail": "Только черновики можно отправить на модерацию"}, status=400)

        setattr(obj, self.status_field, ModerationStatus.MODERATION)
        obj.save()
        return Response({"detail": "Отправлено на модерацию"})

    @action(detail=True, methods=['post'], permission_classes=[IsModerator])
    def approve(self, request, pk=None):
        obj = get_object_or_404(
            self.get_base_queryset().filter(
                status=ModerationStatus.MODERATION
            ),
            pk=pk
        )
        obj.status = ModerationStatus.PUBLISHED
        obj.save()

        return Response({"detail": "Подтверждено"})

    @action(detail=True, methods=['post'], permission_classes=[IsModerator])
    def reject(self, request, pk=None,):
        obj = get_object_or_404(
            self.get_base_queryset().filter(
                status=ModerationStatus.MODERATION
            ),
            pk=pk
        )
        obj.status = ModerationStatus.REJECTED
        obj.save()
        return Response({"detail": "Отклонено"})
