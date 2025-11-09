#!/bin/bash

# سكريبت شامل لتثبيت وتشغيل النظام الكامل
# يشمل: Docker, PostgreSQL, Redis, MinIO, Backend, Frontend, OnlyOffice
# استخدم: sudo bash SETUP_FULL_SYSTEM.sh

set -e

echo "🚀 بدء إعداد النظام الكامل..."
echo ""

# التحقق من أن المستخدم root أو لديه صلاحيات sudo
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  يجب تشغيل السكريبت كـ root أو باستخدام sudo"
    echo "استخدم: sudo bash SETUP_FULL_SYSTEM.sh"
    exit 1
fi

# ============================================================================
# الخطوة 1: تثبيت Docker
# ============================================================================

echo "📦 الخطوة 1: تثبيت Docker..."

if command -v docker &> /dev/null; then
    echo "✅ Docker مثبت بالفعل"
    docker --version
else
    echo "🔄 تثبيت Docker..."
    
    # تحديث النظام
    apt update
    
    # تثبيت المتطلبات
    apt install -y \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # إضافة Docker's official GPG key
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    
    # إضافة Docker repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # تحديث apt
    apt update
    
    # تثبيت Docker
    apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # بدء Docker service
    systemctl start docker
    systemctl enable docker
    
    echo "✅ تم تثبيت Docker بنجاح!"
fi

echo ""

# ============================================================================
# الخطوة 2: الحصول على معلومات الإعداد
# ============================================================================

echo "📋 الخطوة 2: معلومات الإعداد..."

# سؤال عن عنوان IP السيرفر
read -p "🌐 أدخل عنوان IP السيرفر (مثال: 93.127.160.182): " SERVER_IP

if [ -z "$SERVER_IP" ]; then
    echo "⚠️  لم يتم إدخال عنوان IP، سيتم استخدام localhost"
    SERVER_IP="localhost"
fi

# سؤال عن JWT Secret
read -p "🔐 أدخل JWT Secret (أو اضغط Enter لإنشاء مفتاح عشوائي): " JWT_SECRET

if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32 | tr -d '\n')
    echo "✅ تم إنشاء مفتاح عشوائي: $JWT_SECRET"
fi

# سؤال عن OnlyOffice JWT Secret (يمكن أن يكون نفس المفتاح)
read -p "🔐 أدخل OnlyOffice JWT Secret (أو اضغط Enter لاستخدام نفس المفتاح): " ONLYOFFICE_JWT_SECRET

if [ -z "$ONLYOFFICE_JWT_SECRET" ]; then
    ONLYOFFICE_JWT_SECRET="$JWT_SECRET"
fi

# سؤال عن كلمة مرور قاعدة البيانات
read -p "🗄️  أدخل كلمة مرور قاعدة البيانات (أو اضغط Enter للاستخدام الافتراضي): " DB_PASSWORD

if [ -z "$DB_PASSWORD" ]; then
    DB_PASSWORD="postgres123"
fi

# سؤال عن كلمة مرور Redis
read -p "🔴 أدخل كلمة مرور Redis (أو اضغط Enter للاستخدام الافتراضي): " REDIS_PASSWORD

if [ -z "$REDIS_PASSWORD" ]; then
    REDIS_PASSWORD="redis123"
fi

# سؤال عن كلمة مرور MinIO
read -p "📦 أدخل كلمة مرور MinIO (أو اضغط Enter للاستخدام الافتراضي): " MINIO_PASSWORD

if [ -z "$MINIO_PASSWORD" ]; then
    MINIO_PASSWORD="minioadmin123"
fi

echo ""

# ============================================================================
# الخطوة 3: إنشاء مجلدات OnlyOffice
# ============================================================================

echo "📁 الخطوة 3: إنشاء مجلدات OnlyOffice..."

mkdir -p /app/onlyoffice/DocumentServer/{logs,data,lib,db}
chown -R root:root /app/onlyoffice
chmod -R 755 /app/onlyoffice

echo "✅ تم إنشاء المجلدات بنجاح!"
echo ""

# ============================================================================
# الخطوة 4: إضافة OnlyOffice إلى docker-compose.yml
# ============================================================================

