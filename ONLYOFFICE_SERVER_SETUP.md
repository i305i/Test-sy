# 🚀 دليل إعداد OnlyOffice Document Server على السيرفر

## 📋 المتطلبات

- سيرفر Linux (Ubuntu 20.04+ أو Debian 11+)
- Docker و Docker Compose مثبتين
- مساحة قرص كافية (5GB+)
- ذاكرة RAM: 4GB+ (موصى به 8GB)
- معالج: 2 cores+ (موصى به 4 cores)

---

## 🔧 الخطوة 1: تثبيت Docker (إذا لم يكن مثبتاً)

إذا ظهرت رسالة `Command 'docker' not found`، قم بتثبيت Docker أولاً:

### الطريقة السريعة (استخدام السكريبت):

```bash
# نسخ السكريبت إلى السيرفر
# ثم تشغيله:
sudo bash INSTALL_DOCKER_AND_ONLYOFFICE.sh
```

### الطريقة اليدوية:

```bash
# تحديث النظام
sudo apt update

# تثبيت المتطلبات
sudo apt install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# إضافة Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# إضافة Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# تحديث apt
sudo apt update

# تثبيت Docker
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# بدء Docker service
sudo systemctl start docker
sudo systemctl enable docker

# التحقق من التثبيت
docker --version
```

---

## 🔧 الخطوة 2: تثبيت OnlyOffice Document Server

### الطريقة 1: استخدام Docker (موصى به)

```bash
# الانتقال إلى مجلد المشروع
cd /var/www/company-docs  # أو المسار الذي تستخدمه

# إنشاء مجلدات للبيانات
sudo mkdir -p /app/onlyoffice/DocumentServer/{logs,data,lib,db}
sudo chown -R $USER:$USER /app/onlyoffice

# تشغيل OnlyOffice Document Server
docker run -i -t -d -p 8080:80 --restart=always \
  --name onlyoffice-documentserver \
  -v /app/onlyoffice/DocumentServer/logs:/var/log/onlyoffice \
  -v /app/onlyoffice/DocumentServer/data:/var/www/onlyoffice/Data \
  -v /app/onlyoffice/DocumentServer/lib:/var/lib/onlyoffice \
  -v /app/onlyoffice/DocumentServer/db:/var/lib/postgresql \
  onlyoffice/documentserver

# التحقق من الحالة
docker ps | grep onlyoffice
```

### الطريقة 2: إضافة إلى docker-compose.yml

أضف الخدمة التالية إلى ملف `docker-compose.yml`:

```yaml
services:
  onlyoffice:
    image: onlyoffice/documentserver
    container_name: onlyoffice-documentserver
    restart: always
    ports:
      - "8080:80"
    volumes:
      - /app/onlyoffice/DocumentServer/logs:/var/log/onlyoffice
      - /app/onlyoffice/DocumentServer/data:/var/www/onlyoffice/Data
      - /app/onlyoffice/DocumentServer/lib:/var/lib/onlyoffice
      - /app/onlyoffice/DocumentServer/db:/var/lib/postgresql
    environment:
      - JWT_ENABLED=true
      - JWT_SECRET=your-secret-key-change-in-production-min-32-chars
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

ثم شغّل:
```bash
docker-compose up -d onlyoffice
```

---

## ⚙️ الخطوة 2: إعداد متغيرات البيئة

### Backend (.env)

افتح ملف `.env` في مجلد `backend` وأضف/عدّل:

```env
# OnlyOffice Document Server
# استبدل localhost بعنوان IP السيرفر أو النطاق
ONLYOFFICE_DOCUMENT_SERVER_URL=http://93.127.160.182:8080
# أو إذا كان على نفس السيرفر:
# ONLYOFFICE_DOCUMENT_SERVER_URL=http://localhost:8080

# Secret Key - يجب أن يكون نفس المفتاح في OnlyOffice
ONLYOFFICE_SECRET=your-secret-key-change-in-production-min-32-chars

# Backend URL - استبدل بعنوان IP أو النطاق
BACKEND_URL=http://93.127.160.182:5000
# أو إذا كان لديك نطاق:
# BACKEND_URL=https://api.yourdomain.com

