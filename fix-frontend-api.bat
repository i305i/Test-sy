@echo off
chcp 65001 >nul
cd /d %~dp0frontend

echo ========================================
echo   إصلاح إعدادات Frontend API
echo ========================================
echo.

echo 📝 تحديث ملف .env.local...
echo.

REM إنشاء ملف .env.local مع المسار الصحيح
(
echo NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
echo NEXT_PUBLIC_APP_NAME=نظام إدارة الشركات
echo NEXT_PUBLIC_APP_VERSION=1.0.0
) > .env.local

echo ✅ تم تحديث .env.local
echo.
echo 📋 المحتوى:
type .env.local
echo.
echo ⚠️  مهم جداً: يجب إعادة تشغيل Frontend لتطبيق التغييرات
echo.
echo 1. أوقف Frontend (Ctrl+C في نافذة Frontend)
echo 2. شغّله مرة أخرى: npm run dev
echo.
pause
