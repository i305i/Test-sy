# 🔧 حل سريع: مشكلة اتصال OnlyOffice مع PostgreSQL

## 🎯 المشكلة

```
ERROR: can't connect to postgressql database
```

## ✅ الحل السريع

### الطريقة 1: استخدام السكريبت التلقائي

```bash
cd /var/www/Test-sy
sudo chmod +x FIX_ONLYOFFICE_POSTGRES.sh
sudo bash FIX_ONLYOFFICE_POSTGRES.sh
```

---

### الطريقة 2: الحل اليدوي

#### 1. التحقق من PostgreSQL

```bash
# التحقق من أن PostgreSQL يعمل
sudo systemctl status postgresql

# إذا لم يكن يعمل
sudo systemctl start postgresql
```

#### 2. التحقق من قاعدة البيانات والمستخدم

```bash
sudo -u postgres psql
```

داخل psql:

```sql
-- التحقق من وجود قاعدة البيانات
\l

-- إذا لم تكن موجودة، أنشئها
CREATE DATABASE onlyoffice;

-- التحقق من وجود المستخدم
\du

-- إذا لم يكن موجوداً، أنشئه
CREATE ROLE onlyoffice WITH LOGIN PASSWORD 'Qazx11011';

-- منح الصلاحيات
GRANT ALL PRIVILEGES ON DATABASE onlyoffice TO onlyoffice;
ALTER DATABASE onlyoffice OWNER TO onlyoffice;

-- الخروج
\q
```

#### 3. إعدادات PostgreSQL

```bash
# العثور على إصدار PostgreSQL
sudo -u postgres psql -c "SELECT version();"

# تعديل pg_hba.conf (استبدل 16 بالإصدار الفعلي)
sudo nano /etc/postgresql/16/main/pg_hba.conf
```

أضف في نهاية الملف:

```
local   all             onlyoffice                                md5
host    all             onlyoffice        127.0.0.1/32            md5
host    all             onlyoffice        ::1/128                 md5
```

#### 4. تعديل postgresql.conf

```bash
sudo nano /etc/postgresql/16/main/postgresql.conf
```

تأكد من:

```
listen_addresses = 'localhost'
```

#### 5. إعادة تشغيل PostgreSQL

```bash
sudo systemctl restart postgresql
```

#### 6. اختبار الاتصال

```bash
# اختبار الاتصال
export PGPASSWORD='Qazx11011'
psql -h localhost -U onlyoffice -d onlyoffice -c "SELECT 1;"
```

#### 7. إعداد OnlyOffice للاتصال بقاعدة البيانات

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

#### 8. إصلاح حزمة OnlyOffice

```bash
# إصلاح الحزمة المكسورة
sudo dpkg --configure -a

# إعادة تثبيت OnlyOffice
sudo apt install --reinstall -y onlyoffice-documentserver

# أو إصلاح الحزمة فقط
sudo apt --fix-broken install -y
sudo dpkg --configure onlyoffice-documentserver
```

#### 9. إعادة تشغيل OnlyOffice

```bash
sudo supervisorctl restart all
# أو
sudo systemctl restart ds-docservice ds-metrics ds-converter
```

#### 10. اختبار OnlyOffice

```bash
# انتظر 10-15 ثانية
sleep 15

# اختبار Health Check
curl http://localhost/healthcheck
# يجب أن يعيد: true
```

---

## 🔍 استكشاف الأخطاء

### المشكلة: PostgreSQL لا يستمع على المنفذ 5432

```bash
# التحقق من المنفذ
sudo netstat -tlnp | grep 5432

# إذا لم يكن يعمل، تحقق من postgresql.conf
sudo nano /etc/postgresql/16/main/postgresql.conf
# تأكد من: listen_addresses = 'localhost'
```

### المشكلة: خطأ في المصادقة

```bash
# تحقق من pg_hba.conf
sudo nano /etc/postgresql/16/main/pg_hba.conf

# تأكد من وجود السطور:
# local   all             onlyoffice                                md5
# host    all             onlyoffice        127.0.0.1/32            md5
```

### المشكلة: OnlyOffice لا يبدأ

```bash
# عرض السجلات
sudo tail -f /var/log/onlyoffice/documentserver/docservice/out.log
sudo tail -f /var/log/onlyoffice/documentserver/converter/out.log

# التحقق من حالة الخدمات
sudo systemctl status ds-docservice
sudo systemctl status ds-metrics
sudo systemctl status ds-converter
```

---

## ✅ قائمة التحقق

- [ ] PostgreSQL يعمل (`systemctl status postgresql`)
- [ ] قاعدة البيانات `onlyoffice` موجودة
- [ ] المستخدم `onlyoffice` موجود
- [ ] الصلاحيات منحت بشكل صحيح
- [ ] `pg_hba.conf` محدث
- [ ] `postgresql.conf` يستمع على localhost
- [ ] الاتصال يعمل (`psql -h localhost -U onlyoffice -d onlyoffice`)
- [ ] `local.json` يحتوي على إعدادات قاعدة البيانات
- [ ] OnlyOffice تم إصلاحه (`dpkg --configure -a`)
- [ ] OnlyOffice يعمل (`curl http://localhost/healthcheck`)

---

## 📝 ملاحظات

1. **كلمة المرور**: تأكد من استخدام نفس كلمة المرور في:
   - قاعدة البيانات PostgreSQL
   - ملف `/etc/onlyoffice/documentserver/local.json`

2. **المنفذ**: PostgreSQL يستخدم المنفذ 5432 افتراضياً

3. **الصلاحيات**: تأكد من منح جميع الصلاحيات للمستخدم `onlyoffice`

4. **السجلات**: إذا استمرت المشكلة، راجع السجلات:
   ```bash
   sudo tail -f /var/log/onlyoffice/documentserver/docservice/out.log
   ```

