# ✅ إعداد الروابط الخاصة بك

## 📋 الروابط الخاصة بك:

- **Frontend:** `https://remembered-accommodations-genuine-deutsch.trycloudflare.com`
- **Backend:** `https://seeds-spread-boots-maker.trycloudflare.com`

---

## ✅ الخطوات بالضبط:

### الخطوة 1: تحديث ملف `.env.local` في Frontend

#### الطريقة السهلة (استخدم السكريبت):

```powershell
cd C:\Users\Admin\Desktop\Systym_ms
.\update-frontend-for-tunnel.bat
```

عندما يُطلب منك الرابط، أدخل:
```
https://seeds-spread-boots-maker.trycloudflare.com
```

#### الطريقة اليدوية:

1. افتح الملف:
   ```
   C:\Users\Admin\Desktop\Systym_ms\frontend\.env.local
   ```

2. احذف كل المحتوى واكتب هذا:
   ```env
   NEXT_PUBLIC_API_URL=https://seeds-spread-boots-maker.trycloudflare.com/api/v1
   NEXT_PUBLIC_APP_NAME=نظام إدارة الشركات
   NEXT_PUBLIC_APP_VERSION=1.0.0
   ```

3. احفظ الملف

---

### الخطوة 2: إعادة تشغيل Frontend

```powershell
cd C:\Users\Admin\Desktop\Systym_ms\frontend
# أوقف Frontend (Ctrl+C في نافذة Frontend)
npm run dev
```

---

### الخطوة 3: افتح رابط Frontend في المتصفح

افتح هذا الرابط:
```
https://remembered-accommodations-genuine-deutsch.trycloudflare.com
```

---

## ✅ بعد الإعداد:

يجب أن يعمل الموقع بشكل كامل! 🎉

- ✅ Frontend متاح على: `https://remembered-accommodations-genuine-deutsch.trycloudflare.com`
- ✅ Backend متاح على: `https://seeds-spread-boots-maker.trycloudflare.com`
- ✅ Frontend يصل إلى Backend تلقائياً

---

## 📝 ملخص التعديلات:

| الملف | التعديل |
|-------|---------|
| `frontend\.env.local` | `NEXT_PUBLIC_API_URL=https://seeds-spread-boots-maker.trycloudflare.com/api/v1` |

**هذا كل شيء!** فقط ملف واحد تحتاج تعديله.

---

## ⚠️ ملاحظات مهمة:

1. **رابط Frontend** - لا تحتاج وضعه في أي مكان، فقط افتحه في المتصفح
2. **رابط Backend** - ضعه في `frontend\.env.local` فقط
3. **يجب إعادة تشغيل Frontend** بعد تحديث `.env.local`
4. **تأكد من أن Backend و Frontend يعملان محلياً** قبل فتح الروابط

---

## 🔍 التحقق:

بعد الإعداد:

1. ✅ افتح: `https://remembered-accommodations-genuine-deutsch.trycloudflare.com`
2. ✅ جرب تسجيل الدخول
3. ✅ إذا عمل، كل شيء صحيح! 🎉

