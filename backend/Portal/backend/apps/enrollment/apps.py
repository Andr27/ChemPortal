from django.apps import AppConfig


class EnrollmentConfig(AppConfig):
    name = 'apps.enrollment'

    def ready(self):
        import apps.enrollment.signals