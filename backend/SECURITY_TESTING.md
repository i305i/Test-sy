# 🧪 اختبار نظام الأمان

## ✅ تم التنفيذ

1. ✅ تنصيب `@nestjs/schedule`
2. ✅ إضافة `DownloadToken` model
3. ✅ تشغيل migration
4. ✅ تحديث Prisma Client
5. ✅ إعادة هيكلة controller routes
6. ✅ تنفيذ One-Time Token System

---

## 🚀 كيفية الاختبار

### **1. تشغيل Backend**
```bash
cd backend
npm run start:dev
```

### **2. اختبار المعاينة (PREVIEW)**

#### A. إنشاء Token للمعاينة
```bash
curl -X POST http://localhost:3001/api/v1/documents/{documentId}/generate-token \
  -H "Authorization: Bearer {your_jwt_token}" \
  -H "Content-Type: application/json" \
  -d '{"purpose": "PREVIEW"}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "a3f2c1d9...",
    "url": "http://localhost:3001/api/v1/documents/stream/a3f2c1d9...",
    "expiresAt": "2025-11-07T08:45:00Z",
    "purpose": "PREVIEW",
    "expiresIn": "5 minutes"
  }
}
```

#### B. استخدام Token للمعاينة
```bash
# افتح الـ URL في المتصفح
http://localhost:3001/api/v1/documents/stream/{token}
```

**✅ يجب أن يعمل** (المعاينة تظهر)  
**❌ عند المحاولة الثانية:** "تم استخدام هذا الرابط مسبقاً"

---

### **3. اختبار التحميل (DOWNLOAD)**

#### A. إنشاء Token للتحميل
```bash
curl -X POST http://localhost:3001/api/v1/documents/{documentId}/generate-token \
  -H "Authorization: Bearer {your_jwt_token}" \
  -H "Content-Type: application/json" \
  -d '{"purpose": "DOWNLOAD"}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "b8e3d2c4...",
    "url": "http://localhost:3001/api/v1/documents/download/b8e3d2c4...",
    "expiresAt": "2025-11-07T08:42:00Z",
    "purpose": "DOWNLOAD",
    "expiresIn": "2 minutes"
  }
}
```

#### B. استخدام Token للتحميل
```bash
# افتح الـ URL في المتصفح أو استخدم wget
wget http://localhost:3001/api/v1/documents/download/{token} -O downloaded_file.pdf
```

**✅ يجب أن يبدأ التحميل**  
**❌ عند المحاولة الثانية:** "تم استخدام هذا الرابط مسبقاً"

---

## 🛡️ اختبارات الأمان

### **Test 1: One-Time Use**
```bash
# 1. إنشاء token
TOKEN_URL=$(curl -X POST ... | jq -r '.data.url')

# 2. الاستخدام الأول (✅ يجب أن يعمل)
curl $TOKEN_URL

# 3. الاستخدام الثاني (❌ يجب أن يفشل)
curl $TOKEN_URL
# Response: "تم استخدام هذا الرابط مسبقاً"
```

### **Test 2: Expiry**
```bash
# 1. إنشاء token
curl -X POST ... -d '{"purpose": "PREVIEW"}'

# 2. انتظر 6 دقائق (PREVIEW expires after 5 min)

# 3. حاول استخدام Token (❌ يجب أن يفشل)
curl http://localhost:3001/api/v1/documents/stream/{token}
# Response: "انتهت صلاحية هذا الرابط"
```

### **Test 3: Purpose Mismatch**
```bash
# 1. إنشاء PREVIEW token
curl -X POST ... -d '{"purpose": "PREVIEW"}'
# Get: /api/v1/documents/stream/{token}

# 2. حاول استخدامه للتحميل (❌ يجب أن يفشل)
curl http://localhost:3001/api/v1/documents/download/{token}
# Response: "هذا الرابط مخصص للمعاينة فقط"
```

