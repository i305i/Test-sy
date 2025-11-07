@echo off
chcp 65001 >nul
cd /d %~dp0

echo ========================================
echo   التحقق من الخدمات
echo ========================================
echo.

echo 🔍 التحقق من Backend (البورت 5000)...
netstat -ano | findstr :5000 >nul
if %errorlevel% == 0 (
    echo ✅ Backend يعمل على البورت 5000
) else (
    echo ❌ Backend غير متصل على البورت 5000
    echo    شغّل: cd backend ^&^& npm run start:dev
)
echo.

echo 🔍 التحقق من Frontend (البورت 3000)...
netstat -ano | findstr :3000 >nul
if %errorlevel% == 0 (
    echo ✅ Frontend يعمل على البورت 3000
) else (
    echo ❌ Frontend غير متصل على البورت 3000
    echo    شغّل: cd frontend ^&^& npm run dev
)
echo.

echo 🔍 التحقق من ngrok...
tasklist | findstr ngrok.exe >nul
if %errorlevel% == 0 (
    echo ✅ ngrok يعمل
) else (
    echo ❌ ngrok غير متصل
    echo    شغّل: .\start-ngrok-frontend.bat
)
echo.

echo ========================================
echo   ملخص
echo ========================================
echo.
echo للتحقق يدوياً:
echo   1. افتح: http://localhost:3000
echo   2. افتح: http://localhost:5000/api/v1/health
echo.
pause

