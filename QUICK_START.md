# 🚀 دليل البدء السريع (Quick Start Guide)

دليل مختصر لتشغيل المشروع في أسرع وقت ممكن.

---

## ⚡ البدء في دقائق

### المتطلبات
- Docker & Docker Compose مثبتان
- 4GB RAM كحد أدنى
- 10GB مساحة حرة

### خطوات سريعة

```bash
# 1. استنساخ المشروع
git clone https://github.com/your-org/company-docs-manager.git
cd company-docs-manager

# 2. نسخ ملف البيئة
cp env.example.txt .env

# 3. تشغيل المشروع
docker-compose up -d

# 4. الانتظار حتى يجهز النظام (دقيقة واحدة تقريباً)
docker-compose logs -f

# 5. افتح المتصفح
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

### المستخدم الافتراضي

بعد تشغيل seed:

```
Email: admin@companydocs.com
Password: Admin@123
Role: Super Admin
```

---

## 📦 الأوامر الأساسية

### تشغيل المشروع
```bash
# تشغيل جميع الخدمات
docker-compose up -d

# تشغيل خدمات معينة
docker-compose up -d postgres redis minio backend frontend

# مشاهدة السجلات
docker-compose logs -f [service-name]
```

### إيقاف المشروع
```bash
# إيقاف جميع الخدمات
docker-compose down

# إيقاف وحذف البيانات
docker-compose down -v
```

### قاعدة البيانات
```bash
# تشغيل migrations
docker-compose exec backend npm run migrate

# تعبئة بيانات تجريبية
docker-compose exec backend npm run seed

# فتح Prisma Studio
docker-compose exec backend npm run studio
```

### الاختبارات
```bash
# Backend tests
docker-compose exec backend npm test

# Frontend tests
docker-compose exec frontend npm test
```

---

## 📚 الوثائق الكاملة

للمزيد من التفاصيل، راجع:

### 📖 الأساسيات
- [README.md](README.md) - نظرة عامة شاملة
- [ARCHITECTURE.md](ARCHITECTURE.md) - معمارية النظام
- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - بنية المشروع

### 🔧 التطوير
- [CONTRIBUTING.md](CONTRIBUTING.md) - دليل المساهمة
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - توثيق الـ API
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - مخطط قاعدة البيانات

### 🚀 النشر والتشغيل
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - دليل النشر الشامل
- [SECURITY_GUIDE.md](SECURITY_GUIDE.md) - دليل الأمان

### 📊 التخطيط
- [ROADMAP.md](ROADMAP.md) - خارطة طريق المشروع
- [CHANGELOG.md](CHANGELOG.md) - سجل التغييرات

### 👥 المستخدمين
- [USER_GUIDE.md](USER_GUIDE.md) - دليل المستخدم الشامل

---

## 🆘 حل المشاكل السريع

### المشكلة: Port already in use
```bash
# تغيير المنافذ في .env
FRONTEND_PORT=3001
BACKEND_PORT=5001
DB_PORT=5433
```

### المشكلة: Cannot connect to database
```bash
# إعادة تشغيل PostgreSQL
docker-compose restart postgres

# التحقق من الحالة
docker-compose ps postgres
```

### المشكلة: Out of memory
```bash
# زيادة حد الذاكرة لـ Docker Desktop
# Settings > Resources > Memory > 4GB+
```

---

## 🔗 روابط مهمة

### بيئة التطوير
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api/v1
- API Docs: http://localhost:5000/api-docs
- MinIO Console: http://localhost:9001
- pgAdmin: http://localhost:5050 (إن كان مفعل)

### الوثائق
- [GitHub Repository](#)
- [Issue Tracker](#)
- [Wiki](#)

---

## 💡 نصائح سريعة

### للمطورين
```bash
# مشاهدة التغييرات تلقائياً (Hot Reload)
docker-compose up backend frontend

# الوصول لـ shell الحاوية
docker-compose exec backend sh
docker-compose exec frontend sh

# تنظيف كل شيء والبدء من جديد
docker-compose down -v
docker-compose up -d
docker-compose exec backend npm run migrate
docker-compose exec backend npm run seed
```

### للاختبار السريع
```bash
# إنشاء بيانات تجريبية سريعة
curl -X POST http://localhost:5000/api/v1/test/seed

# اختبار API
curl http://localhost:5000/api/v1/health
```

---

## ⚙️ التخصيص السريع

### تغيير المتغيرات الأساسية

في ملف `.env`:

```env
# تغيير المنافذ
FRONTEND_PORT=3000
BACKEND_PORT=5000

# تغيير كلمات المرور (تطوير فقط)
DB_PASSWORD=postgres123
REDIS_PASSWORD=redis123
MINIO_ROOT_PASSWORD=minioadmin123

# تغيير JWT secrets (مهم للإنتاج!)
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here
```

---

## 📞 الحصول على المساعدة

### إذا واجهت مشكلة:

1. **راجع الوثائق**: معظم الأسئلة مُجابة في الملفات أعلاه
2. **راجع Issues**: ابحث في GitHub Issues الموجودة
3. **افتح Issue جديد**: إذا لم تجد الحل
4. **اتصل بالدعم**: support@companydocs.com

---

## ✅ Checklist للبداية

- [ ] Docker مثبت ويعمل
- [ ] المشروع مستنسخ
- [ ] ملف `.env` منسوخ ومعدّل
- [ ] `docker-compose up -d` نُفذ بنجاح
- [ ] جميع الخدمات تعمل (تحقق بـ `docker-compose ps`)
- [ ] يمكن الوصول للـ frontend (http://localhost:3000)
- [ ] يمكن الوصول للـ backend (http://localhost:5000)
- [ ] تم تشغيل migrations
- [ ] تم تشغيل seed
- [ ] يمكن تسجيل الدخول بالمستخدم الافتراضي

---

**مبروك! 🎉 أنت الآن جاهز للبدء في التطوير!**

للمزيد من التفاصيل، راجع [README.md](README.md) الكامل.

