#!/bin/bash

# سكريبت للتحقق من سجلات Backend وإصلاح المشاكل
# استخدم: bash CHECK_BACKEND_LOGS.sh

set -e

echo "🔍 فحص سجلات Backend..."
echo ""

# عرض آخر 50 سطر من السجلات
echo "📋 آخر 50 سطر من سجلات Backend:"
echo "=========================================="
docker compose logs --tail=50 backend
echo "=========================================="
echo ""

# التحقق من حالة الحاوية
echo "📊 حالة Backend:"
docker compose ps backend

echo ""
echo "🔧 محاولات الإصلاح:"
echo ""

# التحقق من node_modules
echo "1️⃣ التحقق من node_modules..."
if docker exec company-docs-backend ls /app/node_modules > /dev/null 2>&1; then
    echo "   ✅ node_modules موجود"
else
    echo "   ⚠️  node_modules غير موجود، جاري التثبيت..."
    docker exec company-docs-backend sh -c "cd /app && npm install"
fi

echo ""
echo "2️⃣ التحقق من ملف .env..."
if docker exec company-docs-backend test -f /app/.env; then
    echo "   ✅ ملف .env موجود"
else
    echo "   ⚠️  ملف .env غير موجود!"
    echo "   قم بإنشاء ملف backend/.env من env.example.txt"
fi

echo ""
echo "3️⃣ التحقق من Prisma..."
if docker exec company-docs-backend test -f /app/prisma/schema.prisma; then
    echo "   ✅ Prisma schema موجود"
else
    echo "   ❌ Prisma schema غير موجود!"
fi

echo ""
echo "💡 نصائح:"
echo "  - إذا كان الخطأ متعلق بـ node_modules، انتظر حتى يكتمل التثبيت"
echo "  - إذا كان الخطأ متعلق بـ .env، تأكد من وجود الملف"
echo "  - إذا كان الخطأ متعلق بـ Prisma، قم بتشغيل: npx prisma generate"
echo ""
echo "📋 لعرض السجلات بشكل مستمر:"
echo "   docker compose logs -f backend"
echo ""

