from django.contrib.admin import action
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from django.contrib.auth.models import User
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Subscription
from .serializers import SubscriptionSerializer



class SubscriptionViewSet(ModelViewSet):
    serializer_class = SubscriptionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        #мои подписки!!!
        return Subscription.objects.filter(user=self.request.user)


    def perform_create(self, serializer):
        author = serializer.validated_data['author']
        user = self.request.user

        if user == author:
            raise ValidationError('Нельзя подписаться на самого себя')

        if author.profile.role not in {"creator", "admin", "moderator"}:
            raise ValidationError("Можно подписаться только на авторов")

        if Subscription.objects.filter(user=user, author=author).exists():
            raise ValidationError("Вы уже подписаны на этого автора")

        serializer.save(user=user)


    @action(detail=False, methods=["post"])
    def unsubscribe(self, request):
        author_id = request.data.get('author')

        if not author_id:
            return Response({"detail": "Требуется автор"}, status=400)

        deleted, _ = Subscription.objects.filter(user=request.user, author=author_id).delete()
        if deleted == 0:
            return Response({"detail": "Вы не подписаны на этого автора"}, status=400)

        return Response({"detail": "Вы отписались"})

