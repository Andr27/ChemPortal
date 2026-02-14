from django.urls import path


from .views import RegistrationAPIView, MeAPIView, ConfirmEmailAPIView


urlpatterns = [

    path('register/', RegistrationAPIView.as_view()), # post
    path('confirm-email/<uuid:token>/', ConfirmEmailAPIView.as_view()), #get
    path('me/', MeAPIView.as_view()), #get
]


