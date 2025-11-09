# 🔧 حل مشكلة تثبيت OnlyOffice مع PostgreSQL

## 🎯 المشكلة

```
ERROR: can't connect to postgressql database
```

هذه المشكلة تحدث لأن OnlyOffice يحاول الاتصال بقاعدة البيانات **أثناء التثبيت**، لكن الاتصال لا يعمل.

## ✅ الحل: تثبيت OnlyOffice بدون قاعدة بيانات أولاً

### الطريقة 1: استخدام السكريبت التلقائي (موصى به)

```bash
cd /var/www/Test-sy
sudo chmod +x INSTALL_ONLYOFFICE_WITHOUT_DB.sh
sudo bash INSTALL_ONLYOFFICE_WITHOUT_DB.sh
```

السكريبت سيقوم بـ:
1. ✅ إزالة OnlyOffice المثبت جزئياً
2. ✅ تثبيت OnlyOffice بدون قاعدة بيانات (SQLite)
3. ✅ إعداد قاعدة البيانات PostgreSQL
4. ✅ إعداد OnlyOffice لاستخدام PostgreSQL
5. ✅ إعادة تشغيل OnlyOffice

---

### الطريقة 2: الحل اليدوي

#### 1. إزالة OnlyOffice المثبت جزئياً

```bash
# إزالة الحزمة المكسورة
sudo dpkg --remove --force-remove-reinstreq onlyoffice-documentserver
sudo apt-get purge -y onlyoffice-documentserver
sudo apt-get autoremove -y

# تنظيف الملفات المتبقية
sudo rm -rf /var/lib/onlyoffice
sudo rm -rf /var/log/onlyoffice
sudo rm -rf /etc/onlyoffice
```

#### 2. تثبيت OnlyOffice بدون قاعدة بيانات

```bash
# OnlyOffice سيستخدم SQLite افتراضياً
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y onlyoffice-documentserver
```

**ملاحظة**: قد يستغرق 10-15 دقيقة

#### 3. إيقاف OnlyOffice مؤقتاً

```bash
sudo supervisorctl stop all
# أو
sudo systemctl stop ds-docservice ds-metrics ds-converter
```

#### 4. إعداد قاعدة البيانات PostgreSQL

```bash
sudo -u postgres psql
```

داخل psql:

```sql
-- إنشاء قاعدة البيانات (إذا لم تكن موجودة)
CREATE DATABASE onlyoffice;

-- إنشاء المستخدم (إذا لم يكن موجوداً)
CREATE ROLE onlyoffice WITH LOGIN PASSWORD 'Qazx11011';

-- منح الصلاحيات
GRANT ALL PRIVILEGES ON DATABASE onlyoffice TO onlyoffice;
ALTER DATABASE onlyoffice OWNER TO onlyoffice;
\c onlyoffice
GRANT ALL PRIVILEGES ON SCHEMA public TO onlyoffice;
\q
```

#### 5. إعدادات PostgreSQL

```bash
# العثور على إصدار PostgreSQL
sudo -u postgres psql -c "SELECT version();" | grep -oP '\d+' | head -1

# تعديل pg_hba.conf (استبدل 16 بالإصدار الفعلي)
sudo nano /etc/postgresql/16/main/pg_hba.conf
```

أضف في نهاية الملف:

```
# OnlyOffice Document Server
local   all             onlyoffice                                md5
host    all             onlyoffice        127.0.0.1/32            md5
host    all             onlyoffice        ::1/128                 md5
```

```bash
# إعادة تشغيل PostgreSQL
sudo systemctl restart postgresql
```

#### 6. اختبار الاتصال

```bash
export PGPASSWORD='Qazx11011'
psql -h localhost -U onlyoffice -d onlyoffice -c "SELECT 1;"
unset PGPASSWORD
```

#### 7. إعداد OnlyOffice لاستخدام PostgreSQL

```bash
sudo nano /etc/onlyoffice/documentserver/local.json
```

أضف/عدّل:

