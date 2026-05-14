from rest_framework.routers import DefaultRouter
from .views import CourseEnrollmentViewSet

router = DefaultRouter()
router.register(r'enrollments', CourseEnrollmentViewSet, basename='enrollments')

urlpatterns = router.urls