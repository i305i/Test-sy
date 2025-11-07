# 🚀 رفع المشروع على GitHub - مشروع جديد (Public)

## 📋 الخطوات الكاملة:

### 1. إنشاء Repository جديد على GitHub:

1. اذهب إلى: https://github.com/new
2. أدخل:
   - **Repository name:** `systeam-sy` (أو أي اسم تريده)
   - **Description:** نظام إدارة الشركات والوثائق
   - **Public** ✅ (اختر Public)
   - **لا تضع** README, .gitignore, أو license (سنضيفها من المشروع)
3. اضغط **Create repository**

---

### 2. إعداد Git في المشروع:

```bash
# من مجلد المشروع
cd C:\Users\Admin\Desktop\Systym_ms

# تهيئة Git (إذا لم يكن موجوداً)
git init

# إضافة Remote
git remote add origin https://github.com/your-username/systeam-sy.git

# أو إذا كان لديك SSH:
# git remote add origin git@github.com:your-username/systeam-sy.git
```

---

### 3. التأكد من .gitignore:

تأكد من أن `.gitignore` موجود ويحتوي على:
- `node_modules/`
- `.env`
- `.env.local`
- `.next/`
- `dist/`
- وغيرها من الملفات الحساسة

---

### 4. إضافة الملفات:

```bash
# إضافة جميع الملفات
git add .

# التحقق من الملفات المضافة
git status
```

**⚠️ تأكد من أن ملفات `.env` و `.env.local` غير مضافين!**

---

### 5. عمل Commit:

```bash
git commit -m "Initial commit: نظام إدارة الشركات والوثائق"
```

---

### 6. رفع المشروع:

```bash
# رفع على Branch main
git branch -M main
git push -u origin main
```

---

## ✅ بعد الرفع:

افتح: `https://github.com/your-username/systeam-sy`

يجب أن ترى المشروع كاملاً! 🎉

---

## 📝 ملاحظات مهمة:

1. **لا ترفع ملفات `.env`** - تأكد من وجودها في `.gitignore`
2. **لا ترفع `node_modules`** - تأكد من وجودها في `.gitignore`
3. **لا ترفع `.next` أو `dist`** - هذه ملفات بناء
4. **ارفع ملفات `.example`** - مثل `env.production.example`

---

## 🔍 التحقق من .gitignore:

```bash
# تحقق من أن .gitignore موجود
cat .gitignore

# تحقق من الملفات التي سيتم رفعها
git status
```

---

## 🔄 إذا أردت تحديث المشروع لاحقاً:

```bash
git add .
git commit -m "Update: وصف التحديثات"
git push origin main
```

