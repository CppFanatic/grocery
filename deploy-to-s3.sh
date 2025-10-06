#!/bin/bash

# =============================================================================
# Скрипт для деплоя PWA приложения на AWS S3
# =============================================================================

set -e  # Остановить выполнение при ошибке

# =============================================================================
# КОНФИГУРАЦИЯ S3 БАКЕТА
# =============================================================================

# Основные параметры бакета
BUCKET_NAME="your-pwa-bucket-name"                    # Имя S3 бакета
REGION="us-east-1"                                    # Регион AWS
PROFILE="default"                                     # AWS профиль (или оставить пустым для default)

# Настройки кэширования (в секундах)
CACHE_CONTROL_STATIC="public, max-age=31536000"       # 1 год для статических файлов
CACHE_CONTROL_HTML="public, max-age=0, must-revalidate" # Нет кэша для HTML
CACHE_CONTROL_SW="public, max-age=0, must-revalidate"   # Нет кэша для Service Worker

# Настройки CORS (если нужно)
ENABLE_CORS=true
CORS_CONFIG_FILE="cors-config.json"

# =============================================================================
# ПРОВЕРКИ И ПОДГОТОВКА
# =============================================================================

echo "🚀 Начинаем деплой PWA на S3..."
echo "📦 Бакет: $BUCKET_NAME"
echo "🌍 Регион: $REGION"
echo "👤 Профиль: $PROFILE"
echo ""

# Проверяем наличие AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI не установлен. Установите его с https://aws.amazon.com/cli/"
    exit 1
fi

# Проверяем наличие webpack
if ! command -v npm &> /dev/null; then
    echo "❌ npm не установлен"
    exit 1
fi

# Проверяем, что мы в правильной директории
if [ ! -f "package.json" ]; then
    echo "❌ package.json не найден. Запустите скрипт из корня проекта"
    exit 1
fi

# =============================================================================
# СБОРКА ПРОЕКТА
# =============================================================================

echo "🔨 Собираем проект..."

# Устанавливаем зависимости если нужно
if [ ! -d "node_modules" ]; then
    echo "📦 Устанавливаем зависимости..."
    npm install
fi

# Собираем проект для продакшена
echo "🏗️ Собираем для продакшена..."
npm run build

# Проверяем, что сборка прошла успешно
if [ ! -d "dist" ]; then
    echo "❌ Папка dist не создана. Проверьте конфигурацию webpack"
    exit 1
fi

echo "✅ Сборка завершена"
echo ""

# =============================================================================
# НАСТРОЙКА CORS (если включено)
# =============================================================================

if [ "$ENABLE_CORS" = true ]; then
    echo "🌐 Настраиваем CORS..."
    
    # Создаем конфигурацию CORS
    cat > "$CORS_CONFIG_FILE" << EOF
{
    "CORSRules": [
        {
            "AllowedHeaders": ["*"],
            "AllowedMethods": ["GET", "HEAD"],
            "AllowedOrigins": ["*"],
            "ExposeHeaders": ["ETag"],
            "MaxAgeSeconds": 3000
        }
    ]
}
EOF

    # Применяем CORS конфигурацию
    if [ -n "$PROFILE" ] && [ "$PROFILE" != "default" ]; then
        aws s3api put-bucket-cors --bucket "$BUCKET_NAME" --cors-configuration file://"$CORS_CONFIG_FILE" --profile "$PROFILE" --region "$REGION"
    else
        aws s3api put-bucket-cors --bucket "$BUCKET_NAME" --cors-configuration file://"$CORS_CONFIG_FILE" --region "$REGION"
    fi
    
    echo "✅ CORS настроен"
    rm "$CORS_CONFIG_FILE"
fi

# =============================================================================
# ЗАГРУЗКА ФАЙЛОВ НА S3
# =============================================================================

echo "📤 Загружаем файлы на S3..."

# Функция для загрузки с правильными заголовками
upload_with_cache() {
    local file_path="$1"
    local s3_path="$2"
    local cache_control="$3"
    local content_type="$4"
    
    if [ -n "$PROFILE" ] && [ "$PROFILE" != "default" ]; then
        aws s3 cp "$file_path" "s3://$BUCKET_NAME$s3_path" \
            --cache-control "$cache_control" \
            --content-type "$content_type" \
            --profile "$PROFILE" \
            --region "$REGION"
    else
        aws s3 cp "$file_path" "s3://$BUCKET_NAME$s3_path" \
            --cache-control "$cache_control" \
            --content-type "$content_type" \
            --region "$REGION"
    fi
}

