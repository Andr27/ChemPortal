#!/bin/bash
set -e

echo "========================================="
echo "Запуск entrypoint.sh для ChemPortal"
echo "========================================="

# --- Скачиваем модель с Яндекс Диска если её нет ---
mkdir -p /app/Portal/models/chemistry_tagger

if [ ! -f "/app/Portal/models/chemistry_tagger/modules.json" ]; then
    echo "⚠️  Модель не найдена. Скачиваем с Яндекс Диска..."

    PUBLIC_URL="https://disk.yandex.ru/d/ZNyHWsgs5EYYug"

    # Правильный способ получить прямую ссылку с публичного Яндекс Диска
    DIRECT_URL=$(wget -qO- \
        "https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=$(python3 -c 'import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))' "$PUBLIC_URL")" \
        | python3 -c "import sys,json; print(json.load(sys.stdin)['href'])")

    if [ -z "$DIRECT_URL" ]; then
        echo "❌ Не удалось получить ссылку. Убедись что ссылка публичная!"
        exit 1
    fi

    echo "Скачиваем архив модели..."
    wget -q --show-progress -O /tmp/chemistry_tagger.zip "$DIRECT_URL"

    echo "Распаковываем..."
    unzip -q /tmp/chemistry_tagger.zip -d /app/Portal/models/
    rm /tmp/chemistry_tagger.zip

    echo "✅ Модель успешно загружена!"
else
    echo "✅ Модель уже есть, пропускаем скачивание."
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
