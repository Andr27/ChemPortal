from django.db import models
from django.utils.text import slugify


class OrganizationType(models.TextChoices):
    """Типы меток на карте профориентационного навигатора."""
    UNIVERSITY = 'university', 'Вуз (высшее образование)'
    COLLEGE = 'college', 'Ссуз (среднее профессиональное)'
    RESEARCH = 'research', 'НИИ / научный центр'
    ENTERPRISE = 'enterprise', 'Промышленное предприятие'


class Industry(models.Model):
    """Отрасль (для фильтрации меток): нефтехимия, фармацевтика, металлургия и т.п."""
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=140, unique=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Отрасль'
        verbose_name_plural = 'Отрасли'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name, allow_unicode=True) or 'industry'
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Direction(models.Model):
    """Направление подготовки/деятельности: химическая технология, наноматериалы и т.п."""
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=140, unique=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Направление'
        verbose_name_plural = 'Направления'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name, allow_unicode=True) or 'direction'
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Organization(models.Model):
    """
    Метка на интерактивной карте Хабаровского края: учебное заведение,
    НИИ или предприятие. Содержит карточку с описанием, контактами,
    фото, ссылкой и списком стажёрских вакансий.
    """
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=280, unique=True, blank=True)
    org_type = models.CharField(
        max_length=20,
        choices=OrganizationType.choices,
        db_index=True,
        verbose_name='Тип',
    )
    description = models.TextField(blank=True, verbose_name='Описание')

    industries = models.ManyToManyField(
        Industry, blank=True, related_name='organizations', verbose_name='Отрасли',
    )
    directions = models.ManyToManyField(
        Direction, blank=True, related_name='organizations', verbose_name='Направления',
    )

    # Контакты
    address = models.CharField(max_length=300, blank=True, verbose_name='Адрес')
    phone = models.CharField(max_length=60, blank=True, verbose_name='Телефон')
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True, verbose_name='Сайт')
    photo = models.ImageField(upload_to='career_map/photos/', blank=True, null=True)

    # Координаты для карты (WGS84).
    latitude = models.DecimalField(max_digits=9, decimal_places=6, verbose_name='Широта')
    longitude = models.DecimalField(max_digits=9, decimal_places=6, verbose_name='Долгота')

    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Организация (метка на карте)'
        verbose_name_plural = 'Организации (метки на карте)'
        indexes = [
            models.Index(fields=['org_type', 'is_active'], name='career_map__org_typ_idx'),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name, allow_unicode=True) or 'org'
            slug = base
            i = 2
            while Organization.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f'{base}-{i}'
                i += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Vacancy(models.Model):
    """Стажёрская вакансия, привязанная к организации (метке на карте)."""
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name='vacancies',
    )
    title = models.CharField(max_length=255, verbose_name='Должность')
    description = models.TextField(blank=True, verbose_name='Описание')
    requirements = models.TextField(blank=True, verbose_name='Требования')
    employment = models.CharField(
        max_length=120, blank=True, verbose_name='Тип занятости',
        help_text='Например: стажировка, практика, частичная занятость',
    )
    salary = models.CharField(max_length=120, blank=True, verbose_name='Оплата')
    contact = models.CharField(max_length=255, blank=True, verbose_name='Контакт для связи')
    url = models.URLField(blank=True, verbose_name='Ссылка на вакансию')
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Вакансия для стажёров'
        verbose_name_plural = 'Вакансии для стажёров'

    def __str__(self):
        return f'{self.title} — {self.organization.name}'
