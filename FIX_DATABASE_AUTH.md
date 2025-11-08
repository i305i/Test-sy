# 🔧 إصلاح خطأ Authentication Failed لقاعدة البيانات

## ❌ المشكلة:

```
Authentication failed against database server, the provided database credentials for `company_user` are not valid.
```

**السبب:** المستخدم `company_user` غير موجود في PostgreSQL أو كلمة المرور غير صحيحة.

---

## ✅ الحل:

### الخطوة 1: الاتصال بـ PostgreSQL كـ `postgres`:

```bash
sudo -u postgres psql
```

### الخطوة 2: إنشاء المستخدم `company_user`:

```sql
-- إنشاء المستخدم
CREATE USER company_user WITH PASSWORD 'your_secure_password';

-- إعطاء الصلاحيات
ALTER USER company_user CREATEDB;

-- إنشاء قاعدة البيانات (إذا لم تكن موجودة)
CREATE DATABASE company_docs OWNER company_user;

-- إعطاء جميع الصلاحيات على قاعدة البيانات
GRANT ALL PRIVILEGES ON DATABASE company_docs TO company_user;

-- الخروج
\q
```

### الخطوة 3: تحديث ملف `.env` في Backend:

```bash
cd /var/www/Test-sy/backend
nano .env
```

**تأكد من أن `DATABASE_URL` يحتوي على:**
```env
DATABASE_URL=postgresql://company_user:your_secure_password@localhost:5432/company_docs?schema=public
```

**استبدل `your_secure_password` بكلمة المرور التي استخدمتها في الخطوة 2.**

### الخطوة 4: تشغيل Migrations:

```bash
cd /var/www/Test-sy/backend
npx prisma migrate deploy
```

### الخطوة 5: إعادة تشغيل Backend:

```bash
pm2 restart company-docs-backend
# أو
pm2 restart all
```

---

## 🔄 بديل: استخدام `postgres` بدلاً من `company_user`

إذا كنت تريد استخدام المستخدم الافتراضي `postgres`:

### الخطوة 1: تحديث ملف `.env`:

```bash
cd /var/www/Test-sy/backend
nano .env
```

**غيّر `DATABASE_URL` إلى:**
```env
DATABASE_URL=postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/company_docs?schema=public
```

**استبدل `YOUR_POSTGRES_PASSWORD` بكلمة مرور `postgres`.**

### الخطوة 2: إنشاء قاعدة البيانات (إذا لم تكن موجودة):

```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE company_docs;
\q
```

### الخطوة 3: تشغيل Migrations:

```bash
cd /var/www/Test-sy/backend
npx prisma migrate deploy
```

### الخطوة 4: إعادة تشغيل Backend:

```bash
pm2 restart company-docs-backend
```

---

## ✅ التحقق من الاتصال:

```bash
# اختبار الاتصال
cd /var/www/Test-sy/backend
npx prisma db pull
```

إذا نجح الأمر، يعني الاتصال يعمل! ✅

---

## 📝 ملاحظات:

- **كلمة المرور:** استخدم كلمة مرور قوية (12+ حرف، أرقام، رموز)
- **الأمان:** لا تشارك ملف `.env` مع أي شخص
- **النسخ الاحتياطي:** احتفظ بنسخة من كلمة المرور في مكان آمن

---

## 🆘 إذا استمرت المشكلة:

### 1. التحقق من أن PostgreSQL يعمل:

```bash
sudo systemctl status postgresql
```

### 2. التحقق من أن قاعدة البيانات موجودة:

```bash
sudo -u postgres psql -l | grep company_docs
```

### 3. التحقق من أن المستخدم موجود:

```bash
sudo -u postgres psql -c "\du" | grep company_user
```

### 4. عرض سجلات PostgreSQL:

```bash
sudo tail -f /var/log/postgresql/postgresql-*.log
```