echo "📝 الخطوة 4: إعداد docker-compose.yml..."

# التحقق من وجود docker-compose.yml
if [ ! -f "docker-compose.yml" ]; then
    echo "⚠️  ملف docker-compose.yml غير موجود، سيتم إنشاؤه..."
    # يمكنك نسخ docker-compose.yml الأساسي هنا إذا لزم الأمر
fi

# إضافة OnlyOffice إلى docker-compose.yml إذا لم يكن موجوداً
if ! grep -q "onlyoffice:" docker-compose.yml 2>/dev/null; then
    echo "➕ إضافة OnlyOffice إلى docker-compose.yml..."
    
    # إضافة OnlyOffice service قبل networks section
    cat >> docker-compose.yml << EOF

  # OnlyOffice Document Server
  onlyoffice:
    image: onlyoffice/documentserver
    container_name: company-docs-onlyoffice
    restart: unless-stopped
    ports:
      - "8080:80"
    volumes:
      - /app/onlyoffice/DocumentServer/logs:/var/log/onlyoffice
      - /app/onlyoffice/DocumentServer/data:/var/www/onlyoffice/Data
      - /app/onlyoffice/DocumentServer/lib:/var/lib/onlyoffice
      - /app/onlyoffice/DocumentServer/db:/var/lib/postgresql
    environment:
      - JWT_ENABLED=true
      - JWT_SECRET=$ONLYOFFICE_JWT_SECRET
    networks:
      - company-docs-network
EOF
    
    echo "✅ تم إضافة OnlyOffice إلى docker-compose.yml"
else
    echo "✅ OnlyOffice موجود بالفعل في docker-compose.yml"
fi

echo ""

# ============================================================================
# الخطوة 5: إنشاء ملف .env
# ============================================================================

echo "📝 الخطوة 5: إعداد ملف .env..."

# إنشاء ملف .env إذا لم يكن موجوداً
if [ ! -f ".env" ]; then
    cat > .env << EOF
# Server
NODE_ENV=production
PORT=5000

# Database
DB_USER=postgres
DB_PASSWORD=$DB_PASSWORD
DB_NAME=company_docs
DB_PORT=5432

# Redis
REDIS_PASSWORD=$REDIS_PASSWORD
REDIS_PORT=6379

# MinIO
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=$MINIO_PASSWORD
MINIO_PORT=9000
MINIO_CONSOLE_PORT=9001

# JWT
JWT_SECRET=$JWT_SECRET
JWT_EXPIRY=15m
JWT_REFRESH_SECRET=$JWT_SECRET
JWT_REFRESH_EXPIRY=7d

# OnlyOffice
ONLYOFFICE_DOCUMENT_SERVER_URL=http://$SERVER_IP:8080
ONLYOFFICE_SECRET=$ONLYOFFICE_JWT_SECRET
BACKEND_URL=http://$SERVER_IP:5000
FRONTEND_URL=http://$SERVER_IP:3000

# Frontend
NEXT_PUBLIC_API_URL=http://$SERVER_IP:5000/api/v1
NEXT_PUBLIC_ONLYOFFICE_DOCUMENT_SERVER_URL=http://$SERVER_IP:8080
NEXT_PUBLIC_APP_NAME=نظام إدارة الشركات والوثائق
NEXT_PUBLIC_APP_URL=http://$SERVER_IP:3000
EOF
    
    echo "✅ تم إنشاء ملف .env"
else
    echo "✅ ملف .env موجود بالفعل"
    echo "⚠️  تأكد من تحديث متغيرات OnlyOffice فيه:"
    echo "   ONLYOFFICE_DOCUMENT_SERVER_URL=http://$SERVER_IP:8080"
    echo "   ONLYOFFICE_SECRET=$ONLYOFFICE_JWT_SECRET"
    echo "   BACKEND_URL=http://$SERVER_IP:5000"
fi

echo ""

# ============================================================================
# الخطوة 6: تحديث ملفات .env في Backend و Frontend
# ============================================================================

echo "📝 الخطوة 6: تحديث ملفات .env في Backend و Frontend..."

