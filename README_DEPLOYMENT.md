# 🚀 دليل النشر السريع - IP: 93.127.160.182

## 📋 معلومات الخادم:

- **IP:** 93.127.160.182
- **النظام:** Ubuntu 24.04
- **بدون Domain:** استخدام IP مباشرة

---

## ✅ الخطوات السريعة:

### 1. إعداد الخادم (شغّل على الخادم):

```bash
# رفع ملف setup-server.sh
scp setup-server.sh root@93.127.160.182:/root/

# الاتصال بالخادم
ssh root@93.127.160.182

# تشغيل سكريبت الإعداد
chmod +x setup-server.sh
./setup-server.sh
```

### 2. رفع المشروع:

#### الطريقة 1: استخدام Git (موصى به):

```bash
# على الخادم
cd /var/www
git clone https://github.com/your-username/your-repo.git company-docs
cd company-docs
```

#### الطريقة 2: استخدام rsync:

```bash
# من الكمبيوتر المحلي
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude '.next' \
  ./ root@93.127.160.182:/var/www/company-docs/
```

### 3. إعداد ملفات البيئة:

```bash
# على الخادم
cd /var/www/company-docs

# Backend
cp backend/.env.production backend/.env
nano backend/.env  # عدّل كلمات المرور

# Frontend
cp frontend/.env.production frontend/.env.local
```

### 4. إعداد قاعدة البيانات:

```bash
# على الخادم
sudo -u postgres psql
CREATE DATABASE company_docs;
CREATE USER company_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE company_docs TO company_user;
ALTER USER company_user CREATEDB;
\q

# تشغيل Migrations
cd /var/www/company-docs/backend
npx prisma migrate deploy
npm run seed
```

### 5. تثبيت التبعيات وبناء المشروع:

```bash
# Backend
cd /var/www/company-docs/backend
npm install
npm run build

# Frontend
cd /var/www/company-docs/frontend
npm install
npm run build
```

### 6. إعداد MinIO Bucket:

```bash
# تثبيت MinIO Client
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/

# إنشاء Bucket
mc alias set myminio http://localhost:9000 minioadmin minioadmin123
mc mb myminio/company-docs
```

### 7. إعداد Nginx:

```bash
sudo nano /etc/nginx/sites-available/company-docs
```

**المحتوى:**
```nginx
server {
    listen 80;
    server_name 93.127.160.182;

    client_max_body_size 100M;

    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/company-docs /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 8. تشغيل التطبيقات:

```bash
# Backend
cd /var/www/company-docs/backend
pm2 start npm --name "company-docs-backend" -- start

# Frontend
cd /var/www/company-docs/frontend
pm2 start npm --name "company-docs-frontend" -- start

pm2 save
pm2 startup
```

---

## ✅ بعد الإعداد:

افتح: **http://93.127.160.182**

**الروابط:**
- **الموقع:** http://93.127.160.182
- **API:** http://93.127.160.182/api/v1
- **MinIO Console:** http://93.127.160.182:9001

---

## 📝 ملفات جاهزة:

- ✅ `backend/.env.production` - إعدادات Backend جاهزة
- ✅ `frontend/.env.production` - إعدادات Frontend جاهزة
- ✅ `setup-server.sh` - سكريبت إعداد الخادم
- ✅ `deploy.sh` - سكريبت النشر
- ✅ `DEPLOYMENT_WITH_IP.md` - دليل تفصيلي

---

## ⚠️ ملاحظات مهمة:

1. **غيّر جميع كلمات المرور** في `backend/.env`
2. **افتح البورتات** في VPS Provider:
   - 80 (HTTP)
   - 22 (SSH)
   - 9000 (MinIO API)
   - 9001 (MinIO Console)
3. **استخدم HTTP** (وليس HTTPS) لأنك لا تملك domain

---

## 🔄 تحديث المشروع:

```bash
# على الخادم
cd /var/www/company-docs
git pull

cd backend
npm install
npm run build
pm2 restart company-docs-backend

cd ../frontend
npm install
npm run build
pm2 restart company-docs-frontend
```

