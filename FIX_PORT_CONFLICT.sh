#!/bin/bash

# سكريبت لإصلاح مشكلة تعارض المنافذ
# استخدم: sudo bash FIX_PORT_CONFLICT.sh

set -e

echo "🔍 التحقق من المنافذ المستخدمة..."
echo ""

# التحقق من المنفذ 9000
if lsof -i :9000 &> /dev/null || netstat -tuln | grep :9000 &> /dev/null; then
    echo "⚠️  المنفذ 9000 مستخدم!"
    echo ""
    echo "الخدمات التي تستخدم المنفذ 9000:"
    lsof -i :9000 2>/dev/null || netstat -tuln | grep :9000
    
    echo ""
    read -p "هل تريد إيقاف الخدمة التي تستخدم المنفذ 9000؟ (y/n): " STOP_SERVICE
    
    if [ "$STOP_SERVICE" = "y" ] || [ "$STOP_SERVICE" = "Y" ]; then
        # البحث عن العملية
        PID=$(lsof -ti :9000 2>/dev/null || netstat -tuln | grep :9000 | awk '{print $7}' | cut -d'/' -f1 | head -n1)
        
        if [ ! -z "$PID" ]; then
            echo "🛑 إيقاف العملية $PID..."
            kill -9 $PID 2>/dev/null || true
            sleep 2
            echo "✅ تم إيقاف العملية"
        else
            echo "⚠️  لم يتم العثور على العملية، قد تكون حاوية Docker"
            # البحث عن حاويات Docker تستخدم المنفذ
            CONTAINER=$(docker ps --format "{{.ID}}\t{{.Ports}}" | grep 9000 | awk '{print $1}' | head -n1)
            if [ ! -z "$CONTAINER" ]; then
                echo "🛑 إيقاف الحاوية $CONTAINER..."
                docker stop $CONTAINER
                echo "✅ تم إيقاف الحاوية"
            fi
        fi
    else
        echo "ℹ️  سيتم تغيير منفذ MinIO إلى 9002"
        # تحديث docker-compose.yml
        if [ -f "docker-compose.yml" ]; then
            sed -i 's/9000:9000/9002:9000/g' docker-compose.yml
            sed -i 's/MINIO_PORT:-9000/MINIO_PORT:-9002/g' docker-compose.yml
            echo "✅ تم تحديث docker-compose.yml"
        fi
    fi
fi

# التحقق من المنفذ 5000
if lsof -i :5000 &> /dev/null || netstat -tuln | grep :5000 &> /dev/null; then
    echo "⚠️  المنفذ 5000 مستخدم!"
    read -p "هل تريد إيقاف الخدمة؟ (y/n): " STOP_SERVICE
    if [ "$STOP_SERVICE" = "y" ] || [ "$STOP_SERVICE" = "Y" ]; then
        PID=$(lsof -ti :5000 2>/dev/null || netstat -tuln | grep :5000 | awk '{print $7}' | cut -d'/' -f1 | head -n1)
        if [ ! -z "$PID" ]; then
            kill -9 $PID 2>/dev/null || true
        fi
    fi
fi

# التحقق من المنفذ 3000
if lsof -i :3000 &> /dev/null || netstat -tuln | grep :3000 &> /dev/null; then
    echo "⚠️  المنفذ 3000 مستخدم!"
    read -p "هل تريد إيقاف الخدمة؟ (y/n): " STOP_SERVICE
    if [ "$STOP_SERVICE" = "y" ] || [ "$STOP_SERVICE" = "Y" ]; then
        PID=$(lsof -ti :3000 2>/dev/null || netstat -tuln | grep :3000 | awk '{print $7}' | cut -d'/' -f1 | head -n1)
        if [ ! -z "$PID" ]; then
            kill -9 $PID 2>/dev/null || true
        fi
    fi
fi

# التحقق من المنفذ 8080
if lsof -i :8080 &> /dev/null || netstat -tuln | grep :8080 &> /dev/null; then
    echo "⚠️  المنفذ 8080 مستخدم!"
    read -p "هل تريد إيقاف الخدمة؟ (y/n): " STOP_SERVICE
    if [ "$STOP_SERVICE" = "y" ] || [ "$STOP_SERVICE" = "Y" ]; then
        PID=$(lsof -ti :8080 2>/dev/null || netstat -tuln | grep :8080 | awk '{print $7}' | cut -d'/' -f1 | head -n1)
        if [ ! -z "$PID" ]; then
            kill -9 $PID 2>/dev/null || true
        fi
    fi
fi

echo ""
echo "✅ تم التحقق من جميع المنافذ"
echo ""
echo "🔄 الآن يمكنك تشغيل:"
echo "   docker compose up -d"
echo ""

