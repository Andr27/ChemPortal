from rest_framework.routers import DefaultRouter
from .views import QuizViewSet
from django.urls import path




router = DefaultRouter()

router.register(r'quizzes', QuizViewSet, basename='quizzes')



urlpatterns = [

] + router.urls