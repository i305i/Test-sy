#!/bin/bash

# سكريبت لإيقاف الخدمات الموجودة قبل تشغيل Docker
# استخدم: sudo bash STOP_EXISTING_SERVICES.sh

set -e

echo "🛑 إيقاف الخدمات الموجودة..."
echo ""

# إيقاف MinIO
if pgrep -f minio > /dev/null; then
    echo "🛑 إيقاف MinIO..."
    pkill -9 minio || killall -9 minio || true
    sleep 2
    echo "✅ تم إيقاف MinIO"
fi

# إيقاف PostgreSQL إذا كان يعمل كخدمة نظام
if systemctl is-active --quiet postgresql 2>/dev/null; then
    echo "🛑 إيقاف PostgreSQL (systemd)..."
    systemctl stop postgresql
    echo "✅ تم إيقاف PostgreSQL"
fi

# إيقاف Redis إذا كان يعمل كخدمة نظام
if systemctl is-active --quiet redis 2>/dev/null || systemctl is-active --quiet redis-server 2>/dev/null; then
    echo "🛑 إيقاف Redis (systemd)..."
    systemctl stop redis redis-server 2>/dev/null || true
    echo "✅ تم إيقاف Redis"
fi

# إيقاف أي عمليات Node.js على المنافذ 3000 و 5000
if lsof -ti :3000 > /dev/null 2>&1; then
    echo "🛑 إيقاف العملية على المنفذ 3000..."
    kill -9 $(lsof -ti :3000) 2>/dev/null || true
    echo "✅ تم إيقاف العملية"
fi

if lsof -ti :5000 > /dev/null 2>&1; then
    echo "🛑 إيقاف العملية على المنفذ 5000..."
    kill -9 $(lsof -ti :5000) 2>/dev/null || true
    echo "✅ تم إيقاف العملية"
fi

# إيقاف أي حاويات Docker قديمة
echo "🛑 إيقاف حاويات Docker القديمة..."
docker stop $(docker ps -q) 2>/dev/null || true

echo ""
echo "✅ تم إيقاف جميع الخدمات الموجودة"
echo ""
echo "🚀 الآن يمكنك تشغيل:"
echo "   docker compose up -d"
echo ""

