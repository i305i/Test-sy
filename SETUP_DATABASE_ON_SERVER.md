# 🗄️ إعداد قاعدة البيانات على الخادم

## المشكلة:
```
The table `public.users` does not exist in the current database.
```

## ✅ الحل: تشغيل Prisma Migrations

### الخطوات على الخادم:

```bash
# 1. الاتصال بالخادم
ssh root@93.127.160.182

# 2. الانتقال لمجلد الباك اند
cd /var/www/Test-sy/backend

# 3. التحقق من ملف .env (يجب أن يحتوي على DATABASE_URL)
cat .env | grep DATABASE_URL

# 4. توليد Prisma Client
npx prisma generate

# 5. تشغيل Migrations (سينشئ جميع الجداول)
npx prisma migrate deploy
# أو للإنتاج:
npx prisma migrate deploy

# 6. (اختياري) تعبئة البيانات التجريبية
npm run seed

# 7. إعادة تشغيل الباك اند
pm2 restart backend
# أو
npm run start:prod
```

---

## 📋 الأوامر بالتفصيل:

### 1. التحقق من اتصال قاعدة البيانات:

```bash
cd /var/www/Test-sy/backend

# اختبار الاتصال بقاعدة البيانات
npx prisma db pull
```

### 2. عرض حالة Migrations:

```bash
# عرض حالة Migrations
npx prisma migrate status
```

### 3. تشغيل Migrations (للإنتاج):

```bash
# هذا الأمر ينفذ migrations الموجودة فقط (لا ينشئ جديدة)
npx prisma migrate deploy
```

### 4. إذا أردت إنشاء migration جديد (للتطوير فقط):

```bash
# ⚠️ لا تستخدم هذا في الإنتاج!
npx prisma migrate dev --name init
```

---

## 🔧 إذا كانت قاعدة البيانات فارغة تماماً:

### الخيار 1: استخدام migrate deploy (موصى به للإنتاج)

```bash
cd /var/www/Test-sy/backend

# توليد Prisma Client
npx prisma generate

# تشغيل جميع migrations الموجودة
npx prisma migrate deploy

# تعبئة البيانات
npm run seed
```

### الخيار 2: إعادة إنشاء قاعدة البيانات (⚠️ سيحذف البيانات!)

```bash
cd /var/www/Test-sy/backend

# ⚠️ تحذير: هذا سيحذف جميع البيانات!
npx prisma migrate reset

# تعبئة البيانات من جديد
npm run seed
```

---

## 🧪 التحقق من نجاح العملية:

### 1. التحقق من الجداول:

```bash
# استخدام Prisma Studio (واجهة مرئية)
npx prisma studio

# أو استخدام psql مباشرة
psql -U postgres -d company_docs -c "\dt"
```

### 2. اختبار API:

```bash
# اختبار تسجيل الدخول
curl -X POST http://93.127.160.182:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@companydocs.com",
    "password": "Admin@123"
  }'
```

---

## 📝 بيانات الدخول الافتراضية (بعد seed):

| الدور | Email | Password |
|-------|-------|----------|
| **Super Admin** | admin@companydocs.com | Admin@123 |
| **Supervisor** | supervisor@companydocs.com | Supervisor@123 |
| **Employee** | employee@companydocs.com | Employee@123 |

---

## ⚠️ حل المشاكل الشائعة:

### المشكلة 1: "Migration failed"

```bash
# عرض حالة migrations
npx prisma migrate status

# إذا كانت هناك migrations معلقة، شغلها:
npx prisma migrate deploy
```

### المشكلة 2: "Can't reach database server"

```bash
# التحقق من DATABASE_URL في .env
cat .env | grep DATABASE_URL

# اختبار الاتصال
npx prisma db pull
```

### المشكلة 3: "Prisma Client not generated"

```bash
npx prisma generate
```

### المشكلة 4: "Schema is out of sync"

```bash
# مزامنة schema مع قاعدة البيانات
npx prisma db push
```

---

## 🎯 سكريبت سريع (Copy & Paste):

```bash
cd /var/www/Test-sy/backend && \
npx prisma generate && \
npx prisma migrate deploy && \
npm run seed && \
pm2 restart backend
```

---

## ✅ بعد الانتهاء:

1. ✅ الجداول تم إنشاؤها
2. ✅ البيانات التجريبية موجودة
3. ✅ الباك اند يعمل
4. ✅ يمكن تسجيل الدخول

**الآن جرب تسجيل الدخول من الفرونت اند!**

