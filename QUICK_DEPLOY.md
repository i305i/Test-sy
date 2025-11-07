# 🚀 النشر السريع - IP: 93.127.160.182

## ✅ الملفات الجاهزة:

- ✅ `backend/env.production.example` - إعدادات Backend
- ✅ `frontend/env.production.example` - إعدادات Frontend
- ✅ `setup-server.sh` - سكريبت إعداد الخادم
- ✅ `DEPLOYMENT_WITH_IP.md` - دليل تفصيلي

---

## 📝 الخطوات السريعة:

### 1. رفع المشروع على GitHub:

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2. على الخادم - استنساخ المشروع:

```bash
cd /var/www
git clone https://github.com/rayz-511/systeam-sy.git company-docs
cd company-docs
```

### 3. إعداد الخادم (شغّل مرة واحدة):

```bash
chmod +x setup-server.sh
./setup-server.sh
```

### 4. إعداد ملفات البيئة:

```bash
# Backend
cp backend/env.production.example backend/.env
nano backend/.env  # عدّل كلمات المرور

# Frontend
cp frontend/env.production.example frontend/.env.local
```

### 5. إعداد قاعدة البيانات:

```bash
sudo -u postgres psql
CREATE DATABASE company_docs;
CREATE USER company_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE company_docs TO company_user;
ALTER USER company_user CREATEDB;
\q

cd backend
npx prisma migrate deploy
npm run seed
```

### 6. بناء وتشغيل:

```bash
# Backend
cd backend
npm install
npm run build
pm2 start npm --name "company-docs-backend" -- start

# Frontend
cd ../frontend
npm install
npm run build
pm2 start npm --name "company-docs-frontend" -- start

pm2 save
pm2 startup
```

### 7. إعداد Nginx:

```bash
sudo nano /etc/nginx/sites-available/company-docs
```

**انسخ من:** `DEPLOYMENT_WITH_IP.md` - الخطوة 7

```bash
sudo ln -s /etc/nginx/sites-available/company-docs /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## ✅ بعد الإعداد:

افتح: **http://93.127.160.182**

---

## 📋 قائمة التحقق:

- [ ] رفع المشروع على GitHub
- [ ] استنساخ المشروع على الخادم
- [ ] تشغيل `setup-server.sh`
- [ ] إعداد ملفات `.env`
- [ ] إعداد قاعدة البيانات
- [ ] تشغيل Migrations
- [ ] بناء Backend و Frontend
- [ ] إعداد MinIO Bucket
- [ ] إعداد Nginx
- [ ] تشغيل مع PM2
- [ ] فتح البورتات في VPS Provider
- [ ] اختبار الموقع

---

## 🔗 الروابط:

- **الموقع:** http://93.127.160.182
- **API:** http://93.127.160.182/api/v1
- **MinIO Console:** http://93.127.160.182:9001

