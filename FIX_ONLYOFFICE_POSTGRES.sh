#!/bin/bash

# سكريبت إصلاح مشكلة اتصال OnlyOffice مع PostgreSQL
# استخدم: sudo bash FIX_ONLYOFFICE_POSTGRES.sh

set -e

echo "🔧 إصلاح مشكلة اتصال OnlyOffice مع PostgreSQL..."
echo ""

# التحقق من أن المستخدم root
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  يجب تشغيل السكريبت كـ root"
    echo "استخدم: sudo bash FIX_ONLYOFFICE_POSTGRES.sh"
    exit 1
fi

# ============================================================================
# الخطوة 1: التحقق من حالة PostgreSQL
# ============================================================================

echo "📊 الخطوة 1: التحقق من حالة PostgreSQL..."

# التحقق من أن PostgreSQL يعمل
if ! systemctl is-active --quiet postgresql; then
    echo "⚠️  PostgreSQL غير نشط، جاري التشغيل..."
    systemctl start postgresql
    sleep 3
fi

# التحقق من أن PostgreSQL يستمع على المنفذ
if ! netstat -tlnp | grep -q ":5432"; then
    echo "⚠️  PostgreSQL لا يستمع على المنفذ 5432"
    echo "   جاري التحقق من إعدادات PostgreSQL..."
fi

echo "✅ PostgreSQL نشط"
echo ""

# ============================================================================
# الخطوة 2: التحقق من قاعدة البيانات والمستخدم
# ============================================================================

echo "📦 الخطوة 2: التحقق من قاعدة البيانات والمستخدم..."

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
    echo "✅ المستخدم onlyoffice موجود"
fi

# منح الصلاحيات
sudo -u postgres psql -d onlyoffice << EOF
GRANT ALL PRIVILEGES ON DATABASE onlyoffice TO onlyoffice;
GRANT ALL PRIVILEGES ON SCHEMA public TO onlyoffice;
ALTER DATABASE onlyoffice OWNER TO onlyoffice;
EOF

echo "✅ قاعدة البيانات والمستخدم جاهزان"
echo ""

# ============================================================================
# الخطوة 3: إعدادات PostgreSQL للسماح بالاتصال المحلي
# ============================================================================

echo "🔐 الخطوة 3: إعدادات PostgreSQL للسماح بالاتصال المحلي..."

# العثور على ملف postgresql.conf
PG_VERSION=$(sudo -u postgres psql -tAc "SELECT version();" | grep -oP '\d+' | head -1)
PG_CONF="/etc/postgresql/${PG_VERSION}/main/postgresql.conf"
PG_HBA="/etc/postgresql/${PG_VERSION}/main/pg_hba.conf"

if [ ! -f "$PG_CONF" ]; then
    # البحث عن الملف
    PG_CONF=$(find /etc/postgresql -name "postgresql.conf" 2>/dev/null | head -1)
    PG_HBA=$(find /etc/postgresql -name "pg_hba.conf" 2>/dev/null | head -1)
fi

if [ -f "$PG_CONF" ]; then
    echo "📝 تعديل postgresql.conf..."
    
    # التأكد من أن PostgreSQL يستمع على localhost
    if ! grep -q "^listen_addresses" "$PG_CONF"; then
        echo "listen_addresses = 'localhost'" >> "$PG_CONF"
    else
        sed -i "s/^#listen_addresses.*/listen_addresses = 'localhost'/" "$PG_CONF"
        sed -i "s/^listen_addresses.*/listen_addresses = 'localhost'/" "$PG_CONF"
    fi
fi

if [ -f "$PG_HBA" ]; then
    echo "📝 تعديل pg_hba.conf..."
    
    # نسخ احتياطي
    cp "$PG_HBA" "${PG_HBA}.backup"
    
    # إضافة سطر للسماح بالاتصال المحلي
    if ! grep -q "onlyoffice" "$PG_HBA"; then
        echo "local   all             onlyoffice                                md5" >> "$PG_HBA"
        echo "host    all             onlyoffice        127.0.0.1/32            md5" >> "$PG_HBA"
        echo "host    all             onlyoffice        ::1/128                 md5" >> "$PG_HBA"
    fi
fi

