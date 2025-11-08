#!/bin/bash

# 🚀 إنشاء ملف setup-server.sh على الخادم

cat > /var/www/company-docs/setup-server.sh << 'EOF'
#!/bin/bash

# 🚀 سكريبت إعداد الخادم - Ubuntu 24.04
# IP: 93.127.160.182

set -e

echo "=========================================="
echo "  إعداد الخادم - Ubuntu 24.04"
echo "  IP: 93.127.160.182"
echo "=========================================="
echo ""

# تحديث النظام
echo "📦 تحديث النظام..."
sudo apt update && sudo apt upgrade -y

# تثبيت Node.js 20
echo "📦 تثبيت Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
    source ~/.bashrc
    nvm install 20
    nvm use 20
    nvm alias default 20
fi
echo "✅ Node.js: $(node --version)"

# تثبيت PostgreSQL
echo "📦 تثبيت PostgreSQL..."
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql
echo "✅ PostgreSQL مثبت"

# تثبيت Redis
echo "📦 تثبيت Redis..."
sudo apt install redis-server -y
sudo systemctl start redis-server
sudo systemctl enable redis-server
echo "✅ Redis مثبت"

# تثبيت Nginx
echo "📦 تثبيت Nginx..."
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
echo "✅ Nginx مثبت"

# تثبيت PM2
echo "📦 تثبيت PM2..."
npm install -g pm2
echo "✅ PM2 مثبت"

# تثبيت MinIO
echo "📦 تثبيت MinIO..."
if [ ! -f /usr/local/bin/minio ]; then
    wget https://dl.min.io/server/minio/release/linux-amd64/minio
    chmod +x minio
    sudo mv minio /usr/local/bin/
fi

# إعداد MinIO
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
echo "✅ MinIO مثبت"

# فتح البورتات
echo "🔥 فتح البورتات..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 9000/tcp
sudo ufw allow 9001/tcp
sudo ufw --force enable
echo "✅ البورتات مفتوحة"

echo ""
echo "=========================================="
echo "  ✅ تم إعداد الخادم بنجاح!"
echo "=========================================="
echo ""
echo "الخطوات التالية:"
echo "1. إعداد قاعدة البيانات"
echo "2. إعداد ملفات .env"
echo "3. تشغيل Migrations"
echo "4. إعداد Nginx"
echo "5. تشغيل التطبيقات مع PM2"
echo ""
EOF

chmod +x /var/www/company-docs/setup-server.sh
echo "✅ تم إنشاء setup-server.sh"

