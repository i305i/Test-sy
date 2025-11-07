# 🚀 دليل رفع المشروع على GitHub

## 📋 الخطوات الكاملة

### **المرحلة 1: إعداد Git (إذا لم يكن مثبتاً)**

#### **1.1 تثبيت Git**
```bash
# تحقق من تثبيت Git
git --version

# إذا لم يكن مثبتاً، حمّله من:
# https://git-scm.com/downloads
```

#### **1.2 إعداد Git (للمرة الأولى فقط)**
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

---

### **المرحلة 2: إنشاء Repository على GitHub**

#### **2.1 إنشاء حساب GitHub (إذا لم يكن لديك)**
1. اذهب إلى: https://github.com
2. سجّل حساب جديد
3. أكد البريد الإلكتروني

#### **2.2 إنشاء Repository جديد**
1. اضغط على **"+"** في أعلى الصفحة → **"New repository"**
2. املأ البيانات:
   - **Repository name**: `company-docs-manager` (أو أي اسم تريده)
   - **Description**: `نظام إدارة الشركات والوثائق - Company Docs Manager`
   - **Visibility**: 
     - ✅ **Public** (للمشاركة العامة)
     - 🔒 **Private** (للمشاركة الخاصة - يحتاج GitHub Pro)
   - ❌ **لا** تضع علامة على "Initialize with README" (لأن لدينا ملفات)
3. اضغط **"Create repository"**

---

### **المرحلة 3: رفع المشروع**

#### **3.1 فتح Terminal في مجلد المشروع**
```bash
# انتقل إلى مجلد المشروع
cd C:\Users\R\Desktop\sy
```

#### **3.2 تهيئة Git (للمرة الأولى فقط)**
```bash
# تهيئة Git repository
git init

# إضافة جميع الملفات
git add .

# إنشاء commit أولي
git commit -m "Initial commit: Company Docs Manager System"
```

#### **3.3 ربط المشروع بـ GitHub**
```bash
# استبدل YOUR_USERNAME و YOUR_REPO_NAME بالقيم الصحيحة
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# مثال:
# git remote add origin https://github.com/ahmed/company-docs-manager.git
```

#### **3.4 رفع الملفات**
```bash
# رفع الملفات إلى GitHub
git branch -M main
git push -u origin main
```

**ملاحظة:** سيطلب منك إدخال:
- **Username**: اسم المستخدم في GitHub
- **Password**: Personal Access Token (ليس كلمة المرور العادية)

---

### **المرحلة 4: إنشاء Personal Access Token**

إذا طلب منك GitHub كلمة مرور، اتبع الخطوات:

#### **4.1 إنشاء Token**
1. اذهب إلى: https://github.com/settings/tokens
2. اضغط **"Generate new token"** → **"Generate new token (classic)"**
3. املأ البيانات:
   - **Note**: `Company Docs Manager`
   - **Expiration**: اختر مدة (90 days أو No expiration)
   - **Scopes**: ✅ حدد `repo` (Full control of private repositories)
4. اضغط **"Generate token"**
5. **انسخ Token** واحفظه (لن يظهر مرة أخرى!)

#### **4.2 استخدام Token**
عند رفع الملفات، استخدم:
- **Username**: اسم المستخدم
- **Password**: Personal Access Token (ليس كلمة المرور)

---

### **المرحلة 5: التحقق من الرفع**

1. اذهب إلى repository على GitHub
2. تحقق من وجود جميع الملفات
3. تحقق من أن `.env` **غير موجود** (يجب أن يكون في `.gitignore`)

---

## 🔐 الأمان والخصوصية

### **ملفات حساسة يجب عدم رفعها:**

✅ **مضمّنة في `.gitignore`:**
- `.env` - متغيرات البيئة
- `node_modules/` - المكتبات
- `.next/` - ملفات Next.js المبنية
- `dist/` - ملفات Backend المبنية
- `*.log` - ملفات السجلات

### **ملفات يجب رفعها:**

✅ **يجب رفعها:**
- `package.json` و `package-lock.json`
- `prisma/schema.prisma`
- `prisma/migrations/`
- جميع ملفات الكود (`.ts`, `.tsx`, `.js`, `.jsx`)
- `README.md`
- `.gitignore`
- `docker-compose.yml`
- `env.example.txt` (مثال للمتغيرات)