```json
{
  "db": {
    "type": "postgres",
    "dbHost": "localhost",
    "dbPort": 5432,
    "dbName": "onlyoffice",
    "dbUser": "onlyoffice",
    "dbPass": "Qazx11011"
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
```

#### 8. إعادة تشغيل OnlyOffice

```bash
sudo supervisorctl restart all
# أو
sudo systemctl restart ds-docservice ds-metrics ds-converter
```

#### 9. اختبار OnlyOffice

```bash
# انتظر 10-15 ثانية
sleep 15

# اختبار Health Check
curl http://localhost/healthcheck
# يجب أن يعيد: true
```

---

## 🔍 استكشاف الأخطاء

### المشكلة: OnlyOffice لا يبدأ بعد التثبيت

```bash
# عرض السجلات
sudo tail -f /var/log/onlyoffice/documentserver/docservice/out.log

# التحقق من حالة الخدمات
sudo systemctl status ds-docservice
sudo systemctl status ds-metrics
sudo systemctl status ds-converter

# التحقق من الاتصال بقاعدة البيانات
export PGPASSWORD='Qazx11011'
psql -h localhost -U onlyoffice -d onlyoffice -c "\dt"
unset PGPASSWORD
```

### المشكلة: قاعدة البيانات لا تُهيأ تلقائياً

OnlyOffice قد يحتاج إلى تهيئة الجداول يدوياً:

```bash
# البحث عن سكريبت التهيئة
find /var/www/onlyoffice -name "*createdb*" -o -name "*init*"

# أو تهيئة يدوياً (إذا كان متاحاً)
sudo -u ds-docservice psql -h localhost -U onlyoffice -d onlyoffice < /path/to/schema.sql
```

### المشكلة: خطأ في الاتصال بقاعدة البيانات

```bash
# التحقق من أن PostgreSQL يستمع
sudo netstat -tlnp | grep 5432

# اختبار الاتصال من OnlyOffice
export PGPASSWORD='Qazx11011'
psql -h localhost -U onlyoffice -d onlyoffice -c "SELECT 1;"
unset PGPASSWORD

# التحقق من pg_hba.conf
sudo cat /etc/postgresql/16/main/pg_hba.conf | grep onlyoffice
```

---

## 📝 ملاحظات مهمة

1. **ترتيب التثبيت**: من المهم تثبيت OnlyOffice بدون قاعدة بيانات أولاً، ثم إعداده لاستخدام PostgreSQL

2. **كلمة المرور**: تأكد من استخدام نفس كلمة المرور في:
   - قاعدة البيانات PostgreSQL
   - ملف `/etc/onlyoffice/documentserver/local.json`

3. **الصلاحيات**: تأكد من منح جميع الصلاحيات للمستخدم `onlyoffice`

4. **التهيئة**: OnlyOffice قد يحتاج إلى وقت لتهيئة قاعدة البيانات عند البدء الأول

---

## ✅ قائمة التحقق

- [ ] OnlyOffice مثبت بدون قاعدة بيانات (SQLite)
- [ ] قاعدة البيانات `onlyoffice` موجودة في PostgreSQL
- [ ] المستخدم `onlyoffice` موجود
- [ ] الصلاحيات منحت بشكل صحيح
- [ ] `pg_hba.conf` محدث
- [ ] الاتصال يعمل (`psql -h localhost -U onlyoffice -d onlyoffice`)
- [ ] `local.json` يحتوي على إعدادات PostgreSQL
- [ ] OnlyOffice يعمل (`curl http://localhost/healthcheck`)

---

## 🆘 إذا استمرت المشكلة

1. **عرض السجلات الكاملة**:
   ```bash
   sudo journalctl -u ds-docservice -n 100
   sudo tail -f /var/log/onlyoffice/documentserver/docservice/out.log
   ```

2. **إعادة التثبيت من الصفر**:
   ```bash
   sudo bash INSTALL_ONLYOFFICE_WITHOUT_DB.sh
   ```

3. **التحقق من المساحة**:
   ```bash
   df -h
   ```

4. **التحقق من الذاكرة**:
   ```bash
   free -h
   ```

