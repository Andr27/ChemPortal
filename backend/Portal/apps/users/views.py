from django.core.mail import send_mail
from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import User
from .serializers import RegistrationSerializer, MeSerializer, PasswordResetSerializer, PasswordResetConfirmSerializer, \
    ProfileSerializer, MeUpdateSerializer
from .models import EmailConfirmationToken, PasswordResetToken, PendingUser, Profile


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



        confirm_url = f"http://localhost:3000/confirm-email?token={pending.token}"

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

        reset_link = f"http://localhost:3000/reset-password?token={token.token}"

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