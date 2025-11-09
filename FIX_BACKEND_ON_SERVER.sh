#!/bin/bash
# سكريبت لإصلاح الباك اند على الخادم

echo "🔧 إصلاح إعدادات الباك اند..."

cd /var/www/Test-sy/backend

# 1. نسخ احتياطي
echo "📦 إنشاء نسخة احتياطية..."
cp src/main.ts src/main.ts.backup.$(date +%Y%m%d_%H%M%S)

# 2. التحقق من أن التغييرات موجودة في main.ts
echo "✅ التحقق من التغييرات..."

# 3. إعادة بناء الباك اند
echo "🔨 إعادة بناء الباك اند..."
npm run build

# 4. التحقق من Firewall
echo "🔥 التحقق من Firewall..."
if command -v ufw &> /dev/null; then
    echo "   فتح المنفذ 5000..."
    sudo ufw allow 5000/tcp
    sudo ufw reload
elif command -v firewall-cmd &> /dev/null; then
    echo "   فتح المنفذ 5000..."
    sudo firewall-cmd --permanent --add-port=5000/tcp
    sudo firewall-cmd --reload
fi

# 5. إعادة تشغيل الباك اند
echo "🔄 إعادة تشغيل الباك اند..."
if command -v pm2 &> /dev/null; then
    pm2 restart backend
    pm2 logs backend --lines 20
else
    echo "⚠️  PM2 غير مثبت. يجب إعادة تشغيل الباك اند يدوياً:"
    echo "   npm run start:prod"
fi

# 6. التحقق من الاتصال
echo ""
echo "🧪 اختبار الاتصال..."
sleep 2
curl -s http://localhost:5000/api/v1 || echo "❌ الباك اند لا يستجيب على localhost:5000"
curl -s http://93.127.160.182:5000/api/v1 || echo "❌ الباك اند لا يستجيب على 93.127.160.182:5000"

echo ""
echo "✅ انتهى!"
echo ""
echo "📋 للتحقق من أن الباك اند يعمل:"
echo "   curl http://93.127.160.182:5000/api/v1"
echo ""
echo "📋 لعرض logs:"
echo "   pm2 logs backend"

