from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import CourseEnrollment



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