# Backend .env
if [ -d "backend" ]; then
    if [ ! -f "backend/.env" ]; then
        cp backend/env.example.txt backend/.env 2>/dev/null || true
    fi
    
    # تحديث متغيرات OnlyOffice في Backend
    if [ -f "backend/.env" ]; then
        sed -i "s|ONLYOFFICE_DOCUMENT_SERVER_URL=.*|ONLYOFFICE_DOCUMENT_SERVER_URL=http://$SERVER_IP:8080|g" backend/.env 2>/dev/null || true
        sed -i "s|ONLYOFFICE_SECRET=.*|ONLYOFFICE_SECRET=$ONLYOFFICE_JWT_SECRET|g" backend/.env 2>/dev/null || true
        sed -i "s|BACKEND_URL=.*|BACKEND_URL=http://$SERVER_IP:5000|g" backend/.env 2>/dev/null || true
        
        # إضافة المتغيرات إذا لم تكن موجودة
        if ! grep -q "ONLYOFFICE_DOCUMENT_SERVER_URL" backend/.env; then
            echo "" >> backend/.env
            echo "# OnlyOffice Document Server" >> backend/.env
            echo "ONLYOFFICE_DOCUMENT_SERVER_URL=http://$SERVER_IP:8080" >> backend/.env
            echo "ONLYOFFICE_SECRET=$ONLYOFFICE_JWT_SECRET" >> backend/.env
            echo "BACKEND_URL=http://$SERVER_IP:5000" >> backend/.env
        fi
        
        echo "✅ تم تحديث backend/.env"
    fi
fi

# Frontend .env.local
if [ -d "frontend" ]; then
    if [ ! -f "frontend/.env.local" ]; then
        touch frontend/.env.local
    fi
    
    # تحديث متغيرات OnlyOffice في Frontend
    sed -i "s|NEXT_PUBLIC_ONLYOFFICE_DOCUMENT_SERVER_URL=.*|NEXT_PUBLIC_ONLYOFFICE_DOCUMENT_SERVER_URL=http://$SERVER_IP:8080|g" frontend/.env.local 2>/dev/null || true
    sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=http://$SERVER_IP:5000/api/v1|g" frontend/.env.local 2>/dev/null || true
    
    # إضافة المتغيرات إذا لم تكن موجودة
    if ! grep -q "NEXT_PUBLIC_ONLYOFFICE_DOCUMENT_SERVER_URL" frontend/.env.local; then
        echo "" >> frontend/.env.local
        echo "# OnlyOffice Document Server" >> frontend/.env.local
        echo "NEXT_PUBLIC_ONLYOFFICE_DOCUMENT_SERVER_URL=http://$SERVER_IP:8080" >> frontend/.env.local
    fi
    
    if ! grep -q "NEXT_PUBLIC_API_URL" frontend/.env.local; then
        echo "NEXT_PUBLIC_API_URL=http://$SERVER_IP:5000/api/v1" >> frontend/.env.local
    fi
    
    echo "✅ تم تحديث frontend/.env.local"
fi

echo ""

# ============================================================================
# الخطوة 7: فتح المنافذ
# ============================================================================

echo "🔥 الخطوة 7: فتح المنافذ في Firewall..."

if command -v ufw &> /dev/null; then
    ufw allow 8080/tcp  # OnlyOffice
    ufw allow 5000/tcp  # Backend
    ufw allow 3000/tcp  # Frontend
    ufw allow 5432/tcp  # PostgreSQL
    ufw allow 6379/tcp  # Redis
    ufw allow 9000/tcp  # MinIO
    ufw allow 9001/tcp  # MinIO Console
    echo "✅ تم فتح المنافذ"
else
    echo "⚠️  ufw غير مثبت، تأكد من فتح المنافذ يدوياً"
fi

echo ""

# ============================================================================
# الخطوة 8: تشغيل الخدمات
# ============================================================================

echo "🚀 الخطوة 8: تشغيل الخدمات..."

# سؤال عن تشغيل الخدمات الآن
read -p "❓ هل تريد تشغيل جميع الخدمات الآن؟ (y/n): " START_SERVICES

