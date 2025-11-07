# ⚙️ إعداد Backend - خطوات سريعة

## 📋 المتطلبات

تأكد من تشغيل الخدمات التالية:
- ✅ PostgreSQL (Port 5432)
- ✅ Redis (Port 6379) - اختياري
- ✅ MinIO (Port 9000) - اختياري

## 🚀 خطوات الإعداد

### 1. تثبيت الحزم المتبقية

```bash
npm install passport passport-local passport-jwt
npm install @types/passport-local @types/passport-jwt -D
npm install helmet cookie-parser
npm install @types/cookie-parser -D
```

### 2. إعداد ملف .env

```bash
# انسخ env.example.txt إلى .env
cp env.example.txt .env

# عدّل .env حسب إعداداتك
```

### 3. إنشاء قاعدة البيانات وتشغيل Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations (سينشئ الجداول)
npx prisma migrate dev --name init

# Seed database (سيضيف بيانات أولية)
npm run seed
```

### 4. تشغيل الـ Backend

```bash
# Development mode
npm run start:dev

# سيعمل على http://localhost:5000
# API Docs: http://localhost:5000/api-docs
```

## 🧪 اختبار الـ API

### تسجيل الدخول

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@companydocs.com",
    "password": "Admin@123"
  }'
```

### الحصول على بيانات المستخدم

```bash
curl http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 📝 ملاحظات

### بيانات الدخول الافتراضية

بعد تشغيل `npm run seed`:

- **Super Admin**:
  - Email: admin@companydocs.com
  - Password: Admin@123

- **Supervisor**:
  - Email: supervisor@companydocs.com  
  - Password: Supervisor@123

- **Employee**:
  - Email: employee@companydocs.com
  - Password: Employee@123

### حل المشاكل الشائعة

#### 1. خطأ في الاتصال بقاعدة البيانات

```bash
# تأكد من تشغيل PostgreSQL
sudo service postgresql status

# تحقق من DATABASE_URL في .env
```

#### 2. Prisma Client غير موجود

```bash
npx prisma generate
```

#### 3. MinIO غير متاح

MinIO اختياري في التطوير. يمكنك تعطيل رفع الملفات مؤقتاً.

## 📚 الموارد

- [Prisma Docs](https://www.prisma.io/docs)
- [NestJS Docs](https://docs.nestjs.com/)
- [Swagger UI](http://localhost:5000/api-docs)

