# 🔗 شرح التكامل بين OnlyOffice والموقع

## 📊 كيف يعمل النظام

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Frontend  │ ──────> │   Backend    │ ──────> │  OnlyOffice │
│  (Next.js)  │         │   (NestJS)   │         │  Document   │
│             │         │              │         │   Server    │
└─────────────┘         └──────────────┘         └─────────────┘
      │                        │                         │
      │                        │                         │
      │ 1. طلب تحرير ملف       │                         │
      │───────────────────────>│                         │
      │                        │                         │
      │ 2. إعدادات المحرر       │                         │
      │<───────────────────────│                         │
      │                        │                         │
      │ 3. تحميل OnlyOffice    │                         │
      │    Script              │                         │
      │─────────────────────────────────────────────────>│
      │                        │                         │
      │ 4. فتح المحرر          │                         │
      │─────────────────────────────────────────────────>│
      │                        │                         │
      │ 5. تحميل الملف          │                         │
      │<─────────────────────────────────────────────────│
      │                        │                         │
      │                        │ 6. حفظ التعديلات       │
      │                        │<────────────────────────│
      │                        │                         │
      │                        │ 7. تحديث الملف          │
      │                        │    في MinIO             │
      │                        │                         │
      │ 8. إشعار النجاح        │                         │
      │<───────────────────────│                         │
```

---

## 🔧 الملفات المسؤولة عن التكامل

### 1️⃣ Backend - OnlyOffice Service
**الملف**: `backend/src/modules/onlyoffice/onlyoffice.service.ts`

**المسؤوليات**:
- ✅ إنشاء إعدادات المحرر (Editor Config)
- ✅ توليد JWT Token للتواصل مع OnlyOffice
- ✅ استقبال Callback من OnlyOffice عند الحفظ
- ✅ تحديث الملف في MinIO بعد الحفظ

**الدوال الرئيسية**:
```typescript
// إنشاء إعدادات المحرر
getEditorConfig(documentId, userId, userRole, mode)

// معالجة Callback من OnlyOffice
handleCallback(callbackData)

// التحقق من صلاحيات التحرير
checkEditPermission(document, userId, userRole)
```

### 2️⃣ Backend - OnlyOffice Controller
**الملف**: `backend/src/modules/onlyoffice/onlyoffice.controller.ts`

**المسؤوليات**:
- ✅ `/api/v1/onlyoffice/config/:documentId` - إرجاع إعدادات المحرر
- ✅ `/api/v1/onlyoffice/callback` - استقبال Callback من OnlyOffice

**المسارات**:
```typescript
GET  /api/v1/onlyoffice/config/:documentId?mode=edit
POST /api/v1/onlyoffice/callback
```

### 3️⃣ Frontend - OnlyOffice Editor Component
**الملف**: `frontend/components/documents/OnlyOfficeEditor.tsx`

**المسؤوليات**:
- ✅ تحميل OnlyOffice Script من Document Server
- ✅ طلب إعدادات المحرر من Backend
- ✅ تهيئة محرر OnlyOffice
- ✅ التعامل مع أحداث الحفظ والإغلاق

**الأحداث**:
- `onSave` - عند حفظ الملف
- `onClose` - عند إغلاق المحرر

### 4️⃣ Frontend - File Explorer Integration
**الملف**: `frontend/components/documents/FileExplorerEnhanced.tsx`

**المسؤوليات**:
- ✅ عرض زر "تحرير" بجانب الملفات المدعومة
- ✅ فتح محرر OnlyOffice عند الضغط على "تحرير"
- ✅ التحقق من صلاحيات المستخدم

**الدوال**:
```typescript
// فتح محرر OnlyOffice
handleEditDocument(document)