# Frontend URL
FRONTEND_URL=http://93.127.160.182:3000
# أو:
# FRONTEND_URL=https://yourdomain.com
```

### Frontend (.env.local)

افتح ملف `.env.local` في مجلد `frontend` وأضف:

```env
# OnlyOffice Document Server URL
# استبدل localhost بعنوان IP السيرفر أو النطاق
NEXT_PUBLIC_ONLYOFFICE_DOCUMENT_SERVER_URL=http://93.127.160.182:8080
# أو إذا كان على نفس السيرفر:
# NEXT_PUBLIC_ONLYOFFICE_DOCUMENT_SERVER_URL=http://localhost:8080

# Backend API URL
NEXT_PUBLIC_API_URL=http://93.127.160.182:5000/api/v1
# أو:
# NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
```

---

## 🔒 الخطوة 3: إعداد JWT Secret في OnlyOffice

إذا كنت تستخدم JWT (موصى به للإنتاج):

```bash
# تعديل إعدادات OnlyOffice
docker exec -it onlyoffice-documentserver bash

# داخل الحاوية، عدّل ملف الإعدادات
nano /etc/onlyoffice/documentserver/local.json
```

أضف/عدّل:

```json
{
  "services": {
    "CoAuthoring": {
      "token": {
        "enable": {
          "request": {
            "inbox": true,
            "outbox": true
          },
          "browser": true
        },
        "inbox": {
          "header": "Authorization"
        },
        "outbox": {
          "header": "Authorization"
        }
      },
      "secret": {
        "inbox": {
          "string": "your-secret-key-change-in-production-min-32-chars"
        },
        "outbox": {
          "string": "your-secret-key-change-in-production-min-32-chars"
        },
        "browser": {
          "string": "your-secret-key-change-in-production-min-32-chars"
        }
      }
    }
  }
}
```

**مهم**: استخدم نفس المفتاح في `ONLYOFFICE_SECRET` في Backend!

ثم أعد تشغيل الحاوية:
```bash
docker restart onlyoffice-documentserver
```

---

## 🌐 الخطوة 4: إعداد Nginx (اختياري - للإنتاج)

إذا كنت تستخدم Nginx كـ Reverse Proxy:

```bash
sudo nano /etc/nginx/sites-available/company-docs
```

أضف التكوين التالي:

```nginx
# OnlyOffice Document Server
server {
    listen 80;
    server_name onlyoffice.yourdomain.com;  # أو عنوان IP

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS headers
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS';
        add_header Access-Control-Allow-Headers 'Authorization, Content-Type';
    }
}

