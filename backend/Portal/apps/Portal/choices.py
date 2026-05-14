from django.db import models



class UserRole(models.TextChoices):
    GUEST = 'guest', "Гость"
    USER = 'user', "Пользователь"
    CREATOR = 'creator', "Создатель контента"
    MODERATOR = 'moderator', "Модератор"
    ADMIN = 'admin', "Админ"


class ModerationStatus(models.TextChoices):
    DRAFT = 'draft', "Черновик"
    MODERATION = 'moderation', "На модерации"
    PUBLISHED = 'published', "Опубликовано"
    REJECTED = 'rejected', "Отклонено"