### **Test 4: No Direct MinIO Access**
```bash
# حاول الوصول لـ MinIO مباشرة (❌ يجب أن يفشل)
curl http://localhost:9000/company-docs/companies/.../document.pdf
# Response: Access Denied (إذا MinIO محمي)
```

### **Test 5: Audit Logging**
```sql
-- تحقق من Audit Log
SELECT * FROM audit_logs 
WHERE action IN ('DOCUMENT_PREVIEWED', 'DOCUMENT_DOWNLOADED')
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 📊 API Endpoints Summary

| Endpoint | Method | Purpose | Auth | Use |
|----------|--------|---------|------|-----|
| `/companies/:id/documents` | POST | رفع ملف | JWT | Multiple |
| `/companies/:id/documents` | GET | قائمة الملفات | JWT | Multiple |
| `/companies/:id/documents/:id` | GET | تفاصيل ملف | JWT | Multiple |
| `/documents/:id/generate-token` | POST | إنشاء token | JWT | Multiple |
| `/documents/stream/:token` | GET | معاينة ملف | Token | **One-Time** |
| `/documents/download/:token` | GET | تحميل ملف | Token | **One-Time** |

---

## 🧹 Cleanup Cron Job

يتم تشغيل كل 30 دقيقة تلقائياً:

```typescript
// documents.cleanup.service.ts
@Cron(CronExpression.EVERY_30_MINUTES)
async cleanupExpiredTokens() {
  // حذف tokens منتهية أو مستخدمة > 24h
}
```

**للتشغيل يدوياً (للاختبار):**
```typescript
// في NestJS CLI
import { DocumentsCleanupService } from './modules/documents/documents.cleanup.service';
const service = app.get(DocumentsCleanupService);
await service.cleanupExpiredTokens();
```

---

## 🎯 Frontend Integration

```typescript
// DocumentPreviewModal.tsx
const loadPreview = async () => {
  // 1. طلب token
  const response = await fetch(`${API_URL}/documents/${documentId}/generate-token`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ purpose: 'PREVIEW' }),
  });
  
  const { data } = await response.json();
  
  // 2. استخدام URL الآمن
  setPreviewUrl(data.url); // One-Time URL
};

const handleDownload = async () => {
  // 1. طلب token
  const response = await fetch(`${API_URL}/documents/${documentId}/generate-token`, {
    method: 'POST',
    body: JSON.stringify({ purpose: 'DOWNLOAD' }),
  });
  
  const { data } = await response.json();
  
  // 2. فتح download URL
  window.open(data.url, '_blank'); // One-Time Download
};
```

---

## ⚠️ ملاحظات مهمة

### **1. لا تخزن Tokens**
```typescript
// ❌ خطأ
localStorage.setItem('previewToken', token);

// ✅ صحيح
// استخدم Token فوراً ثم تجاهله
```

### **2. الـ Tokens قصيرة العمر**
```
PREVIEW: 5 دقائق
DOWNLOAD: 2 دقيقة
```

### **3. تسجيل كل عملية**
```typescript
// كل preview/download يُسجل في audit_logs مع:
- userId
- documentId
- ipAddress
- userAgent
- timestamp
```

### **4. MinIO مخفي تماماً**
```
❌ المستخدم لا يرى: http://localhost:9000/...
✅ المستخدم يرى فقط: http://localhost:3001/api/v1/documents/stream/{token}
```

---

## 🏆 النتيجة

### **قبل:**
- ✅ Presigned URLs من MinIO (15 دقيقة)
- ❌ يمكن استخدامها عدة مرات
- ❌ يمكن مشاركتها
- ❌ روابط MinIO ظاهرة

### **بعد:**
- ✅ One-Time Tokens (2-5 دقائق)
- ✅ تُستخدم مرة واحدة فقط
- ✅ Token شخصي (مرتبط بـ user)
- ✅ MinIO مخفي تماماً (Proxy)
- ✅ Audit logging كامل
- ✅ IP tracking
- ✅ Auto-cleanup

---

**مستوى الأمان: ⭐⭐⭐⭐⭐ (Maximum Security)**

