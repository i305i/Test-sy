#!/bin/bash

# 🚀 سكريبت النشر على الخادم - Ubuntu 24.04
# IP: 93.127.160.182

set -e

echo "=========================================="
echo "  رفع المشروع على الخادم"
echo "  IP: 93.127.160.182"
echo "=========================================="
echo ""

# الألوان
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# التحقق من الاتصال بالخادم
echo -e "${YELLOW}📡 التحقق من الاتصال بالخادم...${NC}"
if ! ping -c 1 93.127.160.182 &> /dev/null; then
    echo -e "${RED}❌ لا يمكن الوصول إلى الخادم!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ الخادم متاح${NC}"
echo ""

# معلومات الاتصال
read -p "أدخل اسم المستخدم للخادم (افتراضي: root): " SERVER_USER
SERVER_USER=${SERVER_USER:-root}
SERVER_IP="93.127.160.182"
PROJECT_DIR="/var/www/company-docs"

echo ""
echo "=========================================="
echo "  معلومات الاتصال:"
echo "  المستخدم: $SERVER_USER"
echo "  الخادم: $SERVER_IP"
echo "  المجلد: $PROJECT_DIR"
echo "=========================================="
echo ""

read -p "هل تريد المتابعة؟ (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "تم الإلغاء"
    exit 1
fi

echo ""
echo -e "${YELLOW}📦 رفع الملفات...${NC}"

# رفع المشروع (استخدم rsync أو scp)
echo "استخدم أحد الأوامر التالية:"
echo ""
echo "1. باستخدام rsync (موصى به):"
echo "   rsync -avz --exclude 'node_modules' --exclude '.git' --exclude '.next' ./ $SERVER_USER@$SERVER_IP:$PROJECT_DIR/"
echo ""
echo "2. باستخدام scp:"
echo "   scp -r ./ $SERVER_USER@$SERVER_IP:$PROJECT_DIR/"
echo ""
echo "3. أو استخدم Git:"
echo "   ssh $SERVER_USER@$SERVER_IP 'cd $PROJECT_DIR && git pull'"
echo ""

echo -e "${GREEN}✅ اكمل الخطوات يدوياً على الخادم${NC}"
echo ""
echo "راجع ملف: DEPLOYMENT_WITH_IP.md"