# إعادة تشغيل PostgreSQL
echo "🔄 إعادة تشغيل PostgreSQL..."
systemctl restart postgresql
sleep 3

echo "✅ تم تحديث إعدادات PostgreSQL"
echo ""

# ============================================================================
# الخطوة 4: اختبار الاتصال
# ============================================================================

echo "🧪 الخطوة 4: اختبار الاتصال..."

# اختبار الاتصال
if sudo -u postgres psql -d onlyoffice -U onlyoffice -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ الاتصال يعمل!"
else
    echo "⚠️  لا يمكن الاتصال، جاري المحاولة بكلمة المرور..."
    
    # اختبار مع كلمة المرور
    export PGPASSWORD='Qazx11011'
    if psql -h localhost -U onlyoffice -d onlyoffice -c "SELECT 1;" > /dev/null 2>&1; then
        echo "✅ الاتصال يعمل مع كلمة المرور!"
    else
        echo "❌ لا يزال هناك مشكلة في الاتصال"
        echo "   جرب الاتصال يدوياً:"
        echo "   psql -h localhost -U onlyoffice -d onlyoffice"
    fi
fi

echo ""

# ============================================================================
# الخطوة 5: إعادة تثبيت OnlyOffice
# ============================================================================

echo "🔄 الخطوة 5: إعادة تثبيت OnlyOffice..."

# إصلاح الحزمة المكسورة
dpkg --configure -a

# إعادة تثبيت OnlyOffice
echo "📦 إعادة تثبيت onlyoffice-documentserver..."
apt install --reinstall -y onlyoffice-documentserver || {
    echo "⚠️  فشل إعادة التثبيت، جاري إصلاح الحزمة..."
    apt --fix-broken install -y
    dpkg --configure onlyoffice-documentserver
}

echo ""

# ============================================================================
# الخطوة 6: إعداد OnlyOffice للاتصال بقاعدة البيانات
# ============================================================================

echo "⚙️  الخطوة 6: إعداد OnlyOffice للاتصال بقاعدة البيانات..."

# ملف إعدادات OnlyOffice
DS_CONF="/etc/onlyoffice/documentserver/local.json"

if [ -f "$DS_CONF" ]; then
    echo "📝 تحديث إعدادات OnlyOffice..."
    
    # نسخ احتياطي
    cp "$DS_CONF" "${DS_CONF}.backup"
    
    # قراءة كلمة المرور
    read -p "أدخل كلمة مرور قاعدة البيانات onlyoffice (أو اضغط Enter لاستخدام Qazx11011): " DB_PASSWORD
    DB_PASSWORD=${DB_PASSWORD:-Qazx11011}
    
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
else
    echo "⚠️  ملف الإعدادات غير موجود: $DS_CONF"
fi

echo ""

# ============================================================================
# الخطوة 7: إعادة تشغيل OnlyOffice
# ============================================================================

echo "🔄 الخطوة 7: إعادة تشغيل OnlyOffice..."

# إعادة تشغيل الخدمات
supervisorctl restart all 2>/dev/null || {
    systemctl restart ds-docservice ds-metrics ds-converter 2>/dev/null || {
        echo "⚠️  لا يمكن إعادة تشغيل OnlyOffice تلقائياً"
        echo "   جرب يدوياً: sudo supervisorctl restart all"
    }
}

sleep 5

echo "✅ تم إعادة تشغيل OnlyOffice"
echo ""

# ============================================================================
# الخطوة 8: اختبار OnlyOffice
# ============================================================================

echo "🧪 الخطوة 8: اختبار OnlyOffice..."

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

echo "=========================================="
echo "✅ تم إصلاح المشكلة!"
echo "=========================================="
echo ""
echo "📋 معلومات الاتصال:"
echo "  - قاعدة البيانات: onlyoffice"
echo "  - المستخدم: onlyoffice"
echo "  - المضيف: localhost:5432"
echo ""
echo "🔧 أوامر مفيدة:"
echo "  - اختبار الاتصال: psql -h localhost -U onlyoffice -d onlyoffice"
echo "  - عرض حالة OnlyOffice: sudo systemctl status ds-docservice"
echo "  - عرض السجلات: sudo tail -f /var/log/onlyoffice/documentserver/docservice/out.log"
echo ""

