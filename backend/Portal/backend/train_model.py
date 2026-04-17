"""
Дообучение sentence-transformers для тегирования химических текстов.
Запуск: python train_model.py
Требования: pip install sentence-transformers torch
"""

import json
import random
from sentence_transformers import SentenceTransformer, InputExample, losses
from sentence_transformers.evaluation import EmbeddingSimilarityEvaluator
from torch.utils.data import DataLoader


# === КОНФИГ ===
DATASET_PATH = 'chemistry_dataset.json'
MODEL_NAME = 'intfloat/multilingual-e5-small'
OUTPUT_PATH = 'models/chemistry_tagger'
EPOCHS = 10
BATCH_SIZE = 16
# ==============


def load_dataset(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def build_training_pairs(dataset):
    """
    Формируем пары (текст, тег) для обучения.

    Логика:
    - Позитивные пары: текст + правильный тег → схожесть 1.0
    - Негативные пары: текст + случайный тег → схожесть 0.0

    Модель учится: правильный тег должен быть близко к тексту,
    неправильный — далеко.
    """

    # собираем все теги из датасета
    all_tags = set()
    for item in dataset:
        for tag in item['tags']:
            all_tags.add(tag)
    all_tags = list(all_tags)

    train_examples = []

    for item in dataset:
        text = "query: " + item['text']  # префикс для e5 модели
        positive_tags = item['tags']

        # позитивные пары
        for tag in positive_tags:
            train_examples.append(
                InputExample(
                    texts=[text, "passage: " + tag],
                    label=1.0
                )
            )

        # негативные пары — берём теги которых нет в правильных
        negative_tags = [t for t in all_tags if t not in positive_tags]
        # берём столько же негативных сколько позитивных
        sampled_negatives = random.sample(
            negative_tags,
            min(len(positive_tags), len(negative_tags))
        )
        for tag in sampled_negatives:
            train_examples.append(
                InputExample(
                    texts=[text, "passage: " + tag],
                    label=0.0
                )
            )

    random.shuffle(train_examples)
    return train_examples


def build_evaluator(dataset):
    """
    Evaluator для отслеживания качества во время обучения.
    Берём 20% датасета как валидационную выборку.
    """
    all_tags = set()
    for item in dataset:
        for tag in item['tags']:
            all_tags.add(tag)
    all_tags = list(all_tags)

    val_size = max(20, len(dataset) // 5)
    val_data = random.sample(dataset, val_size)

    sentences1, sentences2, scores = [], [], []

    for item in val_data:
        text = "query: " + item['text']
        positive_tags = item['tags']

        for tag in positive_tags[:2]:  # берём первые 2 тега
            sentences1.append(text)
            sentences2.append("passage: " + tag)
            scores.append(1.0)

        negative_tags = [t for t in all_tags if t not in positive_tags]
        for tag in random.sample(negative_tags, min(2, len(negative_tags))):
            sentences1.append(text)
            sentences2.append("passage: " + tag)
            scores.append(0.0)

    return EmbeddingSimilarityEvaluator(sentences1, sentences2, scores)


def train():
    print(f"Загружаем датасет: {DATASET_PATH}")
    dataset = load_dataset(DATASET_PATH)
    print(f"Примеров в датасете: {len(dataset)}")

    print(f"\nЗагружаем базовую модель: {MODEL_NAME}")
    model = SentenceTransformer(MODEL_NAME)

    print("\nФормируем обучающие пары...")
    train_examples = build_training_pairs(dataset)
    print(f"Обучающих пар: {len(train_examples)}")

    # DataLoader
    train_dataloader = DataLoader(
        train_examples,
        shuffle=True,
        batch_size=BATCH_SIZE
    )

    # CosineSimilarityLoss — учим модель что похожие пары
    # должны иметь высокое косинусное сходство
    train_loss = losses.CosineSimilarityLoss(model)

    # Evaluator
    evaluator = build_evaluator(dataset)

    print(f"\nНачинаем обучение на {EPOCHS} эпох...")
    print(f"Batch size: {BATCH_SIZE}")
    print(f"Результат сохранится в: {OUTPUT_PATH}\n")

    model.fit(
        train_objectives=[(train_dataloader, train_loss)],
        evaluator=evaluator,
        epochs=EPOCHS,
        evaluation_steps=100,
        output_path=OUTPUT_PATH,
        show_progress_bar=True,
        warmup_steps=50,
    )

    print(f"\n✅ Обучение завершено! Модель сохранена в {OUTPUT_PATH}")


def test_model():
    """Быстрый тест после обучения"""
    print("\n=== Тест дообученной модели ===")
    from sentence_transformers import util

    model = SentenceTransformer(OUTPUT_PATH)

    test_cases = [
        {
            "text": "Оксид меди CuO реагирует с серной кислотой с образованием сульфата меди и воды",
            "expected": ["Оксиды", "Медь", "Кислоты"]
        },
        {
            "text": "Гликолиз — процесс расщепления глюкозы с образованием АТФ",
            "expected": ["Гликолиз", "Глюкоза", "АТФ"]
        },
        {
            "text": "При электролизе раствора хлорида натрия на катоде выделяется водород",
            "expected": ["Электролиз", "Натрий", "Водород"]
        },
    ]

    all_tags = [
        "Оксиды", "Медь", "Кислоты", "Металлы", "Органическая химия",
        "Гликолиз", "Глюкоза", "АТФ", "Биохимия", "Углеводы",
        "Электролиз", "Натрий", "Водород", "Щелочные металлы", "Электрохимия",
        "Алканы", "Полимеры", "Фотосинтез", "Ферменты", "Подготовка к ЕГЭ"
    ]

    for case in test_cases:
        text_emb = model.encode("query: " + case["text"], convert_to_tensor=True)
        tag_embs = model.encode(
            ["passage: " + t for t in all_tags],
            convert_to_tensor=True
        )
        scores = util.cos_sim(text_emb, tag_embs)[0]
        results = sorted(zip(all_tags, scores.tolist()), key=lambda x: x[1], reverse=True)

        print(f"\nТекст: {case['text'][:60]}...")
        print(f"Ожидаем: {case['expected']}")
        print("Топ-5 предсказанных:")
        for tag, score in results[:5]:
            marker = "✓" if tag in case['expected'] else " "
            print(f"  {marker} {score:.3f} — {tag}")


if __name__ == '__main__':
    train()
    test_model()