---

## 📝 إعدادات إضافية

### **1. إضافة ملف `.env.example`**

تأكد من وجود ملف `.env.example` في:
- `backend/env.example.txt` ✅ (موجود)
- `frontend/env.example.txt` ✅ (موجود)
- `env.example.txt` ✅ (موجود)

### **2. إضافة License (اختياري)**

```bash
# إنشاء ملف LICENSE
# يمكنك استخدام MIT License أو أي ترخيص آخر
```

### **3. إضافة CONTRIBUTING.md (اختياري)**

```bash
# ملف موجود بالفعل: CONTRIBUTING.md ✅
```

---

## 🔄 تحديث المشروع لاحقاً

### **عند إجراء تغييرات:**

```bash
# 1. عرض التغييرات
git status

# 2. إضافة الملفات المعدلة
git add .

# 3. إنشاء commit
git commit -m "وصف التغييرات"

# 4. رفع التغييرات
git push origin main
```

---

## 👥 مشاركة المشروع مع مبرمج آخر

### **الطريقة 1: إضافة Collaborator**

1. اذهب إلى repository على GitHub
2. اضغط **"Settings"** → **"Collaborators"**
3. اضغط **"Add people"**
4. أدخل **username** أو **email** للمبرمج
5. اختر **Role**: 
   - **Read** (قراءة فقط)
   - **Write** (قراءة وكتابة)
   - **Admin** (صلاحيات كاملة)
6. اضغط **"Add [username] to this repository"**

### **الطريقة 2: مشاركة الرابط**

ببساطة شارك رابط repository:
```
https://github.com/YOUR_USERNAME/YOUR_REPO_NAME
```

### **الطريقة 3: Fork (نسخ المشروع)**

المبرمج الآخر يمكنه:
1. فتح repository
2. الضغط على **"Fork"**
3. نسخ المشروع إلى حسابه

---

## 📥 للمبرمج الآخر: كيفية الحصول على المشروع

### **1. Clone المشروع**
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

### **2. إعداد البيئة**
```bash
# Backend
cd backend
cp env.example.txt .env
# عدّل .env بالقيم الصحيحة
npm install
npx prisma generate
npx prisma migrate dev

# Frontend
cd ../frontend
cp env.example.txt .env.local
# عدّل .env.local بالقيم الصحيحة
npm install
```

### **3. تشغيل المشروع**
```bash
# Backend (في terminal منفصل)
cd backend
npm run start:dev

# Frontend (في terminal منفصل)
cd frontend
npm run dev
```

---

## 🐛 حل المشاكل الشائعة

### **المشكلة 1: "fatal: not a git repository"**
```bash
# الحل: تهيئة Git
git init
```

### **المشكلة 2: "remote origin already exists"**
```bash
# الحل: إزالة origin القديم وإضافة جديد
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

### **المشكلة 3: "Permission denied"**
```bash
# الحل: استخدم Personal Access Token بدلاً من كلمة المرور
# أو تحقق من صلاحيات repository
```

### **المشكلة 4: "Large files"**
```bash
# إذا كان هناك ملفات كبيرة، استخدم Git LFS:
git lfs install
git lfs track "*.pdf"
git lfs track "*.zip"
git add .gitattributes
```

---

## ✅ Checklist قبل الرفع

- [ ] تأكد من عدم وجود `.env` في المشروع
- [ ] تأكد من وجود `.gitignore`
- [ ] تأكد من وجود `README.md`
- [ ] تأكد من وجود `env.example.txt`
- [ ] تأكد من عدم وجود ملفات حساسة
- [ ] تأكد من أن جميع الملفات المهمة موجودة
- [ ] اختبر المشروع محلياً قبل الرفع

---

## 📚 موارد إضافية

- **Git Documentation**: https://git-scm.com/doc
- **GitHub Guides**: https://guides.github.com
- **Git Cheat Sheet**: https://education.github.com/git-cheat-sheet-education.pdf

---

## 🎯 ملخص سريع

```bash
# 1. تهيئة Git
git init
git add .
git commit -m "Initial commit"

# 2. ربط بـ GitHub
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# 3. رفع الملفات
git push -u origin main
```

---

**جاهز للرفع! 🚀**

إذا واجهت أي مشكلة، أخبرني وسأساعدك! 😊

