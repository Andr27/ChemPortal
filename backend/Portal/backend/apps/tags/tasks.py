from celery import shared_task


@shared_task
def suggest_tags_async(text: str, all_tags: list, top_n: int = 5, threshold: float = 0.3):
    from .ml import suggest_tags
    return suggest_tags(text, all_tags, top_n, threshold)