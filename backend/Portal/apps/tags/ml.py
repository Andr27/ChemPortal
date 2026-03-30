import os
import torch
from sentence_transformers import SentenceTransformer, util
from django.core.cache import cache

MODEL_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    'models', 'chemistry_tagger'
)

_model = None

def get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_PATH)
    return _model


def get_tag_embeddings(all_tags: list):
    """
    Берём эмбеддинги тегов из кэша.
    Если нет — считаем и кладём в кэш на 24 часа.
    """
    cache_key = 'tag_embeddings_v1'
    cached = cache.get(cache_key)

    if cached is not None:
        # достаём тензор из кэша
        embeddings = torch.tensor(cached)
        return embeddings

    # считаем один раз
    model = get_model()
    embeddings = model.encode(
        ["passage: " + tag for tag in all_tags],
        convert_to_tensor=True,
        show_progress_bar=False,
    )

    # сохраняем в кэш как список (Redis не умеет хранить тензоры)
    cache.set(cache_key, embeddings.cpu().tolist(), timeout=86400)  # 24 часа
    return embeddings


def suggest_tags(text: str, all_tags: list, top_n: int = 5, threshold: float = 0.5) -> list:
    if not text or not all_tags:
        return []

    model = get_model()

    text_embedding = model.encode(
        "query: " + text[:2000],
        convert_to_tensor=True,
        show_progress_bar=False,
    )

    tag_embeddings = get_tag_embeddings(all_tags)

    scores = util.cos_sim(text_embedding, tag_embeddings)[0]

    results = [
        (all_tags[i], float(scores[i]))
        for i in range(len(all_tags))
        if float(scores[i]) >= threshold
    ]

    results.sort(key=lambda x: x[1], reverse=True)
    return [tag for tag, score in results[:top_n]]