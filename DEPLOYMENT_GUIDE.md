# 🚀 دليل النشر والإعداد (Deployment Guide)

## نظرة عامة

هذا الدليل يشرح كيفية تثبيت ونشر نظام إدارة الشركات والوثائق على بيئات مختلفة.

---

## 📋 المتطلبات الأساسية (Prerequisites)

### البيئة المحلية (Development)
- **Node.js**: v20.x أو أحدث
- **npm/yarn**: أحدث إصدار
- **Docker**: v24.x أو أحدث
- **Docker Compose**: v2.x أو أحدث
- **Git**: أحدث إصدار

### الإنتاج (Production)
- **خادم Linux**: Ubuntu 22.04 LTS أو CentOS 8+ (موصى به)
- **RAM**: 4GB كحد أدنى (8GB موصى به)
- **Storage**: 50GB كحد أدنى (SSD موصى به)
- **CPU**: 2 Cores كحد أدنى (4 Cores موصى به)
- **Domain**: اسم نطاق مع SSL certificate

---

## 🛠️ الإعداد المحلي (Local Development Setup)

### 1. استنساخ المشروع

```bash
# استنساخ المشروع
git clone https://github.com/your-org/company-docs-manager.git
cd company-docs-manager
```

### 2. إعداد ملفات البيئة

```bash
# نسخ ملف البيئة النموذجي
cp env.example.txt .env

# تعديل المتغيرات حسب الحاجة
nano .env
```

### 3. تشغيل المشروع باستخدام Docker Compose

#### الخيار 1: البيئة الأساسية (Minimal)

```bash
# تشغيل الخدمات الأساسية فقط
docker-compose up -d postgres redis minio backend frontend nginx
```

#### الخيار 2: البيئة الكاملة (Full)

```bash
# تشغيل جميع الخدمات بما فيها ClamAV و ElasticSearch
docker-compose --profile full up -d
```

#### الخيار 3: بيئة التطوير (Development)

```bash
# تشغيل مع أدوات التطوير (pgAdmin)
docker-compose --profile dev up -d
```

#### الخيار 4: بيئة المراقبة (Monitoring)

```bash
# تشغيل مع أدوات المراقبة (Prometheus & Grafana)
docker-compose --profile monitoring up -d
```

### 4. التحقق من تشغيل الخدمات

```bash
# عرض حالة الحاويات
docker-compose ps

# عرض السجلات
docker-compose logs -f

# التحقق من صحة الخدمات
curl http://localhost:5000/api/v1/health  # Backend
curl http://localhost:3000                # Frontend
```

### 5. إعداد قاعدة البيانات

```bash
# الدخول إلى حاوية الـ backend
docker-compose exec backend sh

# تشغيل migrations
npm run migrate

# تعبئة قاعدة البيانات ببيانات تجريبية
npm run seed

# الخروج
exit
```

### 6. الوصول للتطبيق

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api/v1
- **MinIO Console**: http://localhost:9001
- **pgAdmin** (إن كان مفعل): http://localhost:5050
- **Grafana** (إن كان مفعل): http://localhost:3001
- **Prometheus** (إن كان مفعل): http://localhost:9090

### 7. المستخدم الافتراضي

بعد تشغيل seed:
```
Email: admin@companydocs.com
Password: Admin@123
Role: Super Admin
```

---

## 📦 الإعداد بدون Docker (Manual Setup)

### 1. تثبيت PostgreSQL

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# إنشاء قاعدة بيانات
sudo -u postgres psql
CREATE DATABASE company_docs;
CREATE USER company_docs_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE company_docs TO company_docs_user;
\q
```

#### macOS (Homebrew)
```bash
brew install postgresql@16
brew services start postgresql@16

createdb company_docs
```

### 2. تثبيت Redis

#### Ubuntu/Debian
```bash
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

#### macOS
```bash
brew install redis
brew services start redis
```

### 3. تثبيت MinIO

#### Linux
```bash
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
sudo mv minio /usr/local/bin/

# إنشاء دليل البيانات
mkdir -p ~/minio/data

# تشغيل MinIO
MINIO_ROOT_USER=minioadmin MINIO_ROOT_PASSWORD=minioadmin123 \
  minio server ~/minio/data --console-address ":9001"
```

#### macOS
```bash
brew install minio/stable/minio
brew services start minio
```

### 4. إعداد Backend

