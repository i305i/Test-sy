# ⚡ دليل سريع لرفع المشروع على GitHub

## 🚀 خطوات سريعة (5 دقائق)

### **1. إنشاء Repository على GitHub**
```
1. اذهب إلى: https://github.com/new
2. Repository name: company-docs-manager
3. اختر Public أو Private
4. اضغط "Create repository"
```

### **2. رفع المشروع**
```bash
# افتح Terminal في مجلد المشروع
cd C:\Users\R\Desktop\sy

# تهيئة Git
git init
git add .
git commit -m "Initial commit: Company Docs Manager"

# ربط بـ GitHub (استبدل YOUR_USERNAME و YOUR_REPO)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# رفع الملفات
git branch -M main
git push -u origin main
```

### **3. إنشاء Personal Access Token (إذا طُلب)**
```
1. اذهب إلى: https://github.com/settings/tokens
2. Generate new token (classic)
3. حدد "repo" scope
4. انسخ Token واستخدمه كـ password
```

---

## ✅ تحقق قبل الرفع

- [ ] لا يوجد ملف `.env` في المشروع
- [ ] جميع الملفات المهمة موجودة
- [ ] `README.md` موجود

---

## 👥 مشاركة مع مبرمج آخر

### **الطريقة 1: إضافة Collaborator**
```
Settings → Collaborators → Add people
```

### **الطريقة 2: مشاركة الرابط**
```
https://github.com/YOUR_USERNAME/YOUR_REPO
```

---

## 📚 للمزيد من التفاصيل

راجع ملف `GITHUB_SETUP.md` للدليل الكامل.

---

**جاهز! 🎉**

