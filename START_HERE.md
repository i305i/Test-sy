# 🚀 دليل تشغيل المشروع السريع

## الطريقة 1: استخدام Docker (الأسهل) ✅

### خطوة 1: تشغيل الخدمات الأساسية (PostgreSQL, Redis, MinIO)
```bash
docker-compose -f docker-compose.simple.yml up -d
```

### خطوة 2: انتظر حتى تبدأ الخدمات (30 ثانية تقريباً)
```bash
docker-compose -f docker-compose.simple.yml ps
```

### خطوة 3: إعداد قاعدة البيانات
```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
npm run seed
```

### خطوة 4: تشغيل Backend
```bash
cd backend
npm run start:dev
```
Backend سيعمل على: http://localhost:5000

### خطوة 5: تشغيل Frontend (في terminal جديد)
```bash
cd frontend
npm install
npm run dev
```
Frontend سيعمل على: http://localhost:3000

---

## الطريقة 2: بدون Docker (يدوي)

### المتطلبات:
- PostgreSQL 16+ (يعمل على localhost:5432)
- Redis (يعمل على localhost:6379)
- MinIO (يعمل على localhost:9000)

### خطوات الإعداد:

1. **إعداد قاعدة البيانات:**
   ```bash
   # إنشاء قاعدة بيانات
   createdb company_docs
   
   # أو عبر psql:
   psql -U postgres
   CREATE DATABASE company_docs;
   ```

2. **تعديل ملف backend/.env:**
   ```
   DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/company_docs?schema=public"
   ```

3. **إعداد Backend:**
   ```bash
   cd backend
   npm install
   npx prisma generate
   npx prisma migrate dev
   npm run seed
   npm run start:dev
   ```

4. **إعداد Frontend:**
   ```bash
   cd frontend
   npm install
   # تأكد من وجود ملف .env.local مع:
   # NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
   npm run dev
   ```

---

## بيانات الدخول الافتراضية:

بعد تشغيل `npm run seed` في Backend:

- **Super Admin:**
  - Email: admin@companydocs.com
  - Password: Admin@123

- **Supervisor:**
  - Email: supervisor@companydocs.com
  - Password: Supervisor@123

- **Employee:**
  - Email: employee@companydocs.com
  - Password: Employee@123

---

## الروابط المهمة:

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api/v1
- API Docs: http://localhost:5000/api-docs
- MinIO Console: http://localhost:9001
  - Username: minioadmin
  - Password: minioadmin123

---

## حل المشاكل:

### المشكلة: "Cannot connect to database"
- تأكد من تشغيل PostgreSQL
- تحقق من DATABASE_URL في backend/.env

### المشكلة: "Port already in use"
- غيّر المنافذ في ملفات .env

### المشكلة: "Prisma Client not generated"
```bash
cd backend
npx prisma generate
```

