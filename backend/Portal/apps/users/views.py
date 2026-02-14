from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from .serializers import RegistrationSerializer, MeSerializer
from .models import EmailConfirmationToken



class RegistrationAPIView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = RegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        token = EmailConfirmationToken.objects.create(user=user)

        confirm_url = f"http://127.0.0.1:7000/api/v1/auth/confirm-email/{token.token}"

        print('\n' + '=' * 50)
        print("Confirm Email url:")
        print(confirm_url)
        print('=' * 50 + "\n")
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