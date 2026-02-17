from rest_framework.routers import DefaultRouter
from .views import PostViewSet, CommentViewSet, AllPostsViewSet
from rest_framework_nested.routers import NestedDefaultRouter

router = DefaultRouter()
router.register('posts', PostViewSet, basename='posts')

router_all_posts = DefaultRouter()
router_all_posts.register('all_posts', AllPostsViewSet, basename='all_posts')
comments_router = NestedDefaultRouter(
    router,
    "posts",
    lookup='post',
)

comments_router.register(r'comments', CommentViewSet, basename='post-comments')

urlpatterns = [

] + router.urls + comments_router.urls + router_all_posts.urls