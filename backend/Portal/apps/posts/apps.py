from django.apps import AppConfig


class PostsConfig(AppConfig):
    name = 'apps.posts'

    def ready(self):
        import apps.posts.signals

        # Регистрируем сигналы оптимизации изображений здесь: к моменту ready()
        # все модели всех приложений уже загружены, apps.get_model() безопасен.
        from Portal.image_optimization import register_image_optimization
        register_image_optimization()

