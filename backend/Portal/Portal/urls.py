"""
URL configuration for Portal project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from apps.posts.views import PostAPIList, PostAPI, PostAPICreate, PostAPIDestroy, PostAPIUpdate
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView

urlpatterns = [
    path('admin/', admin.site.urls),
    #jwt
    path('api/v1/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/v1/token/verify/', TokenVerifyView.as_view(), name='token_verify'),

    #api для постов
    #список постов
    path('api/v1/post/', PostAPIList.as_view()),
    #конкретный пост
    path('api/v1/post/<int:pk>/', PostAPI.as_view()),
    #создать пост
    path('api/v1/post/create/', PostAPICreate.as_view()),
    #удалить пост
    path('api/v1/post/delete/<int:pk>/', PostAPIDestroy.as_view()),
    #обновить пост
    path('api/v1/post/update/<int:pk>/', PostAPIUpdate.as_view()),
]
