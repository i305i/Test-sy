# 🚀 تشغيل File Explorer - البداية السريعة

## ✅ **ما تم إنجازه:**

### 1. **قاعدة البيانات:**
- ✅ أضفنا `Folder` model في Prisma Schema
- ✅ علاقة هرمية للمجلدات (Parent/Children)
- ✅ ربط Documents بالمجلدات

### 2. **Backend (NestJS):**
- ✅ `FoldersService` - منطق إدارة المجلدات الكامل
- ✅ `FoldersController` - API endpoints للمجلدات
- ✅ دعم:
  - إنشاء مجلدات
  - التنقل بين المجلدات
  - بناء شجرة المجلدات (Tree View)
  - Breadcrumbs
  - نقل/إعادة تسمية/حذف
  - البحث

### 3. **Frontend (Next.js):**
- ✅ `FileExplorer` Component - واجهة مستخدم شبيهة بـ Windows Explorer
- ✅ المميزات:
  - 📁 عرض المجلدات والملفات
  - 🌳 Sidebar Tree View للتنقل السريع
  - 🍞 Breadcrumbs للمسار الحالي
  - 🔄 Grid View & List View
  - 🔍 البحث
  - ➕ إنشاء مجلدات
  - ⬆️ رفع ملفات
  - 📥 تحميل
  - 🗑️ حذف
  - 🎨 Dark Mode

### 4. **API Client:**
- ✅ جميع الدوال المطلوبة للتعامل مع Folders

---

## 📋 **خطوات التطبيق:**

### **الخطوة 1: تحديث قاعدة البيانات**

```bash
cd backend

# إضافة Folder model إلى prisma/schema.prisma
# (الكود موجود في FILE_EXPLORER_SYSTEM.md)

# تطبيق التغييرات
npx prisma migrate dev --name add-folders

# إعادة إنشاء Prisma Client
npx prisma generate
```

---

### **الخطوة 2: إنشاء Folders Module في Backend**

```bash
cd backend/src/modules

# إنشاء المجلد
mkdir folders
cd folders

# إنشاء الملفات
touch folders.module.ts
touch folders.service.ts
touch folders.controller.ts
```

**انسخ الكود من `FILE_EXPLORER_SYSTEM.md`** إلى:
- `folders.service.ts`
- `folders.controller.ts`

**ثم أنشئ `folders.module.ts`:**

```typescript
import { Module } from '@nestjs/common';
import { FoldersController } from './folders.controller';
import { FoldersService } from './folders.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [FoldersController],
  providers: [FoldersService],
  exports: [FoldersService],
})
export class FoldersModule {}
```

---

### **الخطوة 3: تسجيل Module في AppModule**

في `backend/src/app.module.ts`:

```typescript
import { FoldersModule } from './modules/folders/folders.module';

@Module({
  imports: [
    // ... existing modules
    FoldersModule,
  ],
  // ...
})
export class AppModule {}
```

---

### **الخطوة 4: Frontend - تم بالفعل! ✅**

- ✅ `FileExplorer.tsx` تم إنشاؤه في `frontend/components/documents/`
- ✅ تم إضافته إلى `index.ts`
- ✅ تم إضافة الدوال المطلوبة في `api.ts`
- ✅ تم تطبيقه في صفحة تفاصيل الشركة `companies/[id]/page.tsx`

---

### **الخطوة 5: تشغيل المشروع**

```bash
# Backend
cd backend
npm run start:dev

# Frontend (في terminal آخر)
cd frontend
npm run dev
```

---

## 🎯 **كيفية الاستخدام:**

### **1. افتح صفحة تفاصيل شركة:**
```
http://localhost:3000/companies/{company-id}
```

### **2. انتقل إلى تاب "المستندات" (📄):**
- ستشاهد واجهة File Explorer الكاملة!

### **3. العمليات المتاحة:**

#### **إنشاء مجلد:**
1. اضغط على زر "مجلد جديد"
2. أدخل اسم المجلد
3. اضغط "إنشاء"

#### **رفع ملف:**
1. اضغط على زر "رفع ملف"
2. اختر الملف
3. املأ البيانات المطلوبة

#### **التنقل:**
- **Double Click** على المجلد للدخول إليه
- استخدم **Breadcrumbs** في الأعلى للرجوع
- استخدم **Sidebar** للتنقل السريع بين المجلدات

#### **عرض الملفات:**
- **Grid View** (شبكة): عرض بطاقات
- **List View** (قائمة): عرض جدول تفصيلي

#### **تحميل ملف:**
- **Double Click** على الملف لفتحه
- أو اضغط على أيقونة التحميل (📥) في List View

#### **حذف:**
- اضغط على أيقونة الحذف (🗑️)

---

## 🔧 **التخصيص:**

### **تغيير الألوان:**
في `FileExplorer.tsx`, عدّل الـ Tailwind classes:

```typescript
// من:
className="bg-blue-600 hover:bg-blue-700"

// إلى:
className="bg-purple-600 hover:bg-purple-700"
```

### **إضافة أنواع ملفات جديدة:**

في دالة `getFileIcon()`:

```typescript
const getFileIcon = (mimeType: string): string => {
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('word')) return '📝';
  if (mimeType.includes('excel')) return '📊';
  if (mimeType.includes('powerpoint')) return '📽️'; // جديد
  if (mimeType.includes('zip')) return '📦'; // جديد
  return '📎';
};
```

### **تغيير الحد الأقصى لحجم الملف:**

في `backend/src/modules/storage/storage.service.ts`:

```typescript
// من:
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// إلى:
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
```

---

## 📊 **الهيكل النهائي:**

```
📁 companies/{company-id}/
├── 📁 commercial-registration/
│   ├── 📄 السجل_التجاري_2024.pdf
│   └── 📄 تجديد_السجل.pdf
├── 📁 tax-documents/
│   ├── 📄 الشهادة_الضريبية.pdf
│   └── 📁 2024/
│       └── 📄 فاتورة_يناير.pdf
└── 📁 contracts/
    ├── 📄 عقد_تأسيس.pdf
    └── 📄 عقد_شراكة.pdf
```

---

## 🎉 **النتيجة:**

### **قبل:**
```
قريباً: قائمة المستندات
```

### **بعد:**
```
📁 مستكشف ملفات كامل مثل Windows Explorer!
├── Sidebar Tree View
├── Grid & List Views
├── Breadcrumbs
├── Upload & Download
├── Search
└── Dark Mode
```

---

## 🚨 **ملاحظات مهمة:**

1. **الصلاحيات:**
   - تأكد من إضافة Permission Checks في Backend
   - راجع `checkAccess()` في `FoldersService`

2. **MinIO Integration:**
   - عند حذف مجلد، احذف جميع الملفات من MinIO
   - راجع `MINIO_UPLOAD_SYSTEM.md` للتفاصيل

3. **الأداء:**
   - مع المجلدات الكبيرة، استخدم Pagination
   - استخدم Virtual Scrolling للقوائم الطويلة

4. **التخزين:**
   - المجلدات في قاعدة البيانات
   - الملفات الفعلية في MinIO

---

## 📞 **الدعم:**

إذا واجهت أي مشاكل:
1. تحقق من Console في المتصفح
2. تحقق من logs في Backend
3. تأكد من تشغيل Backend و MinIO

**🎯 المشروع الآن أصبح لديه File Explorer احترافي 100%!**

