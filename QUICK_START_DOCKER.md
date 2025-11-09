# 🚀 تشغيل سريع - جميع الخدمات مع Docker

## الطريقة السريعة

### 1. تشغيل جميع الخدمات دفعة واحدة:

```bash
docker compose up -d
```

### 2. أو استخدام السكريبت:

```bash
chmod +x START_ALL_SERVICES.sh
bash START_ALL_SERVICES.sh
```

---

## ما سيتم تشغيله:

✅ **PostgreSQL** - قاعدة البيانات (منفذ 5432)  
✅ **Redis** - التخزين المؤقت (منفذ 6379)  
✅ **MinIO** - تخزين الملفات (منفذ 9000, 9001)  
✅ **Backend** - API Server (منفذ 5000)  
✅ **Frontend** - Next.js App (منفذ 3000)  
✅ **OnlyOffice** - محرر المستندات (منفذ 8080)  

---

## بعد التشغيل:

### 1. انتظر حتى تبدأ جميع الخدمات (دقيقة أو دقيقتين)

```bash
# عرض حالة الخدمات
docker compose ps

# عرض السجلات
docker compose logs -f
```

### 2. إعداد قاعدة البيانات:

```bash
# الدخول إلى حاوية Backend
docker exec -it company-docs-backend sh

# داخل الحاوية:
cd /app
npx prisma generate
npx prisma migrate deploy
npm run seed

# أو من خارج الحاوية:
docker exec -it company-docs-backend sh -c "cd /app && npx prisma generate && npx prisma migrate deploy && npm run seed"
```

### 3. افتح المتصفح:

- **Frontend**: http://YOUR_SERVER_IP:3000
- **Backend API**: http://YOUR_SERVER_IP:5000/api/v1
- **OnlyOffice**: http://YOUR_SERVER_IP:8080
- **MinIO Console**: http://YOUR_SERVER_IP:9001

---

## أوامر مفيدة:

```bash
# إيقاف جميع الخدمات
docker compose down

# إعادة تشغيل خدمة معينة
docker compose restart backend
docker compose restart frontend

# عرض سجلات خدمة معينة
docker compose logs -f backend
docker compose logs -f frontend

# إعادة بناء وتشغيل
docker compose up -d --build

# حذف جميع البيانات (⚠️ احذر!)
docker compose down -v
```

---

## استكشاف الأخطاء:

### Backend لا يبدأ:

```bash
# عرض السجلات
docker compose logs backend

# الدخول إلى الحاوية
docker exec -it company-docs-backend sh

# التحقق من node_modules
ls -la node_modules

# إعادة تثبيت المكتبات
npm install
```

### Frontend لا يبدأ:

```bash
# عرض السجلات
docker compose logs frontend

# الدخول إلى الحاوية
docker exec -it company-docs-frontend sh

# التحقق من node_modules
ls -la node_modules

# إعادة تثبيت المكتبات
npm install
```

### OnlyOffice لا يعمل:

```bash
# اختبار Health Check
curl http://localhost:8080/healthcheck

# عرض السجلات
docker compose logs onlyoffice

# إعادة تشغيل
docker compose restart onlyoffice
```

---

## ملاحظات مهمة:

1. **المرة الأولى**: قد يستغرق تثبيت المكتبات وقتاً طويلاً (5-10 دقائق)
2. **الذاكرة**: تأكد من وجود ذاكرة كافية (4GB+ موصى به)
3. **المساحة**: تأكد من وجود مساحة كافية على القرص (5GB+)
4. **المنافذ**: تأكد من أن المنافذ مفتوحة في Firewall

---

## تحديث متغيرات البيئة:

إذا كنت تريد تغيير الإعدادات:

1. عدّل ملف `.env` في جذر المشروع
2. أو عدّل ملفات `backend/.env` و `frontend/.env.local`
3. أعد تشغيل الخدمات:

```bash
docker compose restart backend frontend
```

