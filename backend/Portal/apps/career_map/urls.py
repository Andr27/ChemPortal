from rest_framework.routers import DefaultRouter

from .views import OrganizationViewSet, IndustryViewSet, DirectionViewSet

router = DefaultRouter()
router.register(r'organizations', OrganizationViewSet, basename='organizations')
router.register(r'industries', IndustryViewSet, basename='industries')
router.register(r'directions', DirectionViewSet, basename='directions')

urlpatterns = router.urls
