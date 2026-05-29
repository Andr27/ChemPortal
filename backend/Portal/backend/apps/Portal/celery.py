import os
from celery import Celery
from celery.schedules import crontab


os.environ.setdefault("DJANGO_SETTINGS_MODULE", "Portal.settings")



app = Celery("Portal")
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()


app.conf.beat_schedule = {
    'flush-post-views-every-5-minutes': {
        'task': 'apps.posts.tasks.flush_views_task',
        "schedule": 300,
    }
}