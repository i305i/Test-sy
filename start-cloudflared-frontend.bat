@echo off
chcp 65001 >nul
cd /d %~dp0

echo ========================================
echo   تشغيل Cloudflare Tunnel للـ Frontend (البورت 3000)
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
echo 🌐 جاري فتح البورت 3000...
echo.
echo ⚠️  بعد التشغيل، انسخ الرابط الذي يظهر
echo.
echo ⚠️  تأكد من أن Frontend يعمل على localhost:3000
echo.
pause

"%CLOUDFLARED_PATH%" tunnel --url http://localhost:3000

