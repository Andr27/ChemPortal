from django.core.mail import send_mail
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from .serializers import RegistrationSerializer, MeSerializer, PasswordResetSerializer, PasswordResetConfirmSerializer
from .models import EmailConfirmationToken, PasswordResetToken
from django.utils import timezone

class RegistrationAPIView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = RegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        token = EmailConfirmationToken.objects.create(user=user)

        confirm_url = f"http://localhost:3000/api/v1/auth/confirm-email/{token.token}"

        send_mail(
            subject="Confirm Email",
            message=f"URL FOR CONFIRM EMAIL:\n\n{confirm_url}",
            from_email="noreply@chemport.com",
            recipient_list=[user.email],
        )
        return Response(
            {"message": "Confirmation email sent!"},
            status=status.HTTP_201_CREATED,
        )

class ConfirmEmailAPIView(APIView):
    permission_classes = []

    def get(self, request, token):
        confirmation = get_object_or_404(EmailConfirmationToken, token=token)
        user = confirmation.user
        user.is_active = True
        user.save()
        confirmation.delete()

        return Response({"message": "Email confirmed!"}, status=status.HTTP_200_OK)



class MeAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = MeSerializer(request.user)
        return Response(serializer.data)




class PasswordResetRequestAPIView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = User.objects.get(email=serializer.validated_data['email'])
        token = PasswordResetToken.objects.create(user=user)

        reset_link = f"https://localhost:3000/reset-password/{token.token}"

        send_mail(
            subject="Сброс пароля",
            message=f"Перейдите по ссылке для сброса пароля:\n\n{reset_link}",
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