@echo off
chcp 65001 >nul
cd /d %~dp0

echo ========================================
echo   تشغيل Cloudflare Tunnel للـ Frontend و Backend
echo ========================================
echo.

REM البحث عن cloudflared.exe
set CLOUDFLARED_PATH=

if exist "C:\cloudflared\cloudflared.exe" (
    set CLOUDFLARED_PATH=C:\cloudflared\cloudflared.exe
) else if exist "%LOCALAPPDATA%\cloudflared\cloudflared.exe" (
    set CLOUDFLARED_PATH=%LOCALAPPDATA%\cloudflared\cloudflared.exe
) else if exist "cloudflared.exe" (
    set CLOUDFLARED_PATH=cloudflared.exe
) else (
    echo ❌ لم يتم العثور على cloudflared.exe
    echo.
    echo 📥 حمّل cloudflared من: https://github.com/cloudflare/cloudflared/releases
    echo 📁 ضع cloudflared.exe في: C:\cloudflared\
    echo.
    pause
    exit /b 1
)

echo ✅ تم العثور على cloudflared: %CLOUDFLARED_PATH%
echo.

REM إنشاء ملف config.yml
set CONFIG_FILE=%TEMP%\cloudflared-config.yml

echo 📝 إنشاء ملف الإعدادات...
echo.

(
echo ingress:
echo   - hostname: frontend.localhost
echo     service: http://localhost:3000
echo   - hostname: backend.localhost
echo     service: http://localhost:5000
echo   - service: http_status:404
) > "%CONFIG_FILE%"

echo ✅ تم إنشاء ملف الإعدادات: %CONFIG_FILE%
echo.
echo 📋 المحتوى:
type "%CONFIG_FILE%"
echo.

echo ⚠️  ملاحظة:
echo    Cloudflare Tunnel المجاني لا يدعم hostname مخصص
echo    سيتم فتح نفق واحد فقط
echo.
echo    الحل: استخدم نفقين منفصلين
echo.
pause

echo.
echo 🌐 جاري فتح Frontend و Backend...
echo.
echo ⚠️  سيتم فتح Frontend أولاً
echo ⚠️  افتح نافذة أخرى لفتح Backend
echo.
pause

REM فتح Frontend في نافذة منفصلة
start "Cloudflare Tunnel Frontend" cmd /k ""%CLOUDFLARED_PATH%" tunnel --url http://localhost:3000"

timeout /t 2 >nul

REM فتح Backend في نافذة منفصلة
start "Cloudflare Tunnel Backend" cmd /k ""%CLOUDFLARED_PATH%" tunnel --url http://localhost:5000"

echo.
echo ✅ تم فتح Frontend و Backend في نافذتين منفصلتين
echo.
echo 📝 انسخ الروابط من النوافذ المنفصلة
echo.
pause