if [ "$START_SERVICES" = "y" ] || [ "$START_SERVICES" = "Y" ]; then
    echo "🔄 تشغيل الخدمات..."
    
    # تشغيل الخدمات الأساسية أولاً
    echo "📦 تشغيل PostgreSQL, Redis, MinIO..."
    docker compose up -d postgres redis minio minio-client
    
    # الانتظار حتى تكون الخدمات جاهزة
    echo "⏳ انتظار بدء الخدمات الأساسية..."
    sleep 15
    
    # تشغيل OnlyOffice
    echo "📄 تشغيل OnlyOffice..."
    docker compose up -d onlyoffice
    
    # الانتظار قليلاً
    sleep 10
    
    # تشغيل Backend و Frontend
    echo "🔧 تشغيل Backend و Frontend..."
    docker compose up -d backend frontend
    
    echo "✅ تم تشغيل جميع الخدمات!"
    echo ""
    echo "⏳ انتظار بدء الخدمات (30 ثانية)..."
    sleep 30
    
    # عرض حالة الخدمات
    echo ""
    echo "📊 حالة الخدمات:"
    docker compose ps
    
    echo ""
    echo "🧪 اختبار الخدمات..."
    
    # اختبار OnlyOffice
    HEALTH_CHECK=$(curl -s http://localhost:8080/healthcheck || echo "failed")
    if [ "$HEALTH_CHECK" = "true" ]; then
        echo "✅ OnlyOffice يعمل بشكل صحيح!"
    else
        echo "⚠️  OnlyOffice لم يبدأ بعد، انتظر قليلاً"
    fi
    
    # اختبار Backend
    BACKEND_CHECK=$(curl -s http://localhost:5000/api/v1/health || echo "failed")
    if [ "$BACKEND_CHECK" != "failed" ]; then
        echo "✅ Backend يعمل بشكل صحيح!"
    else
        echo "⚠️  Backend لم يبدأ بعد، انتظر قليلاً"
    fi
    
    # اختبار Frontend
    FRONTEND_CHECK=$(curl -s http://localhost:3000 || echo "failed")
    if [ "$FRONTEND_CHECK" != "failed" ]; then
        echo "✅ Frontend يعمل بشكل صحيح!"
    else
        echo "⚠️  Frontend لم يبدأ بعد، انتظر قليلاً"
    fi
else
    echo "ℹ️  يمكنك تشغيل الخدمات لاحقاً باستخدام:"
    echo "   docker compose up -d"
fi

echo ""

# ============================================================================
# الخطوة 9: عرض المعلومات النهائية
# ============================================================================

echo "=========================================="
echo "✅ تم الإعداد بنجاح!"
echo "=========================================="
echo ""
echo "📋 معلومات الإعداد:"
echo "  - Server IP: $SERVER_IP"
echo "  - OnlyOffice URL: http://$SERVER_IP:8080"
echo "  - Backend URL: http://$SERVER_IP:5000"
echo "  - Frontend URL: http://$SERVER_IP:3000"
echo "  - JWT Secret: $JWT_SECRET"
echo "  - OnlyOffice JWT Secret: $ONLYOFFICE_JWT_SECRET"
echo ""
echo "🔧 أوامر مفيدة:"
echo "  - تشغيل جميع الخدمات: docker compose up -d"
echo "  - إيقاف جميع الخدمات: docker compose down"
echo "  - عرض السجلات: docker compose logs -f"
echo "  - عرض حالة الخدمات: docker compose ps"
echo "  - إعادة تشغيل خدمة: docker compose restart [service-name]"
echo ""
echo "📝 الخطوات التالية:"
echo "  1. انتظر حتى تبدأ جميع الخدمات (قد يستغرق دقيقة أو دقيقتين)"
echo "  2. قم بإعداد قاعدة البيانات:"
echo "     cd backend"
echo "     npx prisma generate"
echo "     npx prisma migrate deploy"
echo "     npm run seed"
echo "  3. افتح المتصفح وانتقل إلى: http://$SERVER_IP:3000"
echo ""
echo "📚 للمزيد من المعلومات، راجع:"
echo "  - ONLYOFFICE_SERVER_SETUP.md"
echo "  - SETUP_ON_SERVER.md"
echo ""

