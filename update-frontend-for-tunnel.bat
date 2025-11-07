@echo off
chcp 65001 >nul
cd /d %~dp0frontend

echo ========================================
echo   تحديث Frontend لاستخدام Backend Tunnel
echo ========================================
echo.

set /p BACKEND_URL="📝 أدخل رابط Backend من Tunnel (مثلاً: https://xyz456.loca.lt): "

if "%BACKEND_URL%"=="" (
    echo ❌ لم يتم إدخال الرابط
    pause
    exit /b 1
)

REM إزالة / في النهاية إن وجد
set BACKEND_URL=%BACKEND_URL:/=%
set BACKEND_URL=%BACKEND_URL%/api/v1

echo.
echo 📝 جاري تحديث ملف .env.local...
echo.

REM إنشاء ملف .env.local
(
echo NEXT_PUBLIC_API_URL=%BACKEND_URL%
echo NEXT_PUBLIC_APP_NAME=نظام إدارة الشركات
echo NEXT_PUBLIC_APP_VERSION=1.0.0
) > .env.local

echo ✅ تم التحديث!
echo.
echo 📋 المحتوى:
type .env.local
echo.
echo ⚠️  مهم: يجب إعادة تشغيل Frontend لتطبيق التغييرات
echo.
echo 1. أوقف Frontend (Ctrl+C)
echo 2. شغّله مرة أخرى: npm run dev
echo.
pause

