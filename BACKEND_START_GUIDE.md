# 🚀 دليل تشغيل Backend

## ⚠️ مهم جداً!

**يجب تشغيل Backend قبل استخدام Frontend!**

---

## 📋 المتطلبات

قبل تشغيل Backend، تأكد من:

1. ✅ **Node.js** مثبت (v20 أو أحدث)
2. ✅ **PostgreSQL** مثبت ومشغل
3. ✅ **Redis** مثبت ومشغل (اختياري)
4. ✅ **MinIO** مثبت ومشغل (اختياري)

---

## 🔧 الإعداد الأولي

### 1. انتقل إلى مجلد Backend
```bash
cd backend
```

### 2. نسخ ملف البيئة
```bash
# Windows PowerShell
Copy-Item env.example.txt .env

# أو يدوياً
# انسخ محتوى env.example.txt إلى ملف جديد اسمه .env
```

### 3. تعديل ملف `.env`
افتح `.env` وعدّل الإعدادات:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/companydocs"

# JWT Secrets
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this-in-production"

# MinIO (اختياري)
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"

# Redis (اختياري)
REDIS_HOST="localhost"
REDIS_PORT="6379"
```

### 4. تثبيت Dependencies
```bash
npm install
```

### 5. إنشاء قاعدة البيانات
```bash
# Generate Prisma Client
npx prisma generate

# Run Migrations
npx prisma migrate dev

# Seed Database (إضافة مستخدمين تجريبيين)
npm run seed
```

---

## ▶️ تشغيل Backend

### Development Mode (موصى به)
```bash
npm run start:dev
```

### Production Mode
```bash
npm run build
npm run start:prod
```

---

## ✅ التحقق من التشغيل

بعد تشغيل Backend، يجب أن ترى:

```
[Nest] 12345  - DD/MM/YYYY, HH:MM:SS     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - DD/MM/YYYY, HH:MM:SS     LOG [InstanceLoader] DatabaseModule dependencies initialized
[Nest] 12345  - DD/MM/YYYY, HH:MM:SS     LOG [InstanceLoader] AuthModule dependencies initialized
[Nest] 12345  - DD/MM/YYYY, HH:MM:SS     LOG [InstanceLoader] UsersModule dependencies initialized
[Nest] 12345  - DD/MM/YYYY, HH:MM:SS     LOG [InstanceLoader] CompaniesModule dependencies initialized
[Nest] 12345  - DD/MM/YYYY, HH:MM:SS     LOG [RoutesResolver] AuthController {/api/v1/auth}:
[Nest] 12345  - DD/MM/YYYY, HH:MM:SS     LOG [RouterExplorer] Mapped {/api/v1/auth/login, POST} route
[Nest] 12345  - DD/MM/YYYY, HH:MM:SS     LOG [NestApplication] Nest application successfully started
```

### اختبر الـ API:
```bash
# Test Health Check
curl http://localhost:3001/api/v1

# Should return: {"message":"Company Docs API is running!"}
```

---

## 🧪 المستخدمين التجريبيين

بعد تشغيل `npm run seed`، ستكون لديك:

### 👨‍💼 Admin
- **Email:** `admin@companydocs.com`
- **Password:** `Admin@123`
- **الصلاحيات:** كاملة

### 👨‍💻 Supervisor
- **Email:** `supervisor@companydocs.com`
- **Password:** `Supervisor@123`
- **الصلاحيات:** مراجعة وإدارة

### 👷 Employee
- **Email:** `employee@companydocs.com`
- **Password:** `Employee@123`
- **الصلاحيات:** إنشاء وتعديل

---

## 🔗 الـ Endpoints

### Authentication
- `POST /api/v1/auth/login` - تسجيل الدخول
- `POST /api/v1/auth/refresh` - تحديث Token
- `POST /api/v1/auth/logout` - تسجيل الخروج
- `GET /api/v1/auth/me` - معلومات المستخدم

### Dashboard
- `GET /api/v1/dashboard/stats` - إحصائيات Dashboard

### Companies
- `GET /api/v1/companies` - قائمة الشركات
- `POST /api/v1/companies` - إضافة شركة
- `GET /api/v1/companies/:id` - تفاصيل شركة
- `PATCH /api/v1/companies/:id` - تحديث شركة
- `DELETE /api/v1/companies/:id` - حذف شركة

### Users
- `GET /api/v1/users` - قائمة المستخدمين
- `POST /api/v1/users` - إضافة مستخدم
- `GET /api/v1/users/:id` - تفاصيل مستخدم
- `PATCH /api/v1/users/:id` - تحديث مستخدم

### Documents
- `POST /api/v1/documents/upload` - رفع مستند
- `GET /api/v1/documents/:id` - تفاصيل مستند
- `GET /api/v1/documents/:id/download` - تحميل مستند

### Notifications
- `GET /api/v1/notifications` - قائمة الإشعارات
- `PATCH /api/v1/notifications/:id/read` - قراءة إشعار

---

## 🐛 حل المشاكل الشائعة

### ❌ خطأ: "Port 3001 is already in use"
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# أو غيّر الـ PORT في .env
PORT=3002
```

### ❌ خطأ: "Can't reach database server"
```bash
# تأكد من تشغيل PostgreSQL
# Windows: افتح Services وابحث عن PostgreSQL
# أو استخدم Docker:
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres
```

### ❌ خطأ: "Prisma Client not generated"
```bash
npx prisma generate
```

### ❌ خطأ: "Migration failed"
```bash
# Reset database (⚠️ سيحذف البيانات)
npx prisma migrate reset

# أو
npx prisma db push
```

---

## 📊 Swagger Documentation

بعد تشغيل Backend، يمكنك الوصول للتوثيق التفاعلي:

```
http://localhost:3001/api
```

---

## 🔄 الترتيب الصحيح للتشغيل

```
1. تشغيل PostgreSQL ✅
   ↓
2. تشغيل Backend ✅
   ↓
3. تشغيل Frontend ✅
   ↓
4. فتح المتصفح http://localhost:3000 ✅
```

---

## 📝 ملاحظات مهمة

1. **يجب** تشغيل Backend قبل Frontend
2. Backend يعمل على المنفذ `3001`
3. Frontend يعمل على المنفذ `3000`
4. إذا غيرت PORT في Backend، غيره في Frontend أيضاً:
   - ملف: `frontend/lib/api.ts`
   - السطر: `baseURL: 'http://localhost:3001/api/v1'`

---

## 🆘 المساعدة

إذا واجهت مشاكل:

1. تأكد من تشغيل PostgreSQL
2. تأكد من صحة DATABASE_URL في `.env`
3. شغل `npm run seed` مرة أخرى
4. راجع logs في Terminal
5. تحقق من أن Backend يعمل على `http://localhost:3001`

---

**✅ الآن يمكنك تشغيل Frontend بأمان!**