```bash
cd backend

# تثبيت الحزم
npm install

# إعداد ملف البيئة
cp .env.example .env
nano .env

# تشغيل migrations
npm run migrate

# تعبئة البيانات
npm run seed

# تشغيل في وضع التطوير
npm run dev

# أو للإنتاج
npm run build
npm start
```

### 5. إعداد Frontend

```bash
cd frontend

# تثبيت الحزم
npm install

# إعداد ملف البيئة
cp .env.local.example .env.local
nano .env.local

# تشغيل في وضع التطوير
npm run dev

# أو للإنتاج
npm run build
npm start
```

---

## ☁️ النشر على الإنتاج (Production Deployment)

### خيار 1: النشر باستخدام Docker (موصى به)

#### 1. تجهيز الخادم

```bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تثبيت Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# تثبيت Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# إضافة المستخدم لمجموعة docker
sudo usermod -aG docker $USER
```

#### 2. إعداد المشروع

```bash
# استنساخ المشروع
git clone https://github.com/your-org/company-docs-manager.git
cd company-docs-manager

# إعداد متغيرات البيئة
cp env.example.txt .env

# ⚠️ مهم: تعديل المتغيرات للإنتاج
nano .env
```

**تغييرات مهمة للإنتاج:**
```env
NODE_ENV=production

# غيّر جميع كلمات المرور الافتراضية
DB_PASSWORD=strong-database-password
REDIS_PASSWORD=strong-redis-password
MINIO_ROOT_PASSWORD=strong-minio-password

# غيّر مفاتيح JWT
JWT_SECRET=your-very-long-random-secret-at-least-64-characters
JWT_REFRESH_SECRET=another-very-long-random-secret-at-least-64-characters

# إعدادات البريد الإلكتروني
SMTP_HOST=smtp.your-provider.com
SMTP_USER=your-email@domain.com
SMTP_PASS=your-email-password

# Domain
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1

# تفعيل الميزات الأمنية
VIRUS_SCAN_ENABLED=true
OCR_ENABLED=true
```

#### 3. إعداد SSL Certificate

```bash
# تثبيت Certbot
sudo apt install certbot python3-certbot-nginx

# الحصول على شهادة SSL
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# الشهادات ستكون في:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

#### 4. تحديث إعداد Nginx

```bash
# تعديل ملف nginx.conf
nano docker/nginx/nginx.conf
```

أضف إعدادات SSL:
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    # باقي الإعدادات...
}
```

#### 5. تشغيل المشروع

```bash
# بناء الصور
docker-compose build

# تشغيل الخدمات
docker-compose -f docker-compose.yml --profile full up -d

# التحقق من الحالة
docker-compose ps

# عرض السجلات
docker-compose logs -f
```

#### 6. إعداد Firewall

```bash
# تثبيت UFW
sudo apt install ufw

# السماح بالمنافذ الضرورية
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp       # HTTP
sudo ufw allow 443/tcp      # HTTPS

# تفعيل Firewall
sudo ufw enable
```

#### 7. إعداد النسخ الاحتياطي التلقائي

```bash
# إنشاء سكريبت النسخ الاحتياطي
nano /opt/backup.sh
```

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# إنشاء مجلد النسخ
mkdir -p $BACKUP_DIR

# النسخ الاحتياطي لقاعدة البيانات
docker-compose exec -T postgres pg_dump -U postgres company_docs | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# النسخ الاحتياطي للملفات من MinIO
docker-compose exec -T minio mc mirror /data/company-docs /backups/minio_$DATE/

# حذف النسخ القديمة (أكثر من 30 يوم)
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup completed: $DATE"
```

```bash
# جعل السكريبت قابل للتنفيذ
chmod +x /opt/backup.sh

# إضافة للـ cron (يومياً في 2 صباحاً)
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/backup.sh") | crontab -
```

### خيار 2: النشر على VPS بدون Docker

#### 1. تثبيت Node.js

```bash
# تثبيت Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# تثبيت PM2 للإدارة
sudo npm install -g pm2
```

#### 2. تثبيت البرمجيات المطلوبة

```bash
# PostgreSQL
sudo apt install postgresql postgresql-contrib

# Redis
sudo apt install redis-server

# Nginx
sudo apt install nginx

# MinIO (كما في القسم السابق)
```

#### 3. بناء ونشر Backend (NestJS)

```bash
cd backend
npm install --production
npm run build

