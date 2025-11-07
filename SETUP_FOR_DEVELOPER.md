# 👨‍💻 دليل إعداد المشروع للمبرمج الجديد

## 📥 الحصول على المشروع

### **1. Clone المشروع**
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

---

## 🛠️ متطلبات النظام

### **البرامج المطلوبة:**
- ✅ **Node.js** 20 LTS أو أحدث: https://nodejs.org
- ✅ **PostgreSQL** 16 أو أحدث: https://www.postgresql.org/download
- ✅ **Redis**: https://redis.io/download
- ✅ **MinIO**: https://min.io/download
- ✅ **Git**: https://git-scm.com/downloads

### **أو استخدم Docker:**
```bash
# تشغيل جميع الخدمات
docker-compose up -d
```

---

## ⚙️ إعداد Backend

### **1. الانتقال إلى مجلد Backend**
```bash
cd backend
```

### **2. تثبيت المكتبات**
```bash
npm install
```

### **3. إعداد متغيرات البيئة**
```bash
# نسخ ملف المثال
cp env.example.txt .env

# تعديل .env بالقيم الصحيحة:
# - DATABASE_URL
# - JWT_SECRET
# - MINIO_ACCESS_KEY
# - MINIO_SECRET_KEY
# - وغيرها...
```

### **4. إعداد قاعدة البيانات**
```bash
# توليد Prisma Client
npx prisma generate

# تشغيل Migrations
npx prisma migrate dev

# (اختياري) Seed البيانات
npx prisma db seed
```

### **5. تشغيل Backend**
```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

**Backend سيعمل على:** `http://localhost:5000`

---

## 🎨 إعداد Frontend

### **1. الانتقال إلى مجلد Frontend**
```bash
cd frontend
```

### **2. تثبيت المكتبات**
```bash
npm install
```

### **3. إعداد متغيرات البيئة**
```bash
# نسخ ملف المثال
cp env.example.txt .env.local

# تعديل .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

### **4. تشغيل Frontend**
```bash
# Development mode
npm run dev

# Production mode
npm run build
npm run start
```

**Frontend سيعمل على:** `http://localhost:3000`

---

## 🐳 استخدام Docker (أسهل طريقة)

### **1. تشغيل جميع الخدمات**
```bash
# من مجلد المشروع الرئيسي
docker-compose up -d
```

### **2. التحقق من الخدمات**
```bash
# PostgreSQL: localhost:5432
# Redis: localhost:6379
# MinIO: localhost:9000
# Backend: localhost:5000
# Frontend: localhost:3000
```

### **3. إيقاف الخدمات**
```bash
docker-compose down
```

---

## 🔐 بيانات الدخول الافتراضية

### **MinIO Console:**
- **URL**: http://localhost:9001
- **Username**: `minioadmin`
- **Password**: `minioadmin`

### **PostgreSQL:**
- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `company_docs` (أو حسب .env)
- **Username**: `postgres` (أو حسب .env)
- **Password**: (حسب .env)

### **Backend API:**
- **URL**: http://localhost:5000/api/v1
- **Swagger**: http://localhost:5000/api/docs

---

## 📚 هيكل المشروع

```
company-docs-manager/
├── backend/              # NestJS Backend
│   ├── src/
│   │   ├── modules/     # Modules (auth, companies, documents, etc.)
│   │   ├── common/       # Shared utilities
│   │   └── database/     # Prisma service
│   ├── prisma/
│   │   ├── schema.prisma # Database schema
│   │   └── migrations/   # Database migrations
│   └── package.json
│
├── frontend/            # Next.js Frontend
│   ├── app/             # App Router pages
│   ├── components/      # React components
│   ├── lib/             # Utilities & API client
│   ├── store/           # Zustand stores
│   └── package.json
│
├── docker-compose.yml   # Docker services
├── README.md            # Project documentation
└── .gitignore          # Git ignore rules
```

---

## 🧪 اختبار المشروع

### **1. اختبار Backend**
```bash
cd backend
npm run test
```

### **2. اختبار Frontend**
```bash
cd frontend
npm run test
```

### **3. اختبار E2E**
```bash
# Backend
cd backend
npm run test:e2e

# Frontend
cd frontend
npm run test:e2e
```

---

## 🐛 حل المشاكل الشائعة

### **المشكلة 1: "Cannot connect to database"**
```bash
# تحقق من:
# 1. PostgreSQL يعمل
# 2. DATABASE_URL في .env صحيح
# 3. قاعدة البيانات موجودة
```

### **المشكلة 2: "Prisma Client not generated"**
```bash
npx prisma generate
```

### **المشكلة 3: "Port already in use"**
```bash
# غيّر PORT في .env
# أو أوقف العملية التي تستخدم المنفذ
```

### **المشكلة 4: "Module not found"**
```bash
# أعد تثبيت المكتبات
rm -rf node_modules package-lock.json
npm install
```

---

## 📖 موارد إضافية

- **Backend README**: `backend/README.md`
- **Frontend README**: `frontend/README.md`
- **API Documentation**: http://localhost:5000/api/docs
- **Project README**: `README.md`

---

## ✅ Checklist الإعداد

- [ ] Node.js مثبت
- [ ] PostgreSQL يعمل
- [ ] Redis يعمل
- [ ] MinIO يعمل
- [ ] Backend يعمل على port 5000
- [ ] Frontend يعمل على port 3000
- [ ] قاعدة البيانات مهيأة
- [ ] يمكن تسجيل الدخول

---

## 🎯 الخطوات التالية

1. ✅ اقرأ `README.md` لفهم المشروع
2. ✅ راجع `ARCHITECTURE.md` لفهم البنية
3. ✅ اقرأ `CONTRIBUTING.md` لإرشادات المساهمة
4. ✅ راجع `SECURITY_GUIDE.md` للأمان

---

**جاهز للبدء! 🚀**

إذا واجهت أي مشكلة، راجع `GITHUB_SETUP.md` أو تواصل مع الفريق.

