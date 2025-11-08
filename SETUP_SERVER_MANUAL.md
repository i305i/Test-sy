# 🔧 إعداد الخادم يدوياً - Ubuntu 24.04

## 📋 الأوامر الكاملة (بدون سكريبت):

### 1. تحديث النظام:

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. تثبيت Node.js 20:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
nvm alias default 20
node --version
```

### 3. تثبيت PostgreSQL:

```bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql

# إنشاء قاعدة البيانات
sudo -u postgres psql
CREATE DATABASE company_docs;
CREATE USER company_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE company_docs TO company_user;
ALTER USER company_user CREATEDB;
\q
```

### 4. تثبيت Redis:

```bash
sudo apt install redis-server -y
sudo systemctl start redis-server
sudo systemctl enable redis-server
redis-cli ping
```

### 5. تثبيت Nginx:

```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

### 6. تثبيت PM2:

```bash
npm install -g pm2
```

### 7. تثبيت MinIO:

```bash
# تحميل MinIO
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
sudo mv minio /usr/local/bin/

# إنشاء المجلدات
sudo mkdir -p /var/minio/data /etc/minio
sudo chown $USER:$USER /var/minio/data /etc/minio

# إنشاء ملف البيئة
sudo tee /etc/minio/minio.env > /dev/null <<EOF
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123
EOF

# إنشاء خدمة systemd
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

# تشغيل MinIO
sudo systemctl daemon-reload
sudo systemctl start minio
sudo systemctl enable minio
sudo systemctl status minio
```

### 8. تثبيت MinIO Client:

```bash
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/

# إنشاء Bucket
mc alias set myminio http://localhost:9000 minioadmin minioadmin123
mc mb myminio/company-docs
mc ls myminio/
```

### 9. فتح البورتات:

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 9000/tcp
sudo ufw allow 9001/tcp
sudo ufw --force enable
sudo ufw status
```

---

## ✅ بعد الإعداد:

الآن يمكنك متابعة الخطوات من `QUICK_DEPLOY.md`:

1. إعداد ملفات `.env`
2. تشغيل Migrations
3. بناء المشروع
4. إعداد Nginx
5. تشغيل مع PM2

---

## 📝 ملاحظة:

إذا كان المشروع موجود في `/var/www/company-docs`، انتقل إليه:

```bash
cd /var/www/company-docs
```

