from celery import shared_task
from .services import flush_post_views as _flush_post_views

@shared_task
def flush_views_task():
    _flush_post_views()
    return 'Views flushed'