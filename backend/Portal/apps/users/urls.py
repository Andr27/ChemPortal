from django.urls import path
from .views import RegistrationAPIView, MeAPIView, ConfirmEmailAPIView, PasswordResetConfirmAPIView, \
    PasswordResetRequestAPIView, AuthorProfileAPIView, CreatorProfileViewSet, CreatorApplicationViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'creator-applications', CreatorApplicationViewSet, basename='creator-applications')
router.register(r'creators', CreatorProfileViewSet, basename='creators')



urlpatterns = [

    path('register/', RegistrationAPIView.as_view()), # post
    path('confirm-email/', ConfirmEmailAPIView.as_view()), #post
    path('me/', MeAPIView.as_view()), #get
    path("password-reset/", PasswordResetRequestAPIView.as_view()), #post
    path("password-reset/confirm/", PasswordResetConfirmAPIView.as_view()), #post
    path("authors/<int:pk>/", AuthorProfileAPIView.as_view()),
] + router.urls


