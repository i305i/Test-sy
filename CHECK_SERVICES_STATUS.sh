#!/bin/bash

# سكريبت للتحقق من حالة جميع الخدمات
# استخدم: bash CHECK_SERVICES_STATUS.sh

set -e

echo "🔍 التحقق من حالة جميع الخدمات..."
echo ""

# استخدام docker compose (الجديد) أو docker-compose (القديم)
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

echo "📊 حالة الحاويات:"
$DOCKER_COMPOSE ps

echo ""
echo "🧪 اختبار الخدمات..."

# اختبار PostgreSQL
echo -n "  - PostgreSQL: "
if docker exec company-docs-postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ يعمل"
else
    echo "❌ لا يعمل"
fi

# اختبار Redis
echo -n "  - Redis: "
if docker exec company-docs-redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ يعمل"
else
    echo "❌ لا يعمل"
fi

# اختبار MinIO
echo -n "  - MinIO: "
MINIO_CHECK=$(curl -s http://localhost:9000/minio/health/live 2>/dev/null || echo "failed")
if [ "$MINIO_CHECK" != "failed" ]; then
    echo "✅ يعمل"
else
    echo "⚠️  لم يبدأ بعد"
fi

# اختبار OnlyOffice
echo -n "  - OnlyOffice: "
HEALTH_CHECK=$(curl -s http://localhost:8080/healthcheck 2>/dev/null || echo "failed")
if [ "$HEALTH_CHECK" = "true" ]; then
    echo "✅ يعمل"
else
    echo "⚠️  لم يبدأ بعد (قد يحتاج وقت أطول)"
fi

# اختبار Backend
echo -n "  - Backend: "
BACKEND_CHECK=$(curl -s http://localhost:5000/api/v1/health 2>/dev/null || echo "failed")
if [ "$BACKEND_CHECK" != "failed" ]; then
    echo "✅ يعمل"
else
    echo "⚠️  لم يبدأ بعد (جاري تثبيت المكتبات...)"
fi

# اختبار Frontend
echo -n "  - Frontend: "
FRONTEND_CHECK=$(curl -s http://localhost:3000 2>/dev/null | head -n 1 || echo "failed")
if [ "$FRONTEND_CHECK" != "failed" ]; then
    echo "✅ يعمل"
else
    echo "⚠️  لم يبدأ بعد (جاري تثبيت المكتبات...)"
fi

echo ""
echo "🌐 الروابط:"
echo "  - Frontend: http://$(hostname -I | awk '{print $1}'):3000"
echo "  - Backend API: http://$(hostname -I | awk '{print $1}'):5000/api/v1"
echo "  - OnlyOffice: http://$(hostname -I | awk '{print $1}'):8080"
echo "  - MinIO Console: http://$(hostname -I | awk '{print $1}'):9001"
echo ""
echo "📝 الخطوات التالية:"
echo "  1. انتظر دقيقة أو دقيقتين حتى يكتمل تثبيت المكتبات في Backend و Frontend"
echo "  2. قم بإعداد قاعدة البيانات:"
echo "     docker exec -it company-docs-backend sh -c 'cd /app && npx prisma generate && npx prisma migrate deploy && npm run seed'"
echo ""
echo "📋 عرض السجلات:"
echo "  - Backend: docker compose logs -f backend"
echo "  - Frontend: docker compose logs -f frontend"
echo "  - OnlyOffice: docker compose logs -f onlyoffice"
echo ""