# إنشاء ملف PM2
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'company-docs-backend',
    script: 'dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
EOF

# تشغيل باستخدام PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 4. بناء ونشر Frontend

```bash
cd frontend
npm install --production
npm run build

# PM2 config
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'company-docs-frontend',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
EOF

pm2 start ecosystem.config.js
pm2 save
```

#### 5. إعداد Nginx كـ Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/company-docs
```

```nginx
# Frontend
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
    }
}
```

```bash
# تفعيل الموقع
sudo ln -s /etc/nginx/sites-available/company-docs /etc/nginx/sites-enabled/

# اختبار الإعداد
sudo nginx -t

# إعادة تشغيل Nginx
sudo systemctl restart nginx
```

### خيار 3: النشر على Kubernetes

#### 1. تجهيز ملفات Kubernetes

```bash
mkdir -p k8s

# إنشاء ملف للـ namespace
cat > k8s/namespace.yaml << EOF
apiVersion: v1
kind: Namespace
metadata:
  name: company-docs
EOF

# إنشاء secrets
cat > k8s/secrets.yaml << EOF
apiVersion: v1
kind: Secret
metadata:
  name: company-docs-secrets
  namespace: company-docs
type: Opaque
stringData:
  DB_PASSWORD: your-db-password
  REDIS_PASSWORD: your-redis-password
  JWT_SECRET: your-jwt-secret
EOF

# المزيد من ملفات Kubernetes...
```

#### 2. نشر على الكلستر

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/
```

---

## 🔧 الصيانة (Maintenance)

### النسخ الاحتياطي (Backup)

#### نسخ احتياطي لقاعدة البيانات
```bash
# باستخدام Docker
docker-compose exec postgres pg_dump -U postgres company_docs > backup_$(date +%Y%m%d).sql

# بدون Docker
pg_dump -U company_docs_user company_docs > backup_$(date +%Y%m%d).sql
```

#### استعادة النسخة الاحتياطية
```bash
# باستخدام Docker
cat backup.sql | docker-compose exec -T postgres psql -U postgres company_docs

# بدون Docker
psql -U company_docs_user company_docs < backup.sql
```

### التحديثات (Updates)

```bash
# إيقاف الخدمات
docker-compose down

# سحب آخر التحديثات
git pull origin main

# تحديث الصور
docker-compose build

# تشغيل migrations إن وجدت
docker-compose run backend npm run migrate

# إعادة التشغيل
docker-compose up -d
```

### المراقبة (Monitoring)

```bash
# مراقبة استخدام الموارد
docker stats

# السجلات
docker-compose logs -f [service_name]

# التحقق من صحة الخدمات
curl http://localhost:5000/api/v1/health
```

---

## 🐛 حل المشاكل (Troubleshooting)

### المشكلة: لا يمكن الاتصال بقاعدة البيانات

```bash
# التحقق من تشغيل PostgreSQL
docker-compose ps postgres

# عرض سجلات PostgreSQL
docker-compose logs postgres

# اختبار الاتصال
docker-compose exec postgres psql -U postgres -c "SELECT 1"
```

### المشكلة: خطأ في رفع الملفات

```bash
# التحقق من MinIO
docker-compose ps minio
docker-compose logs minio

# التحقق من المساحة المتوفرة
df -h

# التحقق من الصلاحيات
ls -la uploads/
```

### المشكلة: أداء بطيء

```bash
# تحليل استخدام الموارد
docker stats

# التحقق من الاستعلامات البطيئة
docker-compose exec postgres psql -U postgres -c "
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;"

# تنظيف Redis cache
docker-compose exec redis redis-cli FLUSHALL
```

---

## 📊 مقاييس النجاح (Success Metrics)

بعد النشر، تحقق من:

- [ ] جميع الخدمات تعمل بشكل صحيح
- [ ] يمكن تسجيل الدخول بنجاح
- [ ] يمكن إنشاء شركات جديدة
- [ ] يمكن رفع الملفات بنجاح
- [ ] النسخ الاحتياطي التلقائي يعمل
- [ ] SSL مفعل وصالح
- [ ] المراقبة تعمل
- [ ] الأداء مقبول (< 2s response time)

---

## 📞 الدعم

للمساعدة أو الإبلاغ عن مشاكل:
- Email: support@companydocs.com
- GitHub Issues: [Link]
- Documentation: [Link]

