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
from django.urls import path, include
from apps.posts.views import PostViewSet
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView
from rest_framework.routers import DefaultRouter



router = DefaultRouter()
router.register(r'api/v1/posts', PostViewSet, basename='posts')
urlpatterns = [
    path('admin/', admin.site.urls),
    #jwt
    path('api/v1/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/v1/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    #api
    path("", include(router.urls)),
]


'''
get /api/v1/posts/ - все посты
post /api/v1/posts/ - создать пост
get /api/v1/posts/{id}/ - конкретный пост
delete /api/v1/posts/{id}/ - удалить пост
put /api/v1/posts/{id}/ - изменить пост


post /api/v1/posts/{id}/send_to_moderation/ - отправить на модерацию конкретный пост
post /api/v1/posts/{id}/approve/ - утвердить пост
post /api/v1/posts/{id}/reject/ - отклонить пост


get /api/v1/posts/moderation_list/ - список постов на модерации
get /api/v1/posts/my_posts/ - все посты конкретного автора

'''