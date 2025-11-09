#!/bin/bash

# سكريبت تثبيت OnlyOffice بدون قاعدة بيانات (SQLite) ثم إعداده لـ PostgreSQL
# استخدم: sudo bash INSTALL_ONLYOFFICE_WITHOUT_DB.sh

set -e

echo "🚀 تثبيت OnlyOffice بدون قاعدة بيانات (SQLite) ثم إعداده لـ PostgreSQL..."
echo ""

# التحقق من أن المستخدم root
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  يجب تشغيل السكريبت كـ root"
    echo "استخدم: sudo bash INSTALL_ONLYOFFICE_WITHOUT_DB.sh"
    exit 1
fi

# ============================================================================
# الخطوة 1: إزالة OnlyOffice المثبت جزئياً
# ============================================================================

echo "🧹 الخطوة 1: إزالة OnlyOffice المثبت جزئياً..."

# إزالة الحزمة المكسورة
dpkg --remove --force-remove-reinstreq onlyoffice-documentserver 2>/dev/null || true
apt-get purge -y onlyoffice-documentserver 2>/dev/null || true
apt-get autoremove -y 2>/dev/null || true

# تنظيف الملفات المتبقية
rm -rf /var/lib/onlyoffice 2>/dev/null || true
rm -rf /var/log/onlyoffice 2>/dev/null || true
rm -rf /etc/onlyoffice 2>/dev/null || true

echo "✅ تم تنظيف التثبيت السابق"
echo ""

# ============================================================================
# الخطوة 2: تثبيت OnlyOffice بدون قاعدة بيانات
# ============================================================================

echo "📦 الخطوة 2: تثبيت OnlyOffice بدون قاعدة بيانات (SQLite)..."
echo "   (قد يستغرق 10-15 دقيقة)"

# تثبيت OnlyOffice (سيستخدم SQLite افتراضياً)
DEBIAN_FRONTEND=noninteractive apt-get install -y onlyoffice-documentserver || {
    echo "❌ فشل التثبيت"
    echo "   جاري المحاولة مرة أخرى..."
    apt-get update
    DEBIAN_FRONTEND=noninteractive apt-get install -y onlyoffice-documentserver
}

echo "✅ تم تثبيت OnlyOffice"
echo ""

# ============================================================================
# الخطوة 3: إيقاف OnlyOffice مؤقتاً
# ============================================================================

echo "⏸️  الخطوة 3: إيقاف OnlyOffice مؤقتاً..."

supervisorctl stop all 2>/dev/null || true
systemctl stop ds-docservice ds-metrics ds-converter 2>/dev/null || true

sleep 3

echo "✅ تم إيقاف OnlyOffice"
echo ""

# ============================================================================
# الخطوة 4: إعداد قاعدة البيانات PostgreSQL
# ============================================================================

echo "📊 الخطوة 4: إعداد قاعدة البيانات PostgreSQL..."

# التحقق من وجود قاعدة البيانات
DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='onlyoffice'" 2>/dev/null || echo "0")

if [ "$DB_EXISTS" != "1" ]; then
    echo "📝 إنشاء قاعدة البيانات onlyoffice..."
    sudo -u postgres psql << EOF
CREATE DATABASE onlyoffice;
EOF
fi

# التحقق من وجود المستخدم
USER_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='onlyoffice'" 2>/dev/null || echo "0")

if [ "$USER_EXISTS" != "1" ]; then
    echo "📝 إنشاء المستخدم onlyoffice..."
    read -p "أدخل كلمة مرور للمستخدم onlyoffice (أو اضغط Enter لاستخدام Qazx11011): " DB_PASSWORD
    DB_PASSWORD=${DB_PASSWORD:-Qazx11011}
    
    sudo -u postgres psql << EOF
CREATE ROLE onlyoffice WITH LOGIN PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE onlyoffice TO onlyoffice;
EOF
else
    read -p "أدخل كلمة مرور المستخدم onlyoffice (أو اضغط Enter لاستخدام Qazx11011): " DB_PASSWORD
    DB_PASSWORD=${DB_PASSWORD:-Qazx11011}