// التحقق من إمكانية التحرير
canEditDocument(document, userId, userRole)
```

### 5️⃣ Frontend - API Client
**الملف**: `frontend/lib/api.ts`

**المسؤوليات**:
- ✅ طلب إعدادات OnlyOffice من Backend

**الدالة**:
```typescript
getOnlyOfficeConfig(documentId, mode)
```

### 6️⃣ Frontend - File Utils
**الملف**: `frontend/lib/file-utils.ts`

**المسؤوليات**:
- ✅ التحقق من أنواع الملفات المدعومة
- ✅ التحقق من صلاحيات التحرير

**الدوال**:
```typescript
isOnlyOfficeSupported(mimeType)
canEditDocument(document, userId, userRole)
```

---

## 🔄 تدفق العمل (Flow)

### 1. المستخدم يضغط "تحرير"

```typescript
// FileExplorerEnhanced.tsx
handleEditDocument(document) {
  // التحقق من الصلاحيات
  if (!canEditDocument(document, userId, userRole)) {
    showToast('ليس لديك صلاحية للتحرير', 'error');
    return;
  }
  
  // فتح المحرر
  setEditingDocument(document);
}
```

### 2. تحميل OnlyOffice Script

```typescript
// OnlyOfficeEditor.tsx
loadOnlyOfficeScript() {
  const script = document.createElement('script');
  script.src = `${ONLYOFFICE_URL}/web-apps/apps/api/documents/api.js`;
  script.onload = initializeEditor;
  document.head.appendChild(script);
}
```

### 3. طلب إعدادات المحرر

```typescript
// OnlyOfficeEditor.tsx
loadEditorConfig() {
  const config = await apiClient.getOnlyOfficeConfig(documentId, mode);
  setConfig(config);
}
```

**الطلب**:
```
GET /api/v1/onlyoffice/config/{documentId}?mode=edit
Headers: Authorization: Bearer {token}
```

**الاستجابة**:
```json
{
  "success": true,
  "data": {
    "document": {
      "fileType": "docx",
      "key": "unique-document-key",
      "title": "document.docx",
      "url": "http://backend:5000/api/v1/documents/{id}/download"
    },
    "documentType": "word",
    "editorConfig": {
      "mode": "edit",
      "callbackUrl": "http://backend:5000/api/v1/onlyoffice/callback",
      "user": {
        "id": "user-id",
        "name": "User Name"
      }
    },
    "token": "jwt-token-for-onlyoffice"
  }
}
```

### 4. تهيئة المحرر

```typescript
// OnlyOfficeEditor.tsx
initializeEditor() {
  const editor = new DocsAPI.DocEditor(editorRef.current, {
    ...config.data,
    events: {
      onDocumentReady: () => setIsLoading(false),
      onDocumentStateChange: handleSave,
      onError: handleError,
    }
  });
  
  editorInstanceRef.current = editor;
}
```

### 5. المستخدم يحرر الملف

- المستخدم يعدل الملف في محرر OnlyOffice
- OnlyOffice يرسل Callback تلقائياً عند الحفظ

### 6. OnlyOffice يرسل Callback

**الطلب**:
```
POST http://backend:5000/api/v1/onlyoffice/callback
Content-Type: application/json

{
  "key": "unique-document-key",
  "status": 2,  // 2 = saved
  "url": "http://onlyoffice-server/download?file=...",
  "changesurl": "http://onlyoffice-server/changes?file=...",
  "history": {...},
  "users": [...],
  "actions": [...]
}
```

### 7. Backend يعالج Callback

```typescript
// onlyoffice.service.ts
async handleCallback(callbackData) {
  // التحقق من JWT Token
  const payload = this.verifyToken(callbackData.token);
  
  // إذا تم الحفظ
  if (callbackData.status === 2) {
    // تحميل الملف المحدث من OnlyOffice
    const updatedFile = await downloadFromOnlyOffice(callbackData.url);
    
    // حذف الملف القديم من MinIO
    await this.storageService.deleteFile(document.path);
    
    // رفع الملف الجديد إلى MinIO
    await this.minioClient.putObject(
      bucket,
      document.path,
      updatedFile,
      updatedFile.length
    );
    
    // تحديث معلومات الملف في قاعدة البيانات
    await this.documentsService.update(documentId, {
      size: updatedFile.length,
      updatedAt: new Date(),
    });
  }
  
  return { error: 0 };
}
```

### 8. إشعار المستخدم

```typescript
// OnlyOfficeEditor.tsx
handleSave(event) {
  if (event.data === 2) { // saved
    showToast('تم حفظ الملف بنجاح', 'success');
    onSave?.();
  }
}
```

---

## 🔐 الأمان (Security)

### 1. JWT Token

- ✅ Backend يولد JWT Token باستخدام `ONLYOFFICE_SECRET`
- ✅ OnlyOffice يتحقق من Token قبل معالجة الطلبات
- ✅ Callback يحتوي على Token للتحقق

### 2. الصلاحيات

- ✅ فقط المستخدمون المصرح لهم يمكنهم تحرير الملفات
- ✅ التحقق من الصلاحيات في `checkEditPermission()`

### 3. Callback URL

- ✅ Callback URL محمي بـ JWT Token
- ✅ OnlyOffice يرسل Token مع كل Callback

---

## 📝 متغيرات البيئة المطلوبة

### Backend (.env)
```env
# OnlyOffice Document Server URL
ONLYOFFICE_DOCUMENT_SERVER_URL=http://YOUR_SERVER_IP

