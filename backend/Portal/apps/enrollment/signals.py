from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import CourseEnrollment, LessonProgress, CourseReview
from apps.education.models import Lesson
from django.db.models import Avg
from apps.education.models import EducationSection, Course


@receiver(post_save, sender=CourseEnrollment)
def enrollment_created(sender, instance, created, **kwargs):
    if created:
        profile =  instance.course.created_by.profile
        profile.rating += 5
        profile.save()


@receiver(post_delete, sender=CourseEnrollment)
def enrollment_deleted(sender, instance, **kwargs):
    profile = instance.course.created_by.profile
    profile.rating = max(0, profile.rating - 5)
    profile.save()



@receiver(post_save, sender=Lesson)
def lesson_created(sender, instance, created, **kwargs):
    if not created:
        return

    course = instance.chapter.course
    enrollments = CourseEnrollment.objects.filter(course=course, status='active')
    for enrollment in enrollments:
        LessonProgress.objects.get_or_create(
            enrollment=enrollment,
            lesson=instance,
        )
        enrollment.recalculate_progress()


@receiver(post_delete, sender=Lesson)
def lesson_deleted(sender, instance, **kwargs):
    course = instance.chapter.course
    enrollments = CourseEnrollment.objects.filter(course=course, status='active')
    for enrollment in enrollments:
        LessonProgress.objects.filter(
            enrollment=enrollment,
            lesson=instance,
        ).delete()
        enrollment.recalculate_progress()




@receiver(post_save, sender=CourseReview)
def review_saved(sender, instance, **kwargs):
    course = instance.course
    result = CourseReview.objects.filter(course=course).aggregate(Avg('rating'))
    course.rating = round(result['rating__avg'] or 0, 2)
    course.reviews_count = CourseReview.objects.filter(course=course).count()
    course.save()
    recalculate_section_rating(course.section)


@receiver(post_delete, sender=CourseReview)
def review_deleted(sender, instance, **kwargs):
    course = instance.course
    result = CourseReview.objects.filter(course=course).aggregate(Avg('rating'))
    course.rating = round(result['rating__avg'] or 0, 2)
    course.reviews_count = CourseReview.objects.filter(course=course).count()
    course.save()
    recalculate_section_rating(course.section)



def recalculate_section_rating(section):
    result = Course.objects.filter(
        section=section,
        status='published',
    ).aggregate(Avg('rating'))
    section.rating = round(result['rating__avg'] or 0, 2)
    section.save()