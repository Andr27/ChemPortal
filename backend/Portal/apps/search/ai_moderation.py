import re
from django.conf import settings






STOP_WORDS = [
    'спам', 'реклама', 'купить', 'продать', 'заработок',
    'казино', 'ставки', 'кредит', 'займ', 'бесплатно',
    'скидка', 'акция', 'промокод', 'перейди по ссылке',
    'click here', 'buy now', 'free money', 'блять', 'пиздец'

]


_sentiment_model = None
_sentiment_tokenizer = None


def get_sentiment_model():
    global _sentiment_model, _sentiment_tokenizer
    if _sentiment_model is None:
        from transformers import AutoTokenizer, AutoModelForSequenceClassification
        import torch
        model_name = 'blanchefort/rubert-base-cased-sentiment'
        _sentiment_tokenizer = AutoTokenizer.from_pretrained(model_name)
        _sentiment_model = AutoModelForSequenceClassification.from_pretrained(model_name)
        _sentiment_model.eval()
    return _sentiment_model, _sentiment_tokenizer



def analyze_sentiment(text: str) -> dict:

    try:
        model, tokenizer = get_sentiment_model()
        import torch

        inputs = tokenizer(
            text[:512],
            return_tensors='pt',
            truncation=True,
            max_length=512
        )
        with torch.no_grad():
            outputs = model(**inputs)
        probs = torch.softmax(outputs.logits, dim=1)[0]
        labels = ['NEGATIVE', 'NEUTRAL', 'POSITIVE']
        idx = probs.argmax().item()

        return {
            'label': labels[idx],
            'score': round(float(probs[idx]), 3),
            'scores': {
                'negative': round(float(probs[0]), 3),
                'neutral': round(float(probs[1]), 3),
                'positive': round(float(probs[2]), 3),
            }
        }
    except Exception as e:
        return {
            'label': 'NEUTRAL',
            'score': 0.0,
            'error': str(e)
        }

def check_stop_words(text: str) -> list:
    text_lower = text.lower()
    found = []
    for word in STOP_WORDS:
        if word.lower() in text_lower:
            found.append(word)
    return found


def analyze_context(title:str, body:str) -> dict:

    full_text = f'{title}. {body}'

    sentiment = analyze_sentiment(full_text)
    stop_words_found = check_stop_words(full_text)

    risk = 'low'
    warnings = []

    if sentiment['label'] == 'NEGATIVE' and sentiment['score'] > 0.8:
        risk = 'high'
        warnings.append("Очень негативная тональность текста")
    elif sentiment['label'] == "NEGATIVE" and sentiment['score'] > 0.6:
        risk = 'medium'
        warnings.append("Негативная тональность текста")

    if stop_words_found:
        risk = 'high'
        warnings.append(f"найдены стоп слова: {", ".join(stop_words_found)}")


    caps_ratio = sum(1 for c in body if c.isupper()) / max(len(body), 1)
    if caps_ratio > 0.3:
        if risk != 'high':
            risk = 'medium'
        warnings.append("Слишком много заглавных буква, возможен спам")

    urls = re.findall(r'http[s]?://\S+', body)
    if len(urls) > 3:
        warnings.append(f"Найдено {len(urls)} внешних ссылок: {", ".join(urls)}")
    elif len(urls) > 0:
        warnings.append(f"Есть ссылки на внешние источники: {", ".join(urls)}")

    return {
        'sentiment': sentiment,
        'stop_words': stop_words_found,
        'risk': risk,
        'warnings': warnings,
        'recommendation': "Требует внимания" if risk != "low" else "Можно одобрить"
    }

