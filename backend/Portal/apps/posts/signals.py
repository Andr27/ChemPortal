from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import F

from .models import Like, Dislike, Comment
from apps.users.models import Profile




@receiver(post_save, sender=Like)
def like_create(sender, instance, created, **kwargs):
    if created:
        Profile.objects.filter(
            pk=instance.post.author.profile.pk
        ).update(
            rating=F('rating') + 2
        )





@receiver(post_delete, sender=Like)
def like_delete(sender, instance, **kwargs):
    Profile.objects.filter(
        pk=instance.post.author.profile.pk
    ).update(
        rating=F('rating') - 2
    )

@receiver(post_save, sender=Dislike)
def dislike_create(sender, instance, created, **kwargs):
    Profile.objects.filter(
        pk=instance.post.author.profile.pk
    ).update(
        rating=F('rating') - 1
    )


@receiver(post_delete, sender=Dislike)
def dislike_delete(sender, instance, **kwargs):
    Profile.objects.filter(
        pk=instance.post.author.profile.pk
    ).update(
        rating=F('rating') + 1
    )




@receiver(post_save, sender=Comment)
def comment_create(sender, instance, created, **kwargs):
    if created and not instance.is_deleted:
        Profile.objects.filter(
            pk=instance.post.author.profile.pk
        ).update(
            rating=F('rating') + 1
        )



