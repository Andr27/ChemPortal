# apps/tags/ml.py

import os
import numpy as np
from django.core.cache import cache


BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# локально используем оригинальную модель
# на сервере — квантованную
ORIGINAL_PATH = os.path.join(BASE_DIR, 'models', 'chemistry_tagger')
QUANTIZED_PATH = os.path.join(BASE_DIR, 'models', 'chemistry_tagger_quantized')

# fallback пути для сервера
if not os.path.exists(ORIGINAL_PATH):
    ORIGINAL_PATH = '/app/Portal/models/chemistry_tagger'
if not os.path.exists(QUANTIZED_PATH):
    QUANTIZED_PATH = '/app/Portal/models/chemistry_tagger_quantized'

# выбираем модель — если есть оригинальная используем её
USE_QUANTIZED = not os.path.exists(ORIGINAL_PATH)
MODEL_PATH = QUANTIZED_PATH if USE_QUANTIZED else ORIGINAL_PATH

_model = None

def get_model():
    global _model
    if _model is None:
        if USE_QUANTIZED:
            # ONNX квантованная для сервера
            import onnxruntime as ort
            from transformers import AutoTokenizer
            _model = {
                'type': 'onnx',
                'session': ort.InferenceSession(
                    os.path.join(MODEL_PATH, 'model_quantized.onnx'),
                    providers=['CPUExecutionProvider']
                ),
                'tokenizer': AutoTokenizer.from_pretrained(MODEL_PATH, local_files_only=True)
            }
        else:
            from sentence_transformers import SentenceTransformer
            from transformers import AutoTokenizer

            st_model = SentenceTransformer(MODEL_PATH)
            original_tokenizer = AutoTokenizer.from_pretrained('intfloat/multilingual-e5-small')
            st_model.tokenizer = original_tokenizer

            _model = {
                'type': 'st',
                'model': st_model
            }
    return _model


def encode(texts: list) -> np.ndarray:
    model = get_model()

    if model['type'] == 'st':
        embeddings = model['model'].encode(
            texts,
            convert_to_numpy=True,
            show_progress_bar=False
        )
        norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
        return embeddings / np.maximum(norms, 1e-9)
    else:
        tokenizer = model['tokenizer']
        session = model['session']
        encoded = tokenizer(texts, padding=True, truncation=True, max_length=512, return_tensors='np')
        inputs = {
            'input_ids': encoded['input_ids'],
            'attention_mask': encoded['attention_mask'],
            'token_type_ids': encoded.get('token_type_ids', np.zeros_like(encoded['input_ids']))
        }
        outputs = session.run(None, inputs)
        mask = encoded['attention_mask'][:, :, None].astype(np.float32)
        embeddings = (outputs[0] * mask).sum(axis=1) / mask.sum(axis=1)
        norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
        return embeddings / np.maximum(norms, 1e-9)


def get_tag_embeddings(all_tags: list) -> np.ndarray:
    cache_key = 'tag_embeddings_v3'
    cached = cache.get(cache_key)
    if cached is not None:
        return np.array(cached)

    tag_texts = ["passage: " + tag for tag in all_tags]
    embeddings = encode(tag_texts)
    cache.set(cache_key, embeddings.tolist(), timeout=86400)
    return embeddings


def suggest_tags(text: str, all_tags: list, top_n: int = 5, threshold: float = 0.5) -> list:
    if not text or not all_tags:
        return []

    try:
        text_embedding = encode(["query: " + text[:2000]])
        tag_embeddings = get_tag_embeddings(all_tags)
        scores = (tag_embeddings @ text_embedding.T).flatten()
        results = [
            (all_tags[i], float(scores[i]))
            for i in range(len(all_tags))
            if float(scores[i]) >= threshold
        ]
        results.sort(key=lambda x: x[1], reverse=True)
        return [tag for tag, score in results[:top_n]]
    except Exception as e:
        return []