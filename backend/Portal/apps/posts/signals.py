from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import F
from django.contrib.postgres.search import SearchVector

from .models import Like, Dislike, Comment, Post
from apps.users.models import Profile


# ---------------------------------------------------------------------------
# Обновление предрасчитанного search_vector для полнотекстового поиска.
# Вместо вычисления SearchVector в рантайме на каждый запрос — один раз при save.
# ---------------------------------------------------------------------------
@receiver(post_save, sender=Post)
def update_post_search_vector(sender, instance, **kwargs):
    Post.objects.filter(pk=instance.pk).update(
        search_vector=(
            SearchVector('title', weight='A', config='russian')
            + SearchVector('body', weight='B', config='russian')
        )
    )


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



