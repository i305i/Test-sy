#!/bin/bash

# سكريبت لإيقاف وتعطيل خدمة MinIO من systemd
# استخدم: sudo bash STOP_MINIO_SERVICE.sh

set -e

echo "🛑 إيقاف خدمة MinIO من systemd..."
echo ""

# إيقاف خدمة MinIO
if systemctl is-active --quiet minio 2>/dev/null; then
    echo "🛑 إيقاف خدمة MinIO..."
    systemctl stop minio
    echo "✅ تم إيقاف خدمة MinIO"
elif systemctl is-active --quiet minio-server 2>/dev/null; then
    echo "🛑 إيقاف خدمة MinIO Server..."
    systemctl stop minio-server
    echo "✅ تم إيقاف خدمة MinIO Server"
fi

# تعطيل خدمة MinIO (لعدم تشغيلها تلقائياً)
if systemctl is-enabled --quiet minio 2>/dev/null; then
    echo "🚫 تعطيل خدمة MinIO (لعدم التشغيل التلقائي)..."
    systemctl disable minio
    echo "✅ تم تعطيل خدمة MinIO"
elif systemctl is-enabled --quiet minio-server 2>/dev/null; then
    echo "🚫 تعطيل خدمة MinIO Server..."
    systemctl disable minio-server
    echo "✅ تم تعطيل خدمة MinIO Server"
fi

# إيقاف أي عمليات MinIO تعمل
if pgrep -f minio > /dev/null; then
    echo "🛑 إيقاف عمليات MinIO..."
    pkill -9 minio || killall -9 minio || true
    sleep 2
    echo "✅ تم إيقاف عمليات MinIO"
fi

# التحقق من المنفذ 9000
if lsof -i :9000 > /dev/null 2>&1; then
    echo "⚠️  المنفذ 9000 لا يزال مستخدماً!"
    echo "العمليات التي تستخدم المنفذ:"
    lsof -i :9000
    echo ""
    read -p "هل تريد إيقاف هذه العمليات؟ (y/n): " KILL_PROCESSES
    if [ "$KILL_PROCESSES" = "y" ] || [ "$KILL_PROCESSES" = "Y" ]; then
        lsof -ti :9000 | xargs kill -9 2>/dev/null || true
        echo "✅ تم إيقاف العمليات"
    fi
else
    echo "✅ المنفذ 9000 أصبح فارغاً"
fi

echo ""
echo "=========================================="
echo "✅ تم إيقاف وتعطيل خدمة MinIO!"
echo "=========================================="
echo ""
echo "📋 ما تم عمله:"
echo "  ✅ إيقاف خدمة MinIO من systemd"
echo "  ✅ تعطيل التشغيل التلقائي"
echo "  ✅ إيقاف جميع عمليات MinIO"
echo ""
echo "🚀 الآن يمكنك تشغيل MinIO مع Docker:"
echo "   docker compose up -d minio"
echo "   أو"
echo "   docker compose up -d"
echo ""
echo "⚠️  ملاحظة: MinIO سيعمل الآن فقط مع Docker ولن يفتح تلقائياً"
echo ""

