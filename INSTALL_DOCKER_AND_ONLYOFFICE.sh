#!/bin/bash

# دليل تثبيت Docker و OnlyOffice Document Server على السيرفر
# استخدم: bash INSTALL_DOCKER_AND_ONLYOFFICE.sh

set -e

echo "🚀 بدء تثبيت Docker و OnlyOffice Document Server..."
echo ""

# التحقق من أن المستخدم root أو لديه صلاحيات sudo
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  يجب تشغيل السكريبت كـ root أو باستخدام sudo"
    echo "استخدم: sudo bash INSTALL_DOCKER_AND_ONLYOFFICE.sh"
    exit 1
fi

# ============================================================================
# الخطوة 1: تثبيت Docker
# ============================================================================

echo "📦 الخطوة 1: تثبيت Docker..."

# تحديث النظام
echo "🔄 تحديث النظام..."
apt update

# تثبيت المتطلبات
echo "📦 تثبيت المتطلبات..."
apt install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# إضافة Docker's official GPG key
echo "🔑 إضافة Docker GPG key..."
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# إضافة Docker repository
echo "📦 إضافة Docker repository..."
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# تحديث apt مرة أخرى
apt update

# تثبيت Docker
echo "📦 تثبيت Docker..."
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# بدء Docker service
echo "🔄 بدء Docker service..."
systemctl start docker
systemctl enable docker

# التحقق من تثبيت Docker
echo "✅ التحقق من تثبيت Docker..."
docker --version
docker compose version

echo ""
echo "✅ تم تثبيت Docker بنجاح!"
echo ""

# ============================================================================
# الخطوة 2: إنشاء مجلدات OnlyOffice
# ============================================================================

echo "📁 الخطوة 2: إنشاء مجلدات OnlyOffice..."

# إنشاء المجلدات
mkdir -p /app/onlyoffice/DocumentServer/{logs,data,lib,db}

# تعيين الصلاحيات
chown -R root:root /app/onlyoffice
chmod -R 755 /app/onlyoffice

echo "✅ تم إنشاء المجلدات بنجاح!"
echo ""

# ============================================================================
# الخطوة 3: تثبيت OnlyOffice Document Server
# ============================================================================

echo "📦 الخطوة 3: تثبيت OnlyOffice Document Server..."

# سؤال عن عنوان IP السيرفر
read -p "🌐 أدخل عنوان IP السيرفر (مثال: 93.127.160.182): " SERVER_IP

if [ -z "$SERVER_IP" ]; then
    echo "⚠️  لم يتم إدخال عنوان IP، سيتم استخدام localhost"
    SERVER_IP="localhost"
fi

# سؤال عن JWT Secret
read -p "🔐 أدخل JWT Secret (أو اضغط Enter لاستخدام المفتاح الافتراضي): " JWT_SECRET

if [ -z "$JWT_SECRET" ]; then
    # إنشاء مفتاح عشوائي
    JWT_SECRET=$(openssl rand -base64 32 | tr -d '\n')
    echo "✅ تم إنشاء مفتاح عشوائي: $JWT_SECRET"
fi

# تشغيل OnlyOffice Document Server
echo "🚀 تشغيل OnlyOffice Document Server..."
docker run -i -t -d -p 8080:80 --restart=always \
  --name onlyoffice-documentserver \
  -v /app/onlyoffice/DocumentServer/logs:/var/log/onlyoffice \
  -v /app/onlyoffice/DocumentServer/data:/var/www/onlyoffice/Data \
  -v /app/onlyoffice/DocumentServer/lib:/var/lib/onlyoffice \
  -v /app/onlyoffice/DocumentServer/db:/var/lib/postgresql \
  -e JWT_ENABLED=true \
  -e JWT_SECRET="$JWT_SECRET" \
  onlyoffice/documentserver

# الانتظار قليلاً حتى يبدأ OnlyOffice
echo "⏳ انتظار بدء OnlyOffice..."
sleep 10

# التحقق من الحالة
echo "🔍 التحقق من حالة OnlyOffice..."
docker ps | grep onlyoffice || echo "⚠️  OnlyOffice لم يبدأ بعد، انتظر قليلاً..."

# ============================================================================
# الخطوة 4: فتح المنافذ
# ============================================================================

echo ""
echo "🔥 الخطوة 4: فتح المنافذ في Firewall..."

# التحقق من وجود ufw
if command -v ufw &> /dev/null; then
    ufw allow 8080/tcp
    echo "✅ تم فتح المنفذ 8080"
else
    echo "⚠️  ufw غير مثبت، تأكد من فتح المنفذ 8080 يدوياً"
fi

# ============================================================================
# الخطوة 5: اختبار OnlyOffice
# ============================================================================

echo ""
echo "🧪 الخطوة 5: اختبار OnlyOffice..."

# الانتظار قليلاً
sleep 5

# اختبار Health Check
echo "🔍 اختبار Health Check..."
HEALTH_CHECK=$(curl -s http://localhost:8080/healthcheck || echo "failed")

if [ "$HEALTH_CHECK" = "true" ]; then
    echo "✅ OnlyOffice يعمل بشكل صحيح!"
else
    echo "⚠️  OnlyOffice لم يبدأ بعد، انتظر قليلاً ثم جرب:"
    echo "   curl http://localhost:8080/healthcheck"
fi

# ============================================================================
# الخطوة 6: عرض المعلومات
# ============================================================================

echo ""
echo "=========================================="
echo "✅ تم التثبيت بنجاح!"
echo "=========================================="
echo ""
echo "📋 معلومات الإعداد:"
echo "  - OnlyOffice URL: http://$SERVER_IP:8080"
echo "  - JWT Secret: $JWT_SECRET"
echo "  - Health Check: http://$SERVER_IP:8080/healthcheck"
echo ""
echo "📝 متغيرات البيئة المطلوبة:"
echo ""
echo "Backend (.env):"
echo "  ONLYOFFICE_DOCUMENT_SERVER_URL=http://$SERVER_IP:8080"
echo "  ONLYOFFICE_SECRET=$JWT_SECRET"
echo "  BACKEND_URL=http://$SERVER_IP:5000"
echo ""
echo "Frontend (.env.local):"
echo "  NEXT_PUBLIC_ONLYOFFICE_DOCUMENT_SERVER_URL=http://$SERVER_IP:8080"
echo ""
echo "🔧 أوامر مفيدة:"
echo "  - عرض السجلات: docker logs onlyoffice-documentserver"
echo "  - إيقاف: docker stop onlyoffice-documentserver"
echo "  - بدء: docker start onlyoffice-documentserver"
echo "  - إعادة تشغيل: docker restart onlyoffice-documentserver"
echo "  - حذف: docker rm -f onlyoffice-documentserver"
echo ""
echo "📚 للمزيد من المعلومات، راجع: ONLYOFFICE_SERVER_SETUP.md"
echo ""

