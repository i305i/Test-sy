#!/bin/bash

# سكريبت لإعداد قاعدة البيانات
# استخدم: bash SETUP_DATABASE.sh

set -e

echo "🗄️  بدء إعداد قاعدة البيانات..."
echo ""

# استخدام docker compose (الجديد) أو docker-compose (القديم)
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# التحقق من أن Backend يعمل
if ! docker ps | grep -q company-docs-backend; then
    echo "❌ Backend غير مشغل!"
    echo "قم بتشغيله أولاً:"
    echo "  docker compose up -d backend"
    exit 1
fi

echo "⏳ انتظار بدء Backend..."
echo "   (قد يستغرق وقتاً أطول في المرة الأولى لتثبيت المكتبات)"

# الانتظار حتى تبدأ الحاوية بشكل صحيح
MAX_ATTEMPTS=30
ATTEMPT=0
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if docker exec company-docs-backend echo "test" > /dev/null 2>&1; then
        echo "✅ Backend بدأ بنجاح"
        break
    fi
    ATTEMPT=$((ATTEMPT + 1))
    echo "   محاولة $ATTEMPT/$MAX_ATTEMPTS..."
    sleep 5
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo "⚠️  Backend لم يبدأ بعد، جاري التحقق من السجلات..."
    docker compose logs --tail=30 backend
    echo ""
    echo "💡 قد تحتاج إلى:"
    echo "   1. التحقق من ملف backend/.env"
    echo "   2. انتظار اكتمال تثبيت المكتبات"
    echo "   3. عرض السجلات: docker compose logs -f backend"
    exit 1
fi

# الانتظار قليلاً للتأكد من اكتمال التثبيت
echo "⏳ انتظار اكتمال تثبيت المكتبات (30 ثانية)..."
sleep 30

echo "📦 توليد Prisma Client..."
docker exec -it company-docs-backend sh -c "cd /app && npx prisma generate"

echo ""
echo "🔄 تشغيل Migrations..."
docker exec -it company-docs-backend sh -c "cd /app && npx prisma migrate deploy"

echo ""
echo "🌱 Seed البيانات..."
docker exec -it company-docs-backend sh -c "cd /app && npm run seed"

echo ""
echo "=========================================="
echo "✅ تم إعداد قاعدة البيانات بنجاح!"
echo "=========================================="
echo ""
echo "📋 بيانات الدخول الافتراضية:"
echo "  - Admin: admin@companydocs.com / Admin@123"
echo "  - Employee: employee@companydocs.com / Employee@123"
echo ""
echo "🌐 افتح المتصفح وانتقل إلى:"
echo "  http://$(hostname -I | awk '{print $1}'):3000"
echo ""

