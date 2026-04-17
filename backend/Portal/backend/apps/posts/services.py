from django.core.cache import cache
from django.db.models import F
from .models import Post


def flush_post_views():

    keys = cache.keys("post_views_buffer:*")

    for key in keys:
        post_id = int(key.split(":")[1])
        views = cache.get(key)

        if views:
            Post.objects.filter(id=post_id).update(views=F('views') + views)
            cache.delete(key)