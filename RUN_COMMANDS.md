# 🚀 أوامر تشغيل المشروع الكاملة

## 📋 الخطوة 1: تحديث إعدادات Frontend

```powershell
# تحديث ملف .env.local في Frontend
Set-Content -Path "frontend\.env.local" -Value "NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1`nNEXT_PUBLIC_APP_NAME=`"نظام إدارة الشركات`"`nNEXT_PUBLIC_APP_VERSION=1.0.0"
```

---

## 📋 الخطوة 2: التحقق من قاعدة البيانات

### في HeidiSQL:
1. تأكد من الاتصال بقاعدة البيانات `company_docs`
2. تحقق من وجود الجداول:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

### إذا لم تكن الجداول موجودة، شغّل:
```powershell
cd backend
npx prisma migrate dev
npm run seed
```

---

## 📋 الخطوة 3: تشغيل Backend

```powershell
cd backend
npm run start:dev
```

**الـ Backend سيعمل على:** http://localhost:5000

**للتحقق:**
- Health Check: http://localhost:5000/api/v1/health
- API Docs: http://localhost:5000/api-docs

---

## 📋 الخطوة 4: تشغيل Frontend (في نافذة Terminal جديدة)

```powershell
cd frontend
npm run dev
```

**الـ Frontend سيعمل على:** http://localhost:3000

---

## 📋 أوامر سريعة (نسخ ولصق)

### تشغيل كل شيء دفعة واحدة:

**Terminal 1 - Backend:**
```powershell
cd C:\Users\Admin\Desktop\Systym_ms\backend
npm run start:dev
```

**Terminal 2 - Frontend:**
```powershell
cd C:\Users\Admin\Desktop\Systym_ms\frontend
npm run dev
```

---

## 🔧 أوامر إضافية مفيدة

### إعادة تعبئة قاعدة البيانات:
```powershell
cd backend
npm run seed
```

### عرض بيانات قاعدة البيانات (Prisma Studio):
```powershell
cd backend
npm run studio
```
سيفتح على: http://localhost:5555

### إعادة تشغيل قاعدة البيانات من الصفر:
```powershell
cd backend
npx prisma migrate reset
npm run seed
```

### التحقق من حالة Migrations:
```powershell
cd backend
npx prisma migrate status
```

---

## 📊 بيانات الدخول

بعد تشغيل `npm run seed`:

### Super Admin:
- Email: `admin@companydocs.com`
- Password: `Admin@123`

### Supervisor:
- Email: `supervisor@companydocs.com`
- Password: `Supervisor@123`

### Employee:
- Email: `employee@companydocs.com`
- Password: `Employee@123`

---

## 🌐 الروابط المهمة

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api/v1
- **API Docs:** http://localhost:5000/api-docs
- **Health Check:** http://localhost:5000/api/v1/health
- **Prisma Studio:** http://localhost:5555 (عند تشغيل `npm run studio`)

---

## ⚠️ ملاحظات مهمة

1. **تأكد من تشغيل PostgreSQL** قبل تشغيل Backend
2. **افتح نافذتين Terminal** - واحدة للـ Backend وأخرى للـ Frontend
3. **Hydration mismatch** في Console عادي - سببه إضافات المتصفح ويمكن تجاهله
4. **إذا لم تعمل البيانات** - شغّل `npm run seed` في مجلد backend

---

## 🛑 إيقاف الخدمات

- اضغط `Ctrl+C` في كل Terminal لإيقاف الخدمات
- أو أغلق نوافذ Terminal

---

## 🔍 حل المشاكل السريع

### المشكلة: Backend لا يعمل
```powershell
# تحقق من PostgreSQL
# في HeidiSQL: تأكد من الاتصال

# تحقق من ملف .env
cd backend
Get-Content .env | Select-String "DATABASE_URL"
```

### المشكلة: Frontend لا يتصل بالـ Backend
```powershell
# تحقق من ملف .env.local
cd frontend
Get-Content .env.local

# يجب أن يكون:
# NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

### المشكلة: قاعدة البيانات فارغة
```powershell
cd backend
npm run seed
```

