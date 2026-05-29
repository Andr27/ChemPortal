from sentence_transformers import SentenceTransformer, util

#sadfasd
model = SentenceTransformer('models/chemistry_tagger')
text = "Оксиды — это бинарные соединения кислорода с другими элементами. Рассмотрим основные оксиды металлов и их свойства"
tags = [
    "Неорганическая химия",
    "Органическая химия",
    "Оксиды",
    "Металлы",
    "Подготовка к ЕГЭ",
    "Кислоты",
    "Реакции",
]
text_embedding = model.encode("query: " + text, convert_to_tensor=True)
tag_embeddings = model.encode(["passage: " + tag for tag in tags], convert_to_tensor=True)

scores = util.cos_sim(text_embedding, tag_embeddings)[0]

results = sorted(zip(tags, scores.tolist()), key=lambda x: x[1], reverse=True)

for tag, score in results:
    print(f"{score:.3f} — {tag}")



