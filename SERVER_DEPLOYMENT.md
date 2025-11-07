# 🚀 رفع المشروع على الخادم - Ubuntu 24.04

## 📋 المتطلبات الأساسية:

### على الخادم (Ubuntu 24.04):
- ✅ Node.js (v18 أو أحدث)
- ✅ PostgreSQL (v16 - متوفر افتراضياً في Ubuntu 24.04)
- ✅ Redis (v7 - متوفر افتراضياً في Ubuntu 24.04)
- ✅ MinIO (أو S3-compatible storage)
- ✅ PM2 (لإدارة العمليات)
- ✅ Nginx (كـ reverse proxy)

---

## ✅ الخطوة 1: إعداد الخادم (Ubuntu 24.04)

### 1.1 تحديث النظام:

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 تثبيت Node.js (Ubuntu 24.04):

#### الطريقة 1: استخدام nvm (موصى به):

```bash
# تثبيت nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
source ~/.bashrc

# تثبيت Node.js 20 LTS
nvm install 20
nvm use 20
nvm alias default 20

# التحقق من الإصدار
node --version
npm --version
```

#### الطريقة 2: استخدام NodeSource (بديل):

```bash
# تثبيت Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# التحقق من الإصدار
node --version
npm --version
```

### 1.3 تثبيت PostgreSQL (Ubuntu 24.04):

```bash
# Ubuntu 24.04 يأتي مع PostgreSQL 16 افتراضياً
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql

# التحقق من الإصدار
sudo -u postgres psql -c "SELECT version();"

# إنشاء قاعدة البيانات
sudo -u postgres psql
CREATE DATABASE company_docs;
CREATE USER company_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE company_docs TO company_user;
ALTER USER company_user CREATEDB;
\q
```

### 1.4 تثبيت Redis (Ubuntu 24.04):

```bash
# Ubuntu 24.04 يأتي مع Redis 7 افتراضياً
sudo apt install redis-server -y
sudo systemctl start redis-server
sudo systemctl enable redis-server

# التحقق من الإصدار
redis-cli --version

# اختبار Redis
redis-cli ping
# يجب أن يعيد: PONG
```

### 1.5 تثبيت MinIO (Ubuntu 24.04):

```bash
# تحميل MinIO (أحدث إصدار)
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
sudo mv minio /usr/local/bin/

# التحقق من الإصدار
minio --version

# إنشاء مجلد للبيانات
sudo mkdir -p /var/minio/data
sudo chown $USER:$USER /var/minio/data

# إنشاء مجلد للإعدادات
sudo mkdir -p /etc/minio
sudo chown $USER:$USER /etc/minio

# إنشاء ملف متغيرات البيئة
sudo tee /etc/minio/minio.env > /dev/null <<EOF
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123
EOF

# تشغيل MinIO كخدمة
sudo tee /etc/systemd/system/minio.service > /dev/null <<EOF
[Unit]
Description=MinIO Object Storage
After=network.target

[Service]
Type=simple
User=$USER
Group=$USER
EnvironmentFile=/etc/minio/minio.env
ExecStart=/usr/local/bin/minio server /var/minio/data --console-address ":9001"
Restart=always
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl start minio
sudo systemctl enable minio

# التحقق من الحالة
sudo systemctl status minio

# الوصول إلى MinIO Console
# افتح: http://your-server-ip:9001
# تسجيل الدخول: minioadmin / minioadmin123
```

#### تثبيت MinIO Client (mc):

```bash
# تحميل MinIO Client
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/

# إعداد Alias
mc alias set myminio http://localhost:9000 minioadmin minioadmin123

# إنشاء Bucket
mc mb myminio/company-docs

# التحقق من Bucket
mc ls myminio/
```

### 1.6 تثبيت PM2:

```bash
npm install -g pm2
```

### 1.7 تثبيت Nginx (Ubuntu 24.04):

```bash
# Ubuntu 24.04
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx

# التحقق من الحالة
sudo systemctl status nginx

# فتح البورتات في UFW
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

---

## ✅ الخطوة 2: رفع المشروع

### 2.1 استنساخ المشروع:

```bash
cd /var/www
sudo git clone https://github.com/your-username/your-repo.git company-docs
sudo chown -R $USER:$USER company-docs
cd company-docs
```

### 2.2 تثبيت التبعيات:

```bash
# Backend
cd backend
npm install
npm run build

# Frontend
cd ../frontend
npm install
npm run build
```

---

## ✅ الخطوة 3: إعداد متغيرات البيئة

### 3.1 Backend (.env):

```bash
cd /var/www/company-docs/backend
nano .env
```

**المحتوى:**
```env
NODE_ENV=production
PORT=5000

# Database
DATABASE_URL=postgresql://company_user:your_secure_password@localhost:5432/company_docs?schema=public

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=company-docs
MINIO_USE_SSL=false

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRY=15m
JWT_REFRESH_SECRET=your-refresh-secret-change-in-production
JWT_REFRESH_EXPIRY=7d

# Frontend URL (استخدم IP إذا لم يكن لديك domain)
FRONTEND_URL=http://93.127.160.182

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000

# File Upload
MAX_FILE_SIZE=52428800
```

### 3.2 Frontend (.env.local):

```bash
cd /var/www/company-docs/frontend
nano .env.local
```

**المحتوى:**
```env
NEXT_PUBLIC_API_URL=http://93.127.160.182/api/v1
NEXT_PUBLIC_APP_NAME=نظام إدارة الشركات
NEXT_PUBLIC_APP_VERSION=1.0.0
```

---

## ✅ الخطوة 4: إعداد قاعدة البيانات

```bash
cd /var/www/company-docs/backend