# JWT Secret (يجب أن يكون نفس المفتاح في OnlyOffice)
ONLYOFFICE_SECRET=your-secret-key-32-chars-minimum

# Backend URL (لـ Callback)
BACKEND_URL=http://YOUR_SERVER_IP:5000
```

### Frontend (.env.local)
```env
# OnlyOffice Document Server URL
NEXT_PUBLIC_ONLYOFFICE_DOCUMENT_SERVER_URL=http://YOUR_SERVER_IP
```

### OnlyOffice (local.json)
```json
{
  "services": {
    "CoAuthoring": {
      "secret": {
        "inbox": { "string": "نفس_المفتاح" },
        "outbox": { "string": "نفس_المفتاح" },
        "browser": { "string": "نفس_المفتاح" }
      }
    }
  }
}
```

---

## 🐛 استكشاف الأخطاء

### المشكلة: المحرر لا يفتح

**التحقق**:
1. ✅ OnlyOffice Script يتم تحميله؟
2. ✅ Config يتم جلبه من Backend؟
3. ✅ JWT Token صحيح؟

**الحل**:
```bash
# فتح Console في المتصفح
# البحث عن أخطاء JavaScript
# التحقق من Network tab
```

### المشكلة: Callback لا يعمل

**التحقق**:
1. ✅ Callback URL صحيح؟
2. ✅ Backend يمكنه الوصول إلى OnlyOffice؟
3. ✅ JWT Secret متطابق؟

**الحل**:
```bash
# عرض سجلات Backend
docker compose logs backend

# اختبار Callback يدوياً
curl -X POST http://backend:5000/api/v1/onlyoffice/callback \
  -H "Content-Type: application/json" \
  -d '{"key":"test","status":2}'
```

### المشكلة: الملف لا يُحفظ

**التحقق**:
1. ✅ MinIO متاح؟
2. ✅ Backend لديه صلاحيات الكتابة في MinIO؟
3. ✅ Callback يتم استقباله؟

**الحل**:
```bash
# التحقق من MinIO
docker compose logs minio

# التحقق من Backend
docker compose logs backend | grep callback
```

---

## ✅ قائمة التحقق

- [ ] OnlyOffice Document Server مثبت ويعمل
- [ ] JWT Secret متطابق في Backend و OnlyOffice
- [ ] متغيرات البيئة محدثة في Backend
- [ ] متغيرات البيئة محدثة في Frontend
- [ ] المنافذ مفتوحة (80 للـ OnlyOffice)
- [ ] Backend يمكنه الوصول إلى OnlyOffice
- [ ] OnlyOffice يمكنه الوصول إلى Backend (Callback)
- [ ] MinIO متاح ويمكن الكتابة فيه
- [ ] الصلاحيات محددة بشكل صحيح

---

## 📚 المراجع

- [OnlyOffice API Documentation](https://api.onlyoffice.com/)
- [OnlyOffice Integration Guide](https://api.onlyoffice.com/editors/basic)
- [JWT Token Guide](https://api.onlyoffice.com/editors/callback)

