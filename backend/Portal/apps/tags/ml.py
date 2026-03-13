import os
from sentence_transformers import SentenceTransformer, util

# путь к дообученной модели
MODEL_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    'models', 'chemistry_tagger'
)

_model = None

def get_model():
    """Загружаем модель один раз при старте сервера"""
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_PATH)
    return _model


def suggest_tags(text: str, all_tags: list, top_n: int = 5, threshold: float = 0.5) -> list:
    """
    Предлагает теги для текста.

    text      — текст поста
    all_tags  — список названий всех активных тегов из БД
    top_n     — сколько тегов вернуть максимум
    threshold — минимальный скор (теги ниже порога отбрасываются)
    """
    if not text or not all_tags:
        return []

    model = get_model()

    # префиксы обязательны для e5 модели
    text_embedding = model.encode(
        "query: " + text[:2000],  # обрезаем длинные тексты
        convert_to_tensor=True
    )
    tag_embeddings = model.encode(
        ["passage: " + tag for tag in all_tags],
        convert_to_tensor=True
    )

    scores = util.cos_sim(text_embedding, tag_embeddings)[0]

    # собираем результаты выше порога
    results = [
        (all_tags[i], float(scores[i]))
        for i in range(len(all_tags))
        if float(scores[i]) >= threshold
    ]

    # сортируем по убыванию и берём топ N
    results.sort(key=lambda x: x[1], reverse=True)
    return [tag for tag, score in results[:top_n]]