# 🔧 حل مشكلة معاينة الملفات (Proxy Solution)

## 🎯 المشكلة

الصور والملفات لا تظهر عند المعاينة بسبب:
1. **Content-Security-Policy (CSP)** من `helmet()` يمنع تحميل الصور من localhost:5000
2. **CORS** قد يسبب مشاكل في بعض المتصفحات
3. **Mixed Content** أو مشاكل في الـ origin

## ✅ الحل المُنفذ

### **1. Next.js API Routes كـ Proxy**

تم إنشاء proxy routes في Frontend لتحميل الملفات من نفس الـ origin:

```
Frontend (localhost:3000)
  ↓
/api/documents/stream/{token} (Next.js API Route)
  ↓
Backend (localhost:5000)
  ↓
MinIO
```

### **2. تحديث Backend CORS & CSP**

تم تخصيص `helmet()` في `backend/src/main.ts` للسماح بتحميل الصور والملفات.

### **3. تحديث ApiClient**

تم تحديث `getDocumentPreviewUrl()` و `getDocumentDownloadUrl()` لاستخدام proxy URLs.

---

## 📁 الملفات المُنشأة/المُحدّثة

### **Backend:**
```
✅ backend/src/main.ts
   - تخصيص helmet() CSP
   - تحسين CORS settings
```

### **Frontend:**
```
✅ frontend/app/api/documents/stream/[token]/route.ts (جديد)
✅ frontend/app/api/documents/download/[token]/route.ts (جديد)
✅ frontend/lib/api.ts (تحديث URLs)
✅ frontend/components/documents/DocumentPreviewModal.tsx (إزالة crossOrigin)
```

---

## 🔍 كيف يعمل النظام الآن؟

### **Before (Direct Backend URL):**
```
Frontend → http://localhost:5000/api/v1/documents/stream/{token}
❌ CSP blocks it
❌ CORS issues
```

### **After (Proxy):**
```
Frontend → /api/documents/stream/{token} (Next.js API Route)
  ↓
Next.js API Route → http://localhost:5000/api/v1/documents/stream/{token}
  ↓
Backend → MinIO
✅ Same origin (no CSP issues)
✅ No CORS issues
```

---

## 🚀 الاختبار

1. **افتح أي شركة → Documents**
2. **اضغط على أي ملف (صورة/PDF)**
3. **يجب أن تظهر المعاينة الآن! ✅**

---

## 🔐 الأمان

- ✅ **One-Time Tokens** لا تزال تعمل
- ✅ **Backend Proxy** لا يزال آمن
- ✅ **Next.js Proxy** يضيف طبقة أمان إضافية
- ✅ **No Direct MinIO Access** - كل شيء عبر Backend

---

## 📝 ملاحظات

- Proxy routes تستخدم `NEXT_PUBLIC_API_URL` من environment variables
- Default port: `5000` (يمكن تغييره في `.env.local`)
- جميع الملفات تمر عبر نفس الـ proxy mechanism

---

**النظام الآن يعمل بشكل صحيح! 🎉**

