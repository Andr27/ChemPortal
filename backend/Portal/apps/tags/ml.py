import os
import numpy as np
from tokenizers import Tokenizer
from optimum.onnxruntime import ORTModelForFeatureExtraction
from transformers import AutoTokenizer
from django.core.cache import cache

QUANTIZED_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    'models', 'chemistry_tagger_quantized'
)

_model = None
_tokenizer = None


def get_model():
    global _model, _tokenizer
    if _model is None:
        _model = ORTModelForFeatureExtraction.from_pretrained(QUANTIZED_PATH)
        _tokenizer = AutoTokenizer.from_pretrained(QUANTIZED_PATH)
    return _model, _tokenizer


def mean_pooling(model_output, attention_mask):
    token_embeddings = model_output[0]
    input_mask_expanded = attention_mask[:, :, None].astype(float)
    return (token_embeddings * input_mask_expanded).sum(axis=1) / input_mask_expanded.sum(axis=1)


def normalize(embeddings):
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    return embeddings / np.maximum(norms, 1e-9)


def encode(texts: list) -> np.ndarray:
    model, tokenizer = get_model()
    encoded = tokenizer(
        texts,
        padding=True,
        truncation=True,
        max_length=512,
        return_tensors='np'
    )
    outputs = model(**encoded)
    embeddings = mean_pooling(outputs, encoded['attention_mask'])
    return normalize(embeddings)


def get_tag_embeddings(all_tags: list) -> np.ndarray:
    cache_key = 'tag_embeddings_v2'
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