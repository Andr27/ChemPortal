from .celery import app as celery_app

__all__ = ('celery_app',)

# Сигналы оптимизации изображений регистрируются в PostsConfig.ready()
# (apps.posts.apps), а НЕ здесь — на этапе импорта Portal/__init__.py
# реестр приложений ещё не готов и apps.get_model() упал бы с AppRegistryNotReady.
