from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers
from .views import (
    EducationSectionViewSet, SectionMaterialViewSet,
    CourseViewSet, ChapterViewSet, LessonViewSet, GlobalCourseViewSet,
)

router = DefaultRouter()
router.register(r'education/sections', EducationSectionViewSet, basename='sections')
router.register(r'education/courses', GlobalCourseViewSet, basename='global-courses')

# Section → Materials, Courses
sections_router = routers.NestedDefaultRouter(
    router,
    r'education/sections',
    lookup='section'
)
sections_router.register(r'materials', SectionMaterialViewSet, basename='section-materials')
sections_router.register(r'courses', CourseViewSet, basename='section-courses')

# Course → Chapters
courses_router = routers.NestedDefaultRouter(
    sections_router,
    r'courses',
    lookup='course'
)
courses_router.register(r'chapters', ChapterViewSet, basename='course-chapters')

# Chapter → Lessons
chapters_router = routers.NestedDefaultRouter(
    courses_router,
    r'chapters',
    lookup='chapter'
)
chapters_router.register(r'lessons', LessonViewSet, basename='chapter-lessons')



urlpatterns = (
    router.urls +
    sections_router.urls +
    courses_router.urls +
    chapters_router.urls

)