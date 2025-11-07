@echo off
chcp 65001 >nul
cd /d %~dp0

echo ========================================
echo   رفع المشروع على GitHub - Repository جديد
echo ========================================
echo.

set /p REPO_URL="📝 أدخل رابط Repository (مثلاً: https://github.com/username/repo.git): "

if "%REPO_URL%"=="" (
    echo ❌ لم يتم إدخال الرابط
    pause
    exit /b 1
)

echo.
echo 📋 جاري الإعداد...
echo.

REM التحقق من Git
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Git غير مثبت
    pause
    exit /b 1
)

REM تهيئة Git (إذا لم يكن موجوداً)
if not exist .git (
    echo 📦 تهيئة Git...
    git init
)

REM إضافة Remote
echo 📡 إضافة Remote...
git remote remove origin >nul 2>&1
git remote add origin %REPO_URL%

REM إضافة الملفات
echo 📦 إضافة الملفات...
git add .

REM Commit
echo 💾 عمل Commit...
git commit -m "Initial commit: نظام إدارة الشركات والوثائق" 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  لا توجد تغييرات للرفع أو تم الرفع مسبقاً
)

REM رفع المشروع
echo 🚀 رفع المشروع...
git branch -M main
git push -u origin main

if %errorlevel% == 0 (
    echo.
    echo ✅ تم رفع المشروع بنجاح!
    echo.
    echo 🔗 افتح: %REPO_URL%
) else (
    echo.
    echo ❌ فشل الرفع
    echo.
    echo 📝 تحقق من:
    echo    1. رابط Repository صحيح
    echo    2. لديك صلاحيات الكتابة
    echo    3. تم إنشاء Repository على GitHub
)

echo.
pause