fi

# منح الصلاحيات
sudo -u postgres psql -d onlyoffice << EOF
GRANT ALL PRIVILEGES ON DATABASE onlyoffice TO onlyoffice;
GRANT ALL PRIVILEGES ON SCHEMA public TO onlyoffice;
ALTER DATABASE onlyoffice OWNER TO onlyoffice;
EOF

echo "✅ قاعدة البيانات جاهزة"
echo ""

# ============================================================================
# الخطوة 5: إعدادات PostgreSQL
# ============================================================================

echo "🔐 الخطوة 5: إعدادات PostgreSQL..."

# العثور على ملفات PostgreSQL
PG_VERSION=$(sudo -u postgres psql -tAc "SELECT version();" | grep -oP '\d+' | head -1)
PG_CONF="/etc/postgresql/${PG_VERSION}/main/postgresql.conf"
PG_HBA="/etc/postgresql/${PG_VERSION}/main/pg_hba.conf"

if [ ! -f "$PG_CONF" ]; then
    PG_CONF=$(find /etc/postgresql -name "postgresql.conf" 2>/dev/null | head -1)
    PG_HBA=$(find /etc/postgresql -name "pg_hba.conf" 2>/dev/null | head -1)
fi

if [ -f "$PG_HBA" ]; then
    # نسخ احتياطي
    cp "$PG_HBA" "${PG_HBA}.backup"
    
    # إضافة سطر للسماح بالاتصال المحلي
    if ! grep -q "onlyoffice" "$PG_HBA"; then
        echo "" >> "$PG_HBA"
        echo "# OnlyOffice Document Server" >> "$PG_HBA"
        echo "local   all             onlyoffice                                md5" >> "$PG_HBA"
        echo "host    all             onlyoffice        127.0.0.1/32            md5" >> "$PG_HBA"
        echo "host    all             onlyoffice        ::1/128                 md5" >> "$PG_HBA"
    fi
fi

# إعادة تشغيل PostgreSQL
systemctl restart postgresql
sleep 3

echo "✅ تم تحديث إعدادات PostgreSQL"
echo ""

# ============================================================================
# الخطوة 6: اختبار الاتصال
# ============================================================================

echo "🧪 الخطوة 6: اختبار الاتصال..."

export PGPASSWORD="$DB_PASSWORD"
if psql -h localhost -U onlyoffice -d onlyoffice -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ الاتصال يعمل!"
else
    echo "❌ لا يمكن الاتصال بقاعدة البيانات"
    echo "   تحقق من إعدادات PostgreSQL"
    exit 1
fi

unset PGPASSWORD

echo ""

# ============================================================================
# الخطوة 7: إعداد OnlyOffice لاستخدام PostgreSQL
# ============================================================================

echo "⚙️  الخطوة 7: إعداد OnlyOffice لاستخدام PostgreSQL..."

# ملف إعدادات OnlyOffice
DS_CONF="/etc/onlyoffice/documentserver/local.json"

if [ ! -f "$DS_CONF" ]; then
    echo "📝 إنشاء ملف الإعدادات..."
    mkdir -p /etc/onlyoffice/documentserver
    touch "$DS_CONF"
fi

# نسخ احتياطي
cp "$DS_CONF" "${DS_CONF}.backup" 2>/dev/null || true

# إنشاء ملف إعدادات جديد
cat > "$DS_CONF" << EOF
{
  "db": {
    "type": "postgres",
    "dbHost": "localhost",
    "dbPort": 5432,
    "dbName": "onlyoffice",
    "dbUser": "onlyoffice",
    "dbPass": "$DB_PASSWORD"
  },
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
          "string": "your-secret-key-change-in-production-min-32-chars"
        },
        "outbox": {
          "string": "your-secret-key-change-in-production-min-32-chars"
        },
        "browser": {
          "string": "your-secret-key-change-in-production-min-32-chars"
        }
      }
    }
  }
}
EOF

