#!/bin/bash

# سكريبت تثبيت OnlyOffice Document Server بدون Docker
# استخدم: sudo bash SETUP_ONLYOFFICE_MANUAL.sh

set -e

echo "🚀 بدء تثبيت OnlyOffice Document Server (بدون Docker)..."
echo ""

# التحقق من أن المستخدم root
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  يجب تشغيل السكريبت كـ root"
    echo "استخدم: sudo bash SETUP_ONLYOFFICE_MANUAL.sh"
    exit 1
fi

# ============================================================================
# الخطوة 1: تثبيت المتطلبات
# ============================================================================

echo "📦 الخطوة 1: تثبيت المتطلبات..."

apt update
apt install -y \
    curl \
    wget \
    gnupg2 \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    lsb-release

echo "✅ تم تثبيت المتطلبات"
echo ""

# ============================================================================
# الخطوة 2: إضافة مستودع OnlyOffice
# ============================================================================

echo "📦 الخطوة 2: إضافة مستودع OnlyOffice..."

# إضافة GPG key
curl -fsSL https://download.onlyoffice.com/GPG-KEY-ONLYOFFICE | gpg --dearmor -o /usr/share/keyrings/onlyoffice.gpg

# إضافة المستودع
echo "deb [signed-by=/usr/share/keyrings/onlyoffice.gpg] https://download.onlyoffice.com/repo/debian squeeze main" | tee /etc/apt/sources.list.d/onlyoffice.list

# تحديث apt
apt update

echo "✅ تم إضافة المستودع"
echo ""

# ============================================================================
# الخطوة 3: تثبيت OnlyOffice Document Server
# ============================================================================

echo "📦 الخطوة 3: تثبيت OnlyOffice Document Server..."
echo "   (قد يستغرق 10-15 دقيقة)"

apt install -y onlyoffice-documentserver

echo "✅ تم تثبيت OnlyOffice Document Server"
echo ""

# ============================================================================
# الخطوة 4: إعداد JWT Secret
# ============================================================================

echo "🔐 الخطوة 4: إعداد JWT Secret..."

# سؤال عن JWT Secret
read -p "أدخل JWT Secret (أو اضغط Enter لإنشاء مفتاح عشوائي): " JWT_SECRET

if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32 | tr -d '\n')
    echo "✅ تم إنشاء مفتاح عشوائي: $JWT_SECRET"
fi

# نسخ ملف الإعدادات
cp /etc/onlyoffice/documentserver/local.json /etc/onlyoffice/documentserver/local.json.backup

# إنشاء ملف الإعدادات الجديد
cat > /etc/onlyoffice/documentserver/local.json << EOF
{
  "services": {
    "CoAuthoring": {
      "token": {
        "enable": {
          "request": {
            "inbox": true,
            "outbox": true
          },
          "browser": true
        },
        "inbox": {
          "header": "Authorization"
        },
        "outbox": {
          "header": "Authorization"
        }
      },
      "secret": {
        "inbox": {
          "string": "$JWT_SECRET"
        },
        "outbox": {
          "string": "$JWT_SECRET"
        },
        "browser": {
          "string": "$JWT_SECRET"
        }
      }
    }
  }
}
EOF

echo "✅ تم إعداد JWT Secret"
echo ""

# ============================================================================
# الخطوة 5: إعادة تشغيل OnlyOffice
# ============================================================================

echo "🔄 الخطوة 5: إعادة تشغيل OnlyOffice..."

# إعادة تشغيل الخدمات
supervisorctl restart all 2>/dev/null || systemctl restart ds-docservice ds-metrics ds-converter

# الانتظار قليلاً
sleep 10

echo "✅ تم إعادة تشغيل OnlyOffice"
echo ""

# ============================================================================
# الخطوة 6: فتح المنافذ
# ============================================================================

echo "🔥 الخطوة 6: فتح المنافذ..."

if command -v ufw &> /dev/null; then
    ufw allow 80/tcp
    echo "✅ تم فتح المنفذ 80"
else
    echo "⚠️  ufw غير مثبت، تأكد من فتح المنفذ 80 يدوياً"
fi

echo ""

# ============================================================================
# الخطوة 7: اختبار OnlyOffice
# ============================================================================

echo "🧪 الخطوة 7: اختبار OnlyOffice..."

sleep 5

HEALTH_CHECK=$(curl -s http://localhost/healthcheck 2>/dev/null || echo "failed")

if [ "$HEALTH_CHECK" = "true" ]; then
    echo "✅ OnlyOffice يعمل بشكل صحيح!"
else
    echo "⚠️  OnlyOffice لم يبدأ بعد، انتظر قليلاً ثم جرب:"
    echo "   curl http://localhost/healthcheck"
fi

echo ""

# ============================================================================
# الخطوة 8: عرض المعلومات
# ============================================================================

SERVER_IP=$(hostname -I | awk '{print $1}')

echo "=========================================="
echo "✅ تم التثبيت بنجاح!"
echo "=========================================="
echo ""
echo "📋 معلومات الإعداد:"
echo "  - OnlyOffice URL: http://$SERVER_IP"
echo "  - JWT Secret: $JWT_SECRET"
echo "  - Health Check: http://$SERVER_IP/healthcheck"
echo ""
echo "📝 متغيرات البيئة المطلوبة:"
echo ""
echo "Backend (.env):"
echo "  ONLYOFFICE_DOCUMENT_SERVER_URL=http://$SERVER_IP"
echo "  ONLYOFFICE_SECRET=$JWT_SECRET"
echo "  BACKEND_URL=http://$SERVER_IP:5000"
echo ""
echo "Frontend (.env.local):"
echo "  NEXT_PUBLIC_ONLYOFFICE_DOCUMENT_SERVER_URL=http://$SERVER_IP"
echo ""
echo "🔧 أوامر مفيدة:"
echo "  - عرض حالة الخدمات: sudo systemctl status ds-docservice"
echo "  - إعادة تشغيل: sudo supervisorctl restart all"
echo "  - عرض السجلات: sudo tail -f /var/log/onlyoffice/documentserver/docservice/out.log"
echo ""
echo "📚 للمزيد من المعلومات، راجع: INSTALL_ONLYOFFICE_MANUAL.md"
echo ""

