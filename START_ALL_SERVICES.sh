#!/bin/bash

# سكريبت سريع لتشغيل جميع الخدمات
# استخدم: bash START_ALL_SERVICES.sh

set -e

echo "🚀 بدء تشغيل جميع الخدمات..."
echo ""

# التحقق من وجود Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker غير مثبت!"
    echo "قم بتثبيت Docker أولاً:"
    echo "  sudo apt update && sudo apt install -y docker.io"
    exit 1
fi

# التحقق من وجود docker-compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose غير مثبت!"
    echo "قم بتثبيت Docker Compose أولاً"
    exit 1
fi

# استخدام docker compose (الجديد) أو docker-compose (القديم)
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

echo "📦 تشغيل الخدمات الأساسية (PostgreSQL, Redis, MinIO)..."
$DOCKER_COMPOSE up -d postgres redis minio minio-client

echo "⏳ انتظار بدء الخدمات الأساسية (30 ثانية)..."
sleep 30

echo "📄 تشغيل OnlyOffice..."
$DOCKER_COMPOSE up -d onlyoffice

echo "⏳ انتظار بدء OnlyOffice (15 ثانية)..."
sleep 15

echo "🔧 تشغيل Backend..."
$DOCKER_COMPOSE up -d backend

echo "⏳ انتظار بدء Backend (20 ثانية)..."
sleep 20

echo "🎨 تشغيل Frontend..."
$DOCKER_COMPOSE up -d frontend

echo "⏳ انتظار بدء Frontend (30 ثانية)..."
sleep 30

echo ""
echo "=========================================="
echo "✅ تم تشغيل جميع الخدمات!"
echo "=========================================="
echo ""
echo "📊 حالة الخدمات:"
$DOCKER_COMPOSE ps

echo ""
echo "🧪 اختبار الخدمات..."

# اختبار OnlyOffice
echo -n "  - OnlyOffice: "
HEALTH_CHECK=$(curl -s http://localhost:8080/healthcheck 2>/dev/null || echo "failed")
if [ "$HEALTH_CHECK" = "true" ]; then
    echo "✅ يعمل"
else
    echo "⚠️  لم يبدأ بعد"
fi

# اختبار Backend
echo -n "  - Backend: "
BACKEND_CHECK=$(curl -s http://localhost:5000/api/v1/health 2>/dev/null || echo "failed")
if [ "$BACKEND_CHECK" != "failed" ]; then
    echo "✅ يعمل"
else
    echo "⚠️  لم يبدأ بعد"
fi

# اختبار Frontend
echo -n "  - Frontend: "
FRONTEND_CHECK=$(curl -s http://localhost:3000 2>/dev/null | head -n 1 || echo "failed")
if [ "$FRONTEND_CHECK" != "failed" ]; then
    echo "✅ يعمل"
else
    echo "⚠️  لم يبدأ بعد"
fi

echo ""
echo "🌐 الروابط:"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend API: http://localhost:5000/api/v1"
echo "  - OnlyOffice: http://localhost:8080"
echo "  - MinIO Console: http://localhost:9001"
echo ""
echo "📝 الخطوات التالية:"
echo "  1. انتظر حتى تبدأ جميع الخدمات (قد يستغرق دقيقة أو دقيقتين)"
echo "  2. قم بإعداد قاعدة البيانات:"
echo "     cd backend"
echo "     npx prisma generate"
echo "     npx prisma migrate deploy"
echo "     npm run seed"
echo ""
echo "🔧 أوامر مفيدة:"
echo "  - عرض السجلات: $DOCKER_COMPOSE logs -f"
echo "  - إيقاف الخدمات: $DOCKER_COMPOSE down"
echo "  - إعادة تشغيل: $DOCKER_COMPOSE restart"
echo ""

