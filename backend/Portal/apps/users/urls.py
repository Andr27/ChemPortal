from django.urls import path


from .views import RegistrationAPIView, MeAPIView, ConfirmEmailAPIView


urlpatterns = [
    path('register/', RegistrationAPIView.as_view()),
    path('confirm-email/<uuid:token>/', ConfirmEmailAPIView.as_view()),
    path('me/', MeAPIView.as_view()),
]