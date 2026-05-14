from django.db.models.signals import post_save
from django.dispatch import receiver
from Portal.choices import ModerationStatus





@receiver(post_save, sender='posts.Post')
def post_published(sender, instance, **kwargs):
    if instance.status == ModerationStatus.PUBLISHED:
        from .tasks import generate_post_embedding
        generate_post_embedding.delay(instance.id)




@receiver(post_save, sender='education.Course')
def course_published(sender, instance, **kwargs):
    if instance.status == ModerationStatus.PUBLISHED:
        from .tasks import generate_course_embedding
        generate_course_embedding.delay(instance.id)

@receiver(post_save, sender='education.EducationSection')
def section_published(sender, instance, **kwargs):
    if instance.status == ModerationStatus.PUBLISHED:
        from .tasks import generate_sections_embedding
        generate_sections_embedding.delay(instance.id)

