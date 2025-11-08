# 🔧 إعداد الخادم - الحل السريع

## ❌ المشكلة:

```
chmod: cannot access 'setup-server.sh': No such file or directory
```

الملف غير موجود في `/var/www`.

---

## ✅ الحل:

### الطريقة 1: إنشاء الملف مباشرة على الخادم:

```bash
# على الخادم
cd /var/www/company-docs

# إنشاء الملف
cat > setup-server.sh << 'EOF'
#!/bin/bash
set -e

echo "📦 تحديث النظام..."
sudo apt update && sudo apt upgrade -y

echo "📦 تثبيت Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
    source ~/.bashrc
    nvm install 20
    nvm use 20
    nvm alias default 20
fi

echo "📦 تثبيت PostgreSQL..."
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql

echo "📦 تثبيت Redis..."
sudo apt install redis-server -y
sudo systemctl start redis-server
sudo systemctl enable redis-server

echo "📦 تثبيت Nginx..."
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx

echo "📦 تثبيت PM2..."
npm install -g pm2

echo "📦 تثبيت MinIO..."
if [ ! -f /usr/local/bin/minio ]; then
    wget https://dl.min.io/server/minio/release/linux-amd64/minio
    chmod +x minio
    sudo mv minio /usr/local/bin/
fi

sudo mkdir -p /var/minio/data /etc/minio
sudo chown $USER:$USER /var/minio/data /etc/minio

sudo tee /etc/minio/minio.env > /dev/null <<ENVEOF
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123
ENVEOF

sudo tee /etc/systemd/system/minio.service > /dev/null <<SERVICEEOF
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
SERVICEEOF

sudo systemctl daemon-reload
sudo systemctl start minio
sudo systemctl enable minio

echo "🔥 فتح البورتات..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 9000/tcp
sudo ufw allow 9001/tcp
sudo ufw --force enable

echo "✅ تم إعداد الخادم بنجاح!"
EOF

chmod +x setup-server.sh
./setup-server.sh
```

### الطريقة 2: تنفيذ الأوامر يدوياً:

راجع ملف: `SETUP_SERVER_MANUAL.md` للأوامر الكاملة.

### الطريقة 3: سحب الملف من GitHub:

```bash
# إذا كان الملف موجود في GitHub
cd /var/www/company-docs
git pull origin main

# ثم شغّله
chmod +x setup-server.sh
./setup-server.sh
```

---

## ✅ بعد إنشاء الملف:

```bash
chmod +x setup-server.sh
./setup-server.sh
```

---

## 📝 ملاحظة:

إذا كان المشروع في `/var/www/company-docs`، تأكد من أنك في المجلد الصحيح:

```bash
cd /var/www/company-docs
ls -la setup-server.sh
```

