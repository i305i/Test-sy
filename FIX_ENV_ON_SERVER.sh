#!/bin/bash
# سكريبت لإصلاح ملف env على الخادم

cd /var/www/Test-sy/frontend

# نسخ احتياطي
cp env env.backup.$(date +%Y%m%d_%H%M%S)

# نسخ إلى .env.local (الأولوية الأعلى في Next.js)
cp env .env.local

# نسخ إلى .env أيضاً للتوافق
cp env .env

# عرض المحتوى للتأكد
echo "✅ تم إنشاء الملفات:"
echo ""
echo "📄 محتوى .env.local:"
cat .env.local
echo ""
echo "📄 محتوى .env:"
cat .env

echo ""
echo "🔄 الآن يجب إعادة تشغيل سيرفر Next.js:"
echo "   pm2 restart frontend"
echo "   أو"
echo "   npm run dev"

