#!/bin/bash
set -e

echo "========================================="
echo "Запуск entrypoint.sh для ChemPortal"
echo "========================================="

# --- Скачиваем квантованную модель с Яндекс Диска если её нет ---
mkdir -p /app/Portal/models/chemistry_tagger_quantized

if [ ! -f "/app/Portal/models/chemistry_tagger_quantized/model_quantized.onnx" ]; then
    echo "⚠️  Квантованная модель не найдена. Скачиваем с Яндекс Диска..."

    PUBLIC_URL="https://disk.yandex.com/d/VZN5RKXYvizg4w"

    DIRECT_URL=$(wget -qO- \
        "https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=$(python3 -c 'import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))' "$PUBLIC_URL")" \
        | python3 -c "import sys,json; print(json.load(sys.stdin)['href'])")

    if [ -z "$DIRECT_URL" ]; then
        echo "❌ Не удалось получить ссылку. Убедись что ссылка публичная!"
        exit 1
    fi

    echo "Скачиваем архив модели..."
    wget -q --show-progress -O /tmp/chemistry_tagger_quantized.zip "$DIRECT_URL"

    echo "Распаковываем..."
    unzip -q /tmp/chemistry_tagger_quantized.zip -d /app/Portal/models/
    rm /tmp/chemistry_tagger_quantized.zip

    echo "✅ Квантованная модель успешно загружена!"
else
    echo "✅ Квантованная модель уже есть, пропускаем скачивание."
fi

# --- Применяем миграции ---
echo "Применяем миграции..."
python manage.py migrate --noinput

# --- Собираем статику ---
echo "Собираем статику..."
python manage.py collectstatic --noinput

echo "========================================="
echo "Запускаем Django..."
echo "========================================="

exec "$@"
```

