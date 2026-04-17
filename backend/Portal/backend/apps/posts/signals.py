from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver


from .models import Like, Dislike, Comment




@receiver(post_save, sender=Like)
def like_create(sender, instance, created, **kwargs):
    if created:
        profile = instance.post.author.profile
        profile.rating += 2
        profile.save()



@receiver(post_delete, sender=Like)
def like_delete(sender, instance, **kwargs):
    profile = instance.post.author.profile
    profile.rating = max(0, profile.rating - 2)
    profile.save()

@receiver(post_save, sender=Dislike)
def dislike_create(sender, instance, created, **kwargs):
    if created:
        profile = instance.post.author.profile
        profile.rating = max(0, profile.rating - 1)
        profile.save()


@receiver(post_delete, sender=Dislike)
def dislike_delete(sender, instance, **kwargs):
    profile = instance.post.author.profile
    profile.rating += 1
    profile.save()




@receiver(post_save, sender=Comment)
def comment_create(sender, instance, created, **kwargs):
    if created and not instance.is_deleted:
        profile = instance.post.author.profile
        profile.rating += 1
        profile.save()



