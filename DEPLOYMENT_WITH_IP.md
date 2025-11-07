# 🚀 رفع المشروع على الخادم - استخدام IP مباشرة

## 📋 معلومات الخادم:

- **IP:** 93.127.160.182
- **النظام:** Ubuntu 24.04
- **بدون Domain:** استخدام IP مباشرة

---

## ✅ الخطوات السريعة:

### 1. إعداد الخادم:

```bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تثبيت Node.js 20
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

# تثبيت PostgreSQL, Redis, Nginx
sudo apt install postgresql postgresql-contrib redis-server nginx -y

# تثبيت PM2
npm install -g pm2
```

### 2. رفع المشروع:

```bash
cd /var/www
sudo git clone your-repo.git company-docs
sudo chown -R $USER:$USER company-docs
cd company-docs
```

### 3. تثبيت التبعيات:

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

### 4. إعداد متغيرات البيئة:

#### Backend (`backend/.env`):
```env
NODE_ENV=production
PORT=5000

DATABASE_URL=postgresql://company_user:your_password@localhost:5432/company_docs?schema=public

REDIS_HOST=localhost
REDIS_PORT=6379

MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET=company-docs
MINIO_USE_SSL=false

JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRY=15m
JWT_REFRESH_SECRET=your-refresh-secret-change-in-production
JWT_REFRESH_EXPIRY=7d

FRONTEND_URL=http://93.127.160.182
```

#### Frontend (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://93.127.160.182/api/v1
NEXT_PUBLIC_APP_NAME=نظام إدارة الشركات
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### 5. إعداد قاعدة البيانات:

```bash
# إنشاء قاعدة البيانات
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

### 6. إعداد MinIO:

```bash
# تثبيت MinIO
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
sudo mv minio /usr/local/bin/

# إعداد الخدمة
sudo mkdir -p /var/minio/data /etc/minio
sudo chown $USER:$USER /var/minio/data /etc/minio

sudo tee /etc/minio/minio.env > /dev/null <<EOF
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123
EOF

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

# إنشاء Bucket
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/
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

### 9. فتح البورتات:

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 9000/tcp
sudo ufw allow 9001/tcp
sudo ufw enable
```

**⚠️ مهم:** تأكد من فتح البورتات في إعدادات VPS Provider أيضاً!

---

## ✅ بعد الإعداد:

افتح: **http://93.127.160.182**

**الروابط:**
- **الموقع:** http://93.127.160.182
- **API:** http://93.127.160.182/api/v1
- **MinIO Console:** http://93.127.160.182:9001

---

## 📝 ملاحظات:

1. **استخدم HTTP** (وليس HTTPS) لأنك لا تملك domain
2. **غيّر جميع كلمات المرور** في `.env`
3. **افتح البورتات** في VPS Provider
4. **راقب السجلات** باستخدام `pm2 logs`

---

## 🔄 تحديث المشروع:

```bash
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

