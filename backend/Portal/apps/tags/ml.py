import os
import numpy as np
import onnxruntime as ort
from transformers import AutoTokenizer
from django.core.cache import cache

QUANTIZED_PATH = '/app/Portal/models/chemistry_tagger_quantized'

_session = None
_tokenizer = None

def get_model():
    global _session, _tokenizer
    if _session is None:
        model_file = os.path.join(QUANTIZED_PATH, 'model_quantized.onnx')
        _session = ort.InferenceSession(
            model_file,
            providers=['CPUExecutionProvider']
        )
        _tokenizer = AutoTokenizer.from_pretrained(
            QUANTIZED_PATH,
            local_files_only=True
        )
    return _session, _tokenizer

def mean_pooling(token_embeddings, attention_mask):
    mask = attention_mask[:, :, None].astype(np.float32)
    return (token_embeddings * mask).sum(axis=1) / mask.sum(axis=1)

def normalize(embeddings):
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    return embeddings / np.maximum(norms, 1e-9)

def encode(texts: list) -> np.ndarray:
    session, tokenizer = get_model()
    encoded = tokenizer(
        texts,
        padding=True,
        truncation=True,
        max_length=512,
        return_tensors='np'
    )
    inputs = {
        'input_ids': encoded['input_ids'],
        'attention_mask': encoded['attention_mask'],
        'token_type_ids': encoded.get('token_type_ids',
            np.zeros_like(encoded['input_ids']))
    }
    outputs = session.run(None, inputs)
    embeddings = mean_pooling(outputs[0], encoded['attention_mask'])
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