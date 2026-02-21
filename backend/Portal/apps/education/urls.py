from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import EducationSectionViewSet, SectionMaterialViewSet, CourseViewSet, CourseModuleViewSet
from rest_framework_nested import routers

router = DefaultRouter()
router.register(r'education/sections', EducationSectionViewSet, basename='sections')

#Section -> Materials
sections_router = routers.NestedDefaultRouter(
    router,
    r'education/sections',
    lookup='section'
)

sections_router.register(
    r'materials',
    SectionMaterialViewSet,
    basename='section-materials'
)

sections_router.register(
    r'courses',
    CourseViewSet,
    basename='section-courses'
)

 #Course -> Modules
courses_router = routers.NestedDefaultRouter(
    sections_router,
    r'courses',
    lookup='course'
)

courses_router.register(
    r'modules',
    CourseModuleViewSet,
    basename='course-modules'
)

urlpatterns = [

]+ router.urls + sections_router.urls + courses_router.urls

