# 🌐 إعداد Frontend و Backend معاً عبر Tunnel

## ✅ نعم، سيعمل الموقع!

لكن تحتاج تعديل إعدادات Frontend ليشير إلى رابط Backend الخارجي.

---

## 📝 الخطوات الكاملة:

### 1. شغّل Backend و Frontend محلياً:

```powershell
# نافذة 1: Backend
cd C:\Users\Admin\Desktop\Systym_ms\backend
npm run start:dev

# نافذة 2: Frontend
cd C:\Users\Admin\Desktop\Systym_ms\frontend
npm run dev
```

### 2. افتح Tunnel للـ Backend:

```powershell
# نافذة 3: Backend Tunnel
cd C:\Users\Admin\Desktop\Systym_ms
.\start-localtunnel-backend.bat
```

**انسخ رابط Backend** (مثلاً: `https://xyz456.loca.lt`)

### 3. افتح Tunnel للـ Frontend:

```powershell
# نافذة 4: Frontend Tunnel
cd C:\Users\Admin\Desktop\Systym_ms
.\start-localtunnel-frontend.bat
```

**انسخ رابط Frontend** (مثلاً: `https://abc123.loca.lt`)

### 4. تحديث إعدادات Frontend:

افتح `frontend\.env.local` وعدّل:

```env
NEXT_PUBLIC_API_URL=https://xyz456.loca.lt/api/v1
NEXT_PUBLIC_APP_NAME=نظام إدارة الشركات
NEXT_PUBLIC_APP_VERSION=1.0.0
```

**⚠️ مهم:** استبدل `https://xyz456.loca.lt` برابط Backend الفعلي من Tunnel.

### 5. إعادة تشغيل Frontend:

```powershell
# أوقف Frontend (Ctrl+C)
cd C:\Users\Admin\Desktop\Systym_ms\frontend
npm run dev
```

---

## ✅ بعد الإعداد:

افتح رابط Frontend (مثلاً: `https://abc123.loca.lt`)

يجب أن يعمل الموقع بشكل كامل! 🎉

---

## 🔄 تحديث تلقائي للإعدادات:

سأنشئ سكريبت يقوم بتحديث `.env.local` تلقائياً:

```powershell
.\update-frontend-for-tunnel.bat
```

---

## ⚠️ ملاحظات مهمة:

1. **رابط Backend يتغير** في كل مرة تشغّل Tunnel (مع localtunnel المجاني)
2. **يجب تحديث `.env.local`** في كل مرة تحصل على رابط جديد
3. **أعد تشغيل Frontend** بعد تحديث `.env.local`

---

## 💡 حل أفضل: استخدام subdomain ثابت

إذا كان لديك ngrok Pro أو Cloudflare Tunnel Pro، يمكنك استخدام subdomain ثابت:

```yaml
# ngrok Pro
tunnels:
  frontend:
    addr: 3000
    proto: http
    subdomain: myapp-frontend
  backend:
    addr: 5000
    proto: http
    subdomain: myapp-backend
```

ثم Frontend يشير إلى: `https://myapp-backend.ngrok.io/api/v1`

---

## ✅ الخلاصة:

**نعم، سيعمل الموقع!** لكن تحتاج:
1. ✅ فتح Tunnel للـ Backend
2. ✅ فتح Tunnel للـ Frontend
3. ✅ تحديث `NEXT_PUBLIC_API_URL` في Frontend
4. ✅ إعادة تشغيل Frontend