# Backend API (مع Callback URL)
server {
    listen 80;
    server_name api.yourdomain.com;  # أو عنوان IP

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # OnlyOffice Callback
    location /api/v1/onlyoffice/callback {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

فعّل الموقع:
```bash
sudo ln -s /etc/nginx/sites-available/company-docs /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔥 الخطوة 5: فتح المنافذ في Firewall

```bash
# فتح منفذ OnlyOffice
sudo ufw allow 8080/tcp

# فتح منافذ Backend و Frontend (إذا لم تكن مفتوحة)
sudo ufw allow 5000/tcp
sudo ufw allow 3000/tcp

# أو إذا كنت تستخدم Nginx
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

---

## ✅ الخطوة 6: اختبار النظام

### 1. اختبار OnlyOffice Document Server

```bash
# اختبار Health Check
curl http://93.127.160.182:8080/healthcheck
# يجب أن يعيد: true

# اختبار API
curl http://93.127.160.182:8080/web-apps/apps/api/documents/api.js
# يجب أن يعيد محتوى JavaScript
```

### 2. اختبار Backend

```bash
# اختبار Health Check
curl http://93.127.160.182:5000/api/v1/health
# يجب أن يعيد حالة النظام

# اختبار OnlyOffice Config (يتطلب Token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://93.127.160.182:5000/api/v1/onlyoffice/config/DOCUMENT_ID
```

### 3. اختبار من المتصفح

1. افتح المتصفح وانتقل إلى: `http://93.127.160.182:3000`
2. سجّل الدخول
3. افتح شركة وانتقل إلى الملفات
4. اضغط على زر "تحرير" بجانب ملف Word أو Excel
5. يجب أن يفتح محرر OnlyOffice

---

## 🐛 استكشاف الأخطاء

### المشكلة 1: المحرر لا يفتح

**الحل**:
```bash
# تحقق من أن OnlyOffice يعمل
docker ps | grep onlyoffice

# تحقق من السجلات
docker logs onlyoffice-documentserver

# تحقق من المنافذ
sudo netstat -tulpn | grep 8080
```

### المشكلة 2: خطأ CORS

**الحل**: تأكد من أن:
- `ONLYOFFICE_DOCUMENT_SERVER_URL` في Frontend صحيح
- OnlyOffice يسمح بالطلبات من نطاقك
- Nginx (إن وجد) يضيف CORS headers

### المشكلة 3: الملف لا يُحفظ

**الحل**:
```bash
# تحقق من Callback URL
# يجب أن يكون: {BACKEND_URL}/api/v1/onlyoffice/callback

# تحقق من سجلات Backend
cd backend
npm run start:dev
# راقب السجلات عند محاولة الحفظ

# تحقق من سجلات OnlyOffice
docker logs onlyoffice-documentserver --tail 100
```

### المشكلة 4: خطأ في تحميل الملف

**الحل**:
```bash
# تحقق من MinIO
docker ps | grep minio

# تحقق من Download Token
# تأكد من أن Token لم ينتهِ صلاحيته
# تحقق من أن Token لم يُستخدم مسبقاً
```

---

## 🔐 الأمان

### 1. استخدام HTTPS (موصى به للإنتاج)

```bash
# تثبيت Certbot
sudo apt install certbot python3-certbot-nginx

# الحصول على شهادة SSL
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com -d onlyoffice.yourdomain.com
```

### 2. تحديث JWT Secret

```bash
# إنشاء مفتاح قوي
openssl rand -base64 32

# استخدمه في:
# - ONLYOFFICE_SECRET في Backend
# - JWT secret في OnlyOffice config
```

### 3. تقييد الوصول

```bash
# تقييد OnlyOffice للوصول من Backend فقط
sudo ufw delete allow 8080/tcp
sudo ufw allow from YOUR_BACKEND_IP to any port 8080
```

---

## 📊 مراقبة الأداء

### مراقبة استخدام الموارد

```bash
# مراقبة OnlyOffice
docker stats onlyoffice-documentserver

# مراقبة جميع الحاويات
docker stats
```

### سجلات OnlyOffice

```bash
# عرض السجلات
docker logs onlyoffice-documentserver --tail 100 -f

# سجلات محددة
docker exec onlyoffice-documentserver tail -f /var/log/onlyoffice/documentserver/converter/out.log
```

---

## 🔄 التحديث

```bash
# إيقاف OnlyOffice
docker stop onlyoffice-documentserver

# سحب الصورة الجديدة
docker pull onlyoffice/documentserver

# حذف الحاوية القديمة
docker rm onlyoffice-documentserver

# إعادة التشغيل (استخدم نفس الأمر من الخطوة 1)
docker run -i -t -d -p 8080:80 --restart=always \
  --name onlyoffice-documentserver \
  -v /app/onlyoffice/DocumentServer/logs:/var/log/onlyoffice \
  -v /app/onlyoffice/DocumentServer/data:/var/www/onlyoffice/Data \
  -v /app/onlyoffice/DocumentServer/lib:/var/lib/onlyoffice \
  -v /app/onlyoffice/DocumentServer/db:/var/lib/postgresql \
  onlyoffice/documentserver
```

---

## 📝 ملاحظات مهمة

1. **عنوان IP**: استبدل `93.127.160.182` بعنوان IP السيرفر الفعلي
2. **النطاق**: إذا كان لديك نطاق، استخدمه بدلاً من IP
3. **الذاكرة**: OnlyOffice يحتاج 4GB+ RAM للعمل بشكل جيد
4. **المساحة**: احتفظ بمساحة كافية للبيانات (5GB+)
5. **النسخ الاحتياطي**: احتفظ بنسخة احتياطية من `/app/onlyoffice/DocumentServer`

---

## ✅ قائمة التحقق النهائية

- [ ] OnlyOffice Document Server يعمل
- [ ] متغيرات البيئة محدثة في Backend
- [ ] متغيرات البيئة محدثة في Frontend
- [ ] JWT Secret متطابق في Backend و OnlyOffice
- [ ] المنافذ مفتوحة في Firewall
- [ ] Nginx معد (إن وجد)
- [ ] Health Check يعمل
- [ ] المحرر يفتح من المتصفح
- [ ] الحفظ التلقائي يعمل
- [ ] HTTPS معد (للإنتاج)

---

## 🆘 الدعم

إذا واجهت مشاكل:
1. تحقق من السجلات: `docker logs onlyoffice-documentserver`
2. تحقق من Health Check: `curl http://YOUR_IP:8080/healthcheck`
3. راجع [وثائق OnlyOffice](https://api.onlyoffice.com/)
4. راجع ملف `ONLYOFFICE_SETUP.md` للتفاصيل العامة

