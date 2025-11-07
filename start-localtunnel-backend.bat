@echo off
chcp 65001 >nul
cd /d %~dp0

echo ========================================
echo   تشغيل localtunnel للـ Backend (البورت 5000)
echo ========================================
echo.

REM التحقق من تثبيت localtunnel
where lt >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ localtunnel غير مثبت
    echo.
    echo 📥 جاري التثبيت...
    npm install -g localtunnel
    echo.
    if %errorlevel% neq 0 (
        echo ❌ فشل التثبيت
        echo.
        echo 📝 تأكد من تثبيت Node.js أولاً
        pause
        exit /b 1
    )
)

echo ✅ localtunnel مثبت
echo.
echo 🌐 جاري فتح البورت 5000...
echo.
echo ⚠️  بعد التشغيل، انسخ الرابط الذي يظهر (مثلاً: https://abc123.loca.lt)
echo.
echo ⚠️  تأكد من أن Backend يعمل على localhost:5000
echo.
pause

lt --port 5000

