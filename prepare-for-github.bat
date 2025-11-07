@echo off
chcp 65001 >nul
cd /d %~dp0

echo ========================================
echo   إعداد المشروع للرفع على GitHub
echo ========================================
echo.

echo 📋 التحقق من Git...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Git غير مثبت
    echo.
    echo 📥 حمّل Git من: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo ✅ Git مثبت
echo.

echo 📋 التحقق من .gitignore...
if not exist .gitignore (
    echo ⚠️  ملف .gitignore غير موجود
    echo    سيتم إنشاؤه...
    echo.
) else (
    echo ✅ ملف .gitignore موجود
)
echo.

echo 📋 التحقق من ملفات .env...
if exist backend\.env (
    echo ⚠️  ملف backend\.env موجود - تأكد من أنه في .gitignore
)
if exist frontend\.env.local (
    echo ⚠️  ملف frontend\.env.local موجود - تأكد من أنه في .gitignore
)
echo.

echo 📋 حالة Git الحالية:
git status
echo.

echo ========================================
echo   الخطوات التالية:
echo ========================================
echo.
echo 1. أنشئ Repository جديد على GitHub:
echo    https://github.com/new
echo.
echo 2. شغّل الأوامر التالية:
echo.
echo    git init
echo    git remote add origin https://github.com/your-username/repo-name.git
echo    git add .
echo    git commit -m "Initial commit"
echo    git branch -M main
echo    git push -u origin main
echo.
echo 3. أو استخدم السكريبت: git-push-new-repo.bat
echo.
pause

