from django.utils import timezone

from django.core.mail import send_mail
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.generics import RetrieveAPIView
from rest_framework.mixins import RetrieveModelMixin, ListModelMixin
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import User
from rest_framework.viewsets import GenericViewSet

from Portal.choices import UserRole
from Portal.pagination import StandardPagination
from Portal.permissions import IsModerator
from .serializers import RegistrationSerializer, MeSerializer, PasswordResetSerializer, PasswordResetConfirmSerializer, \
    ProfileSerializer, MeUpdateSerializer, CreatorApplicationSerializer, CreatorApplicationDetailSerializer, CreatorProfileSerializer
from .models import EmailConfirmationToken, PasswordResetToken, PendingUser, CreatorApplication


class RegistrationAPIView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = RegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        if User.objects.filter(email=data['email']).exists():
            return Response({'detail': 'Пользователь с таким email уже существует'}, status=status.HTTP_400_BAD_REQUEST)

        PendingUser.objects.filter(email=data['email']).delete()
        pending = PendingUser.objects.create(
            email=data['email'],
            username=data['email'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            password=make_password(data['password']),
        )



        confirm_url = f"http://147.45.219.171/confirm-email?token={pending.token}"

        send_mail(
            subject="Confirm Email",
            message=f"URL FOR CONFIRM EMAIL:\n\n{confirm_url}",
            from_email="noreply@chemport.com",
            recipient_list=[pending.email],
        )
        return Response(
            {"message": "Письмо подтверждения отправлено на ваш Email"},
            status=status.HTTP_201_CREATED,
        )

class ConfirmEmailAPIView(APIView):
    permission_classes = []

    def post(self, request):
        token = request.data.get("token")
        if not token:
            return Response({"detail": 'Требуется токен'}, status=status.HTTP_400_BAD_REQUEST)

        pending = PendingUser.objects.filter(token=token).first()
        if not pending:
            return Response({"detail": 'Недействительный или уже использованный токен'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=pending.username).exists():
            pending.delete()
            return Response({"detail": "Пользователь уже подтвержден"}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(email=pending.email).exists():
            pending.delete()
            return Response({"detail": "Электронная почта уже используется"}, status=status.HTTP_400_BAD_REQUEST)
        user = User(
            username=pending.username,
            email=pending.email,
            first_name=pending.first_name,
            last_name=pending.last_name,
            is_active=True,
        )
        user.password = pending.password
        user.save()
        pending.delete()
        return Response({"message": "Email подтвержден успешно"}, status=status.HTTP_200_OK)



class MeAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = MeSerializer(request.user)
        return Response(serializer.data)
    def put(self, request):
        serializer = MeUpdateSerializer(
            request.user,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(MeSerializer(request.user).data)


class PasswordResetRequestAPIView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = User.objects.get(email=serializer.validated_data['email'])
        token = PasswordResetToken.objects.create(user=user)

        reset_link = f"http://147.45.219.171/reset-password?token={token.token}"

        send_mail(
            subject="Сброс пароля",
            message=f"URL FOR RESET PASSWORD:\n\n{reset_link}",
            from_email="noreply@chemport.com",
            recipient_list=[user.email],
        )
        return Response({"detail": "Письмо отправлено"})

class PasswordResetConfirmAPIView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token_obj = PasswordResetToken.objects.filter(token=serializer.validated_data['token']).first()
        if not token_obj:
            return Response({"detail": "Неверный токен"}, status=400)

        if token_obj.is_expired():
            token_obj.delete()
            return Response({"detail": "Токен истек"}, status=400)

        user = token_obj.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        token_obj.delete()
        return Response({"detail": "пароль успешно изменен"})

class AuthorProfileAPIView(RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = ProfileSerializer




class CreatorApplicationViewSet(GenericViewSet):
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    def get_queryset(self):
        return CreatorApplication.objects.all()

    @action(detail=False, methods=['post'])
    def apply(self, request):
        if request.user.profile.role in [UserRole.CREATOR, UserRole.ADMIN, UserRole.MODERATOR]:
            return Response(
                {'detail': "Вы уже являетесь создателем контента"}, status=status.HTTP_400_BAD_REQUEST
            )

        existing = CreatorApplication.objects.filter(
            user=request.user,
            status='pending'
        ).first()
        if existing:
            return Response(
                {'detail': 'У вас уже есть заявка на рассмотрении'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = CreatorApplicationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def my_application(self, request):
        try:
            application = CreatorApplication.objects.get(user=request.user)
            serializer = CreatorApplicationSerializer(application)
            return Response(serializer.data)
        except CreatorApplication.DoesNotExist:
            return Response({'detail': 'Заявка не найдена'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'], permission_classes=[IsModerator])
    def applications_list(self, request):
        status_filter = request.query_params.get('status', 'pending')
        applications = CreatorApplication.objects.filter(
            status=status_filter
        ).select_related('user', 'reviewed_by').order_by('-created_at')

        serializer = CreatorApplicationSerializer(applications, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], permission_classes=[IsModerator])
    def applications_detail(self, request, pk=None):
        application = CreatorApplication.objects.get(pk=pk)
        page = self.paginate_queryset(application)
        serializer = CreatorApplicationSerializer(page, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], permission_classes=[IsModerator])
    def approve(self, request):
        application_id = request.data.get('application_id')
        if not application_id:
            raise ValidationError({'application_id': 'Обязательное поле'})
        try:
            application = CreatorApplication.objects.get(id=application_id, status='pending')
        except CreatorApplication.DoesNotExist:
            return Response(
                {'detail': 'Заявка не найдена или уже обработана'},
                status=status.HTTP_404_NOT_FOUND
            )

        profile = application.user.profile
        profile.role = UserRole.CREATOR
        profile.bio = application.bio
        profile.affiliation = application.affiliation
        profile.scientific_interests = application.scientific_interests
        profile.vk_url = application.vk_url
        profile.telegram_url = application.telegram_url
        profile.website_url = application.website_url
        profile.save()


        application.status = 'approved'
        application.reviewed_by = request.user
        application.reviewed_at = timezone.now()
        application.save()

        return Response({'detail': f'Роль Creator выдана пользователю {application.user.email}'})

    @action(detail=False, methods=['post'], permission_classes=[IsModerator])
    def reject(self, request):
        application_id = request.data.get('application_id')
        if not application_id:
            raise ValidationError({'application_id': 'Обязательное поле'})
        try:
            application = CreatorApplication.objects.get(id=application_id, status='pending')
        except CreatorApplication.DoesNotExist:
            return Response(
                {'detail': 'Заявка не найдена или уже обработана'},
                status=status.HTTP_404_NOT_FOUND
            )

        application.status = 'rejected'
        application.reviewed_by = request.user
        application.reviewed_at = timezone.now()
        application.reject_comment = request.data.get('comment', '')
        application.save()
        return Response({"detail": "Заявка отклонена"})



class CreatorProfileViewSet(RetrieveModelMixin, ListModelMixin, GenericViewSet):
    serializer_class = CreatorProfileSerializer

    def get_queryset(self):
        return User.objects.filter(
            profile__role=UserRole.CREATOR
        ).select_related('profile')

    @action(detail=True, methods=['get'])
    def activity(self, request, pk=None):
        from apps.posts.models import Post
        from apps.education.models import Course, EducationSection
        from Portal.choices import ModerationStatus
        from itertools import chain
        import operator

        creator = self.get_object()

        posts = Post.objects.filter(
            author=creator,
            status=ModerationStatus.PUBLISHED
        ).values("id", 'title', 'type', 'created_at').order_by('-created_at')[:10]

        courses = Course.objects.filter(
            created_by=creator,
            status=ModerationStatus.PUBLISHED
        ).values('id', 'title', 'created_at').order_by('-created_at')[:10]

        sections = EducationSection.objects.filter(
            created_by=creator,
            status=ModerationStatus.PUBLISHED
        ).values('id', 'title', 'created_at').order_by('-created_at')[:10]

        activity = []

        for p in posts:
            activity.append({**p, 'activity_type': 'post'})
        for c in courses:
            activity.append({**c, 'activity_type': 'course'})
        for s in sections:
            activity.append({**s, 'activity_type': 'section'})

        activity.sort(key=lambda x:x['created_at'], reverse=True)
        return Response(activity[:20])



