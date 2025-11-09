#!/bin/bash

# سكريبت لإصلاح مشكلة تثبيت المكتبات في Backend
# استخدم: bash FIX_BACKEND_INSTALL.sh

set -e

echo "🔧 إصلاح مشكلة تثبيت المكتبات في Backend..."
echo ""

# إيقاف Backend
echo "🛑 إيقاف Backend..."
docker compose stop backend

# حذف volume node_modules لإعادة التثبيت
echo "🗑️  حذف node_modules volume..."
docker volume rm test-sy_backend_node_modules 2>/dev/null || true

# إعادة تشغيل Backend
echo "🚀 إعادة تشغيل Backend..."
docker compose up -d backend

echo ""
echo "⏳ انتظار تثبيت المكتبات (قد يستغرق 5-10 دقائق)..."
echo "   راقب السجلات: docker compose logs -f backend"
echo ""

# عرض السجلات
echo "📋 عرض السجلات (اضغط Ctrl+C للخروج):"
sleep 5
docker compose logs -f backend

