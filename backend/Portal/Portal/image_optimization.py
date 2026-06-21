"""
Общий сигнал для автоматической оптимизации загружаемых изображений.

При каждом post_save ImageField:
  - Ресайзит до макс. 1600px по длинной стороне (сохраняет пропорции).
  - Сохраняет в JPEG с качеством 85 (для фото) или PNG (для прозрачных).

Подключается в Portal/__init__.py или в apps.py конкретного приложения.
"""

import io
import logging
from pathlib import Path

from django.db.models.signals import post_save
from django.dispatch import receiver
from PIL import Image

logger = logging.getLogger(__name__)

# Максимальный размер по длинной стороне (px).
# 1600px — достаточно для Retina-дисплеев при типичной ширине контента ~800px.
MAX_DIMENSION = 1600
# JPEG quality (для непрозрачных изображений).
JPEG_QUALITY = 85


def _optimize_image(image_field):
    """Ресайз и оптимизация одного ImageField. Возвращает True если файл изменён."""
    if not image_field:
        return False

    file_path = image_field.path
    if not Path(file_path).exists():
        return False

    try:
        img = Image.open(file_path)
    except Exception:
        logger.warning("Не удалось открыть изображение для оптимизации: %s", file_path)
        return False

    # Пропускаем SVG и анимированные GIF
    if img.format in ('GIF', 'SVG', 'WEBP'):
        return False

    # Проверяем: нужно ли ресайзить
    if img.width <= MAX_DIMENSION and img.height <= MAX_DIMENSION:
        # Даже если не ресайзим — оптимизируем filesize через перезапись с quality
        if img.format == 'JPEG':
            img.save(file_path, 'JPEG', quality=JPEG_QUALITY, optimize=True)
            return True
        return False

    # Ресайз с сохранением пропорций
    img.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.LANCZOS)

    # Сохраняем с оптимизацией
    has_alpha = img.mode in ('RGBA', 'LA', 'P', 'PA')
    if has_alpha:
        img.save(file_path, 'PNG', optimize=True)
    else:
        # Конвертируем RGB если RGBA без прозрачности
        if img.mode != 'RGB':
            img = img.convert('RGB')
        img.save(file_path, 'JPEG', quality=JPEG_QUALITY, optimize=True)

    return True


# ---------------------------------------------------------------------------
# Список пар (model, field_name) для которых нужно оптимизировать изображения.
# Добавляй сюда новые модели/поля по мере появления новых ImageField.
# ---------------------------------------------------------------------------
_IMAGE_FIELDS = [
    ('posts.PostImage', 'image'),
    ('posts.Post', 'main_image'),
    ('users.Profile', 'avatar'),
    ('education.SectionMaterial', 'image'),
    ('career_map.Organization', 'photo'),
]


def register_image_optimization():
    """Регистрация сигналов для всех ImageField. Вызывается из Portal/__init__.py."""
    from django.apps import apps

    for model_label, field_name in _IMAGE_FIELDS:
        try:
            model = apps.get_model(model_label)
        except LookupError:
            continue

        # field_name связываем через аргумент по умолчанию — иначе все обработчики
        # из-за позднего связывания замыкания захватили бы последнее значение из цикла.
        @receiver(post_save, sender=model, weak=False, dispatch_uid=f'optimize_{model_label}_{field_name}')
        def optimize_on_save(sender, instance, _field_name=field_name, **kwargs):
            field = getattr(instance, _field_name, None)
            if field:
                try:
                    _optimize_image(field)
                except Exception:
                    logger.exception("Ошибка оптимизации %s.%s для pk=%s",
                                     sender.__name__, _field_name, instance.pk)