# Загружаем HTML файлы (без кэша)
echo "📄 Загружаем HTML файлы..."
upload_with_cache "dist/index.html" "/index.html" "$CACHE_CONTROL_HTML" "text/html"

# Загружаем Service Worker (без кэша)
echo "⚙️ Загружаем Service Worker..."
upload_with_cache "dist/sw.js" "/sw.js" "$CACHE_CONTROL_SW" "application/javascript"

# Загружаем manifest.json
echo "📋 Загружаем manifest..."
upload_with_cache "dist/manifest.json" "/manifest.json" "$CACHE_CONTROL_HTML" "application/json"

# Загружаем JavaScript файлы
echo "📜 Загружаем JavaScript файлы..."
for js_file in dist/*.js; do
    if [ -f "$js_file" ]; then
        filename=$(basename "$js_file")
        upload_with_cache "$js_file" "/$filename" "$CACHE_CONTROL_STATIC" "application/javascript"
    fi
done

# Загружаем CSS файлы
echo "🎨 Загружаем CSS файлы..."
for css_file in dist/*.css; do
    if [ -f "$css_file" ]; then
        filename=$(basename "$css_file")
        upload_with_cache "$css_file" "/$filename" "$CACHE_CONTROL_STATIC" "text/css"
    fi
done

# Загружаем изображения
echo "🖼️ Загружаем изображения..."
if [ -d "dist/images" ]; then
    if [ -n "$PROFILE" ] && [ "$PROFILE" != "default" ]; then
        aws s3 sync "dist/images/" "s3://$BUCKET_NAME/images/" \
            --cache-control "$CACHE_CONTROL_STATIC" \
            --profile "$PROFILE" \
            --region "$REGION"
    else
        aws s3 sync "dist/images/" "s3://$BUCKET_NAME/images/" \
            --cache-control "$CACHE_CONTROL_STATIC" \
            --region "$REGION"
    fi
fi

# Загружаем иконки
echo "🔗 Загружаем иконки..."
for icon_file in dist/*.svg; do
    if [ -f "$icon_file" ]; then
        filename=$(basename "$icon_file")
        upload_with_cache "$icon_file" "/$filename" "$CACHE_CONTROL_STATIC" "image/svg+xml"
    fi
done

# =============================================================================
# НАСТРОЙКА ВЕБ-ХОСТИНГА
# =============================================================================

echo "🌐 Настраиваем веб-хостинг..."

# Включаем веб-хостинг для бакета
if [ -n "$PROFILE" ] && [ "$PROFILE" != "default" ]; then
    aws s3 website "s3://$BUCKET_NAME" \
        --index-document "index.html" \
        --error-document "index.html" \
        --profile "$PROFILE" \
        --region "$REGION"
else
    aws s3 website "s3://$BUCKET_NAME" \
        --index-document "index.html" \
        --error-document "index.html" \
        --region "$REGION"
fi

# =============================================================================
# НАСТРОЙКА ПУБЛИЧНОГО ДОСТУПА
# =============================================================================

echo "🔓 Настраиваем публичный доступ..."

# Создаем политику для публичного доступа
cat > bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
        }
    ]
}
EOF

# Применяем политику
if [ -n "$PROFILE" ] && [ "$PROFILE" != "default" ]; then
    aws s3api put-bucket-policy --bucket "$BUCKET_NAME" --policy file://bucket-policy.json --profile "$PROFILE" --region "$REGION"
else
    aws s3api put-bucket-policy --bucket "$BUCKET_NAME" --policy file://bucket-policy.json --region "$REGION"
fi

# Удаляем временный файл
rm bucket-policy.json

# =============================================================================
# ЗАВЕРШЕНИЕ
# =============================================================================

echo ""
echo "🎉 Деплой завершен успешно!"
echo ""
echo "📱 Ваше PWA доступно по адресам:"
echo "   🌐 HTTP:  http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"
echo "   🔒 HTTPS: https://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"
echo ""
echo "📋 Дополнительная информация:"
echo "   📦 Бакет: $BUCKET_NAME"
echo "   🌍 Регион: $REGION"
echo "   ⚙️ CORS: $([ "$ENABLE_CORS" = true ] && echo "Включен" || echo "Отключен")"
echo ""
echo "💡 Для настройки собственного домена:"
echo "   1. Создайте CloudFront распределение"
echo "   2. Настройте SSL сертификат"
echo "   3. Укажите свой домен в Route 53"
echo ""
echo "🔧 Для обновления приложения просто запустите этот скрипт снова"