echo "✅ تم تحديث إعدادات OnlyOffice"
echo ""

# ============================================================================
# الخطوة 8: تهيئة قاعدة البيانات
# ============================================================================

echo "🗄️  الخطوة 8: تهيئة قاعدة البيانات..."

# OnlyOffice يحتاج إلى تهيئة الجداول
# سنستخدم أداة OnlyOffice لتهيئة قاعدة البيانات
if [ -f "/var/www/onlyoffice/documentserver/db/createdb.sh" ]; then
    echo "📝 تهيئة قاعدة البيانات..."
    /var/www/onlyoffice/documentserver/db/createdb.sh || {
        echo "⚠️  فشل تهيئة قاعدة البيانات تلقائياً"
        echo "   سيتم تهيئتها عند بدء OnlyOffice"
    }
fi

echo ""

# ============================================================================
# الخطوة 9: إعادة تشغيل OnlyOffice
# ============================================================================

echo "🔄 الخطوة 9: إعادة تشغيل OnlyOffice..."

# إعادة تشغيل الخدمات
supervisorctl restart all 2>/dev/null || {
    systemctl restart ds-docservice ds-metrics ds-converter 2>/dev/null || {
        echo "⚠️  لا يمكن إعادة تشغيل OnlyOffice تلقائياً"
        echo "   جرب يدوياً: sudo supervisorctl restart all"
    }
}

sleep 10

echo "✅ تم إعادة تشغيل OnlyOffice"
echo ""

# ============================================================================
# الخطوة 10: اختبار OnlyOffice
# ============================================================================

echo "🧪 الخطوة 10: اختبار OnlyOffice..."

sleep 5

HEALTH_CHECK=$(curl -s http://localhost/healthcheck 2>/dev/null || echo "failed")

if [ "$HEALTH_CHECK" = "true" ]; then
    echo "✅ OnlyOffice يعمل بشكل صحيح!"
else
    echo "⚠️  OnlyOffice لم يبدأ بعد، انتظر قليلاً ثم جرب:"
    echo "   curl http://localhost/healthcheck"
    echo ""
    echo "   لعرض السجلات:"
    echo "   sudo tail -f /var/log/onlyoffice/documentserver/docservice/out.log"
fi

echo ""

# ============================================================================
# ملخص
# ============================================================================

SERVER_IP=$(hostname -I | awk '{print $1}')

echo "=========================================="
echo "✅ تم التثبيت بنجاح!"
echo "=========================================="
echo ""
echo "📋 معلومات الإعداد:"
echo "  - OnlyOffice URL: http://$SERVER_IP"
echo "  - قاعدة البيانات: PostgreSQL (onlyoffice)"
echo "  - المستخدم: onlyoffice"
echo "  - Health Check: http://$SERVER_IP/healthcheck"
echo ""
echo "📝 متغيرات البيئة المطلوبة:"
echo ""
echo "Backend (.env):"
echo "  ONLYOFFICE_DOCUMENT_SERVER_URL=http://$SERVER_IP"
echo "  ONLYOFFICE_SECRET=your-secret-key-change-in-production-min-32-chars"
echo "  BACKEND_URL=http://$SERVER_IP:5000"
echo ""
echo "Frontend (.env.local):"
echo "  NEXT_PUBLIC_ONLYOFFICE_DOCUMENT_SERVER_URL=http://$SERVER_IP"
echo ""
echo "🔧 أوامر مفيدة:"
echo "  - عرض حالة OnlyOffice: sudo systemctl status ds-docservice"
echo "  - إعادة تشغيل: sudo supervisorctl restart all"
echo "  - عرض السجلات: sudo tail -f /var/log/onlyoffice/documentserver/docservice/out.log"
echo "  - اختبار قاعدة البيانات: psql -h localhost -U onlyoffice -d onlyoffice"
echo ""

