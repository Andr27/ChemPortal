from django.apps import AppConfig


class PostsConfig(AppConfig):
    name = 'apps.posts'

    def ready(self):
        import apps.posts.signals