# تشغيل Migrations
npx prisma migrate deploy

# تشغيل Seed (اختياري)
npm run seed
```

---

## ✅ الخطوة 5: إعداد MinIO Bucket

### الطريقة 1: عبر MinIO Console (واجهة الويب):

```bash
# الوصول إلى MinIO Console
# افتح: http://your-server-ip:9001
# تسجيل الدخول: minioadmin / minioadmin123

# إنشاء Bucket باسم: company-docs
# 1. اضغط على "Create Bucket"
# 2. أدخل الاسم: company-docs
# 3. اضغط "Create Bucket"
```

### الطريقة 2: عبر MinIO Client (CLI):

```bash
# إذا لم تكن مثبتة، ثبت MinIO Client
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/

# إعداد Alias
mc alias set myminio http://localhost:9000 minioadmin minioadmin123

# إنشاء Bucket
mc mb myminio/company-docs

# التحقق من Bucket
mc ls myminio/

# إعداد Bucket Policy (اختياري - للوصول العام)
mc anonymous set download myminio/company-docs
```

### التحقق من MinIO:

```bash
# التحقق من حالة الخدمة
sudo systemctl status minio

# التحقق من Bucket
mc ls myminio/company-docs

# اختبار الرفع
echo "test" | mc pipe myminio/company-docs/test.txt
mc cat myminio/company-docs/test.txt
```

---

## ✅ الخطوة 6: تشغيل التطبيقات مع PM2

### 6.1 Backend:

```bash
cd /var/www/company-docs/backend
pm2 start npm --name "company-docs-backend" -- start
pm2 save
```

### 6.2 Frontend:

```bash
cd /var/www/company-docs/frontend
pm2 start npm --name "company-docs-frontend" -- start
pm2 save
```

### 6.3 إعداد PM2 للبدء التلقائي:

```bash
pm2 startup
# اتبع التعليمات التي تظهر
pm2 save
```

---

## ✅ الخطوة 7: إعداد Nginx (بدون Domain - استخدام IP مباشرة)

```bash
sudo nano /etc/nginx/sites-available/company-docs
```

**المحتوى (للاستخدام مع IP مباشرة):**
```nginx
server {
    listen 80;
    server_name 93.127.160.182;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Max Upload Size
    client_max_body_size 100M;

    # Backend API
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
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Frontend
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

**⚠️ ملاحظة:** إذا أردت استخدام SSL لاحقاً مع domain، يمكنك إضافة server block آخر لـ HTTPS.

**تفعيل الموقع:**

```bash
sudo ln -s /etc/nginx/sites-available/company-docs /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## ✅ الخطوة 8: إعداد SSL (اختياري - يحتاج Domain)

**⚠️ ملاحظة:** Let's Encrypt يحتاج domain name. إذا لم يكن لديك domain، يمكنك تخطي هذه الخطوة واستخدام HTTP.

### إذا كان لديك domain لاحقاً:

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### بديل: استخدام Self-Signed Certificate (للتطوير فقط):

```bash
# إنشاء Self-Signed Certificate
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/nginx-selfsigned.key \
  -out /etc/ssl/certs/nginx-selfsigned.crt

# ثم أضف SSL في Nginx config
```

**⚠️ تحذير:** Self-Signed Certificate سيظهر تحذير في المتصفح. استخدمه للتطوير فقط!

---

## ✅ الخطوة 9: فتح البورتات في Firewall (Ubuntu 24.04)

```bash
# UFW (Ubuntu 24.04)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS (إذا استخدمت SSL)
sudo ufw allow 9000/tcp   # MinIO API
sudo ufw allow 9001/tcp   # MinIO Console
sudo ufw enable

# التحقق من الحالة
sudo ufw status
```

**⚠️ مهم:** تأكد من فتح البورتات في إعدادات الخادم (VPS Provider) أيضاً:
- البورت 80 (HTTP)
- البورت 443 (HTTPS - إذا استخدمت SSL)
- البورت 22 (SSH)
- البورت 9000 (MinIO API)
- البورت 9001 (MinIO Console)

---

## ✅ الخطوة 10: التحقق من التشغيل

```bash
# التحقق من PM2
pm2 status
pm2 logs

# التحقق من Nginx
sudo systemctl status nginx

# التحقق من PostgreSQL
sudo systemctl status postgresql

# التحقق من Redis
sudo systemctl status redis

# التحقق من MinIO
sudo systemctl status minio
```

---

## 🔧 أوامر PM2 المفيدة:

```bash
# عرض الحالة
pm2 status

# عرض السجلات
pm2 logs

# إعادة التشغيل
pm2 restart all

# إيقاف
pm2 stop all

# حذف
pm2 delete all

# مراقبة
pm2 monit
```

---

## 🔄 تحديث المشروع:

```bash
cd /var/www/company-docs

# سحب التحديثات
git pull

# Backend
cd backend
npm install
npm run build
pm2 restart company-docs-backend

# Frontend
cd ../frontend
npm install
npm run build
pm2 restart company-docs-frontend
```

---

## 📝 ملاحظات مهمة:

1. **تأكد من تغيير جميع كلمات المرور** في ملف `.env`
2. **استخدم SSL** دائماً في الإنتاج
3. **قم بعمل نسخ احتياطي** لقاعدة البيانات بانتظام
4. **راقب السجلات** باستخدام PM2
5. **استخدم domain name** بدلاً من IP

---

## ✅ بعد الإعداد:

افتح: `http://93.127.160.182`

يجب أن يعمل الموقع بشكل كامل! 🎉

**الروابط:**
- **الموقع:** http://93.127.160.182
- **API:** http://93.127.160.182/api/v1
- **MinIO Console:** http://93.127.160.182:9001

