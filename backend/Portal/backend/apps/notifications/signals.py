from django.dispatch import receiver
from django.db.models.signals import post_save

from .models import Notification



def create_notification(user, type, title, message, **kwargs):
    Notification.objects.create(
        user=user,
        type=type,
        title=title,
        message=message,
        **kwargs
    )


@receiver(post_save, sender='posts.Post')
def post_moderated(sender, instance, **kwargs):
    from Portal.choices import ModerationStatus
    if instance.status == ModerationStatus.PUBLISHED:
        create_notification(
            user=instance.author,
            type='moderation_approved',
            title='Публикация одобрена',
            message=f'Ваша публикация {instance.title} прошла модерацию и опубликована',
            post_id=instance.id
        )
    elif instance.status == ModerationStatus.REJECTED:
        comment = getattr(instance, 'reject_comment', '')
        message = f'Ваша публикация «{instance.title}» отклонена.'
        if comment:
            message += f' Причина: {comment}'
        create_notification(
            user=instance.author,
            type='moderation_rejected',
            title='Публикация отклонена',
            message=message,
            post_id=instance.id
        )

@receiver(post_save, sender='education.Course')
def course_moderated(sender, instance, **kwargs):
    from Portal.choices import ModerationStatus
    if instance.status == ModerationStatus.PUBLISHED:
        create_notification(
            user=instance.created_by,
            type='moderation_approved',
            title="Курс одобрен",
            message=f'Ваш курс «{instance.title}» прошёл модерацию и опубликован.',
            course_id=instance.id
        )
    elif instance.status == ModerationStatus.REJECTED:
        comment = getattr(instance, 'reject_comment', '')
        message = f'Ваш курс «{instance.title}» отклонён.'
        if comment:
            message += f" Причина: {comment}"
        create_notification(
            user=instance.created_by,
            type='moderation_rejected',
            title="Курс отклонен",
            message=message,
            course_id=instance.id
        )

@receiver(post_save, sender='education.EducationSection')
def section_moderated(sender, instance, **kwargs):
    from Portal.choices import ModerationStatus
    if instance.status == ModerationStatus.PUBLISHED:
        create_notification(
            user=instance.created_by,
            type='moderation_approved',
            title='Раздел одобрен',
            message=f'Ваш раздел «{instance.title}» прошёл модерацию и опубликован.',
        )
    elif instance.status == ModerationStatus.REJECTED:
        create_notification(
            user=instance.created_by,
            type='moderation_rejected',
            title='Раздел отклонён',
            message=f'Ваш раздел «{instance.title}» отклонён.',
        )



@receiver(post_save, sender='posts.Comment')
def comment_replied(sender, instance, created, **kwargs):
    if not created:
        return
    if not instance.parent:
        return
    parent_author = instance.parent.author
    if parent_author == instance.author:
        return
    create_notification(
        user=parent_author,
        type='comment_reply',
        title="Новый ответ на комментарий",
        message=f"{instance.author.first_name} {instance.author.last_name} ответил на ваш комментарий",
        post_id=instance.post_id,
        comment_id=instance.id
    )


@receiver(post_save, sender='education.Lesson')
def new_lesson_created(sender, instance, created, **kwargs):
    if not created:
        return
    from apps.enrollment.models import CourseEnrollment

    enrollments = CourseEnrollment.objects.filter(
        course=instance.chapter.course,
        status='active'
    ).select_related('user')
    notifications = [
        Notification(
            user=enrollment.user,
            type='new_lesson',
            title='Новый урок в курсе',
            message=f'В курсе «{instance.chapter.course.title}» добавлен новый урок «{instance.title}».',
            course_id=instance.chapter.course_id,
            lesson_id=instance.id
        )
        for enrollment in enrollments
        if enrollment.user != instance.chapter.course.created_by
    ]
    Notification.objects.bulk_create(notifications)


@receiver(post_save, sender='enrollment.CourseCertificate')
def certificate_issued(sender, instance, created, **kwargs):
    if not created:
        return
    create_notification(
        user=instance.user,
        type='certificate',
        title='Сертификат получен!',
        message=f'Поздравляем! Вы завершили курс «{instance.course.title}» и получили сертификат №{instance.certificate_number}.',
        course_id=instance.course_id
    )

@receiver(post_save, sender='subscriptions.Subscription')
def new_follower(sender, instance, created, **kwargs):
    if not created:
        return
    follower = instance.user
    create_notification(
        user=instance.author,
        type='new_follower',
        title='Новый подписчик',
        message=f'{follower.first_name} {follower.last_name} подписался на вас.',
    )