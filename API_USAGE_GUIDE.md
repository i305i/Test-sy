# 📚 دليل استخدام API Client

## 🎯 نظرة عامة

جميع اتصالات API تتم عبر ملف واحد مركزي: `frontend/lib/api.ts`

---

## 🔧 الإعداد

### 1. ملف البيئة (اختياري)
```bash
# إنشاء .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

إذا لم تنشئ الملف، سيستخدم القيمة الافتراضية: `http://localhost:3001/api/v1`

---

## 📖 كيفية الاستخدام

### استيراد API Client
```typescript
import apiClient from '@/lib/api';
```

---

## 🔐 Authentication

### تسجيل الدخول
```typescript
try {
  const response = await apiClient.login('admin@example.com', 'password');
  console.log(response.access_token);
  console.log(response.user);
} catch (error) {
  console.error('Login failed:', error);
}
```

### الحصول على بيانات المستخدم الحالي
```typescript
const userData = await apiClient.me();
```

### تحديث Token
```typescript
const refreshToken = localStorage.getItem('refresh_token');
const response = await apiClient.refreshToken(refreshToken);
```

---

## 🏢 Companies

### الحصول على قائمة الشركات
```typescript
const companies = await apiClient.getCompanies({
  page: 1,
  limit: 10,
  search: 'شركة',
  status: 'READY',
});
```

### الحصول على شركة معينة
```typescript
const company = await apiClient.getCompany('company-id');
```

### إنشاء شركة جديدة
```typescript
const newCompany = await apiClient.createCompany({
  name: 'شركة التقنية',
  companyType: 'LLC',
  registrationNumber: 'CR-1001',
  description: 'وصف الشركة',
});
```

### تحديث شركة
```typescript
const updated = await apiClient.updateCompany('company-id', {
  name: 'اسم جديد',
  status: 'READY',
});
```

### حذف شركة
```typescript
await apiClient.deleteCompany('company-id');
```

---

## 📄 Documents

### الحصول على قائمة المستندات
```typescript
const documents = await apiClient.getDocuments({
  companyId: 'company-id',
  category: 'CONTRACT',
});
```

### رفع مستند
```typescript
const file = event.target.files[0];
const document = await apiClient.uploadDocument(file, {
  companyId: 'company-id',
  category: 'CONTRACT',
  description: 'عقد تأسيس',
});
```

### تحميل مستند
```typescript
const blob = await apiClient.downloadDocument('document-id');
// Create download link
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'document.pdf';
a.click();
```

### حذف مستند
```typescript
await apiClient.deleteDocument('document-id');
```

---

## 👥 Users

### الحصول على قائمة المستخدمين
```typescript
const users = await apiClient.getUsers({
  page: 1,
  limit: 20,
});
```

### إنشاء مستخدم جديد
```typescript
const user = await apiClient.createUser({
  email: 'user@example.com',
  password: 'Password@123',
  firstName: 'أحمد',
  lastName: 'محمد',
  role: 'EMPLOYEE',
});
```

### تحديث مستخدم
```typescript
await apiClient.updateUser('user-id', {
  role: 'SUPERVISOR',
});
```

---

## 🔗 Shares

### الحصول على المشاركات
```typescript
const shares = await apiClient.getShares({
  companyId: 'company-id',
});
```

### مشاركة شركة
```typescript
const share = await apiClient.createShare({
  companyId: 'company-id',
  userId: 'user-id',
  permissionLevel: 'EDIT',
});
```

### تحديث صلاحية المشاركة
```typescript
await apiClient.updateSharePermission('share-id', 'VIEW_ONLY');
```

---

## 🔔 Notifications

### الحصول على الإشعارات
```typescript
const notifications = await apiClient.getNotifications({
  limit: 20,
  unreadOnly: true,
});
```

### قراءة إشعار
```typescript
await apiClient.markNotificationAsRead('notification-id');
```

---

## 📊 Dashboard

### الحصول على إحصائيات Dashboard
```typescript
const stats = await apiClient.getDashboardStats();
console.log(stats.totalCompanies);
console.log(stats.readyCompanies);
```

### الحصول على البيانات الشهرية
```typescript
const monthlyData = await apiClient.getMonthlyData();
```

---

## 🎨 استخدام في المكونات

### مثال: Dashboard Page
```typescript
'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/api';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await apiClient.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Total Companies: {stats?.totalCompanies}</h1>
    </div>
  );
}
```

### مثال: Companies List
```typescript
'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/api';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const data = await apiClient.getCompanies({ page: 1, limit: 10 });
      setCompanies(data.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div>
      {companies.map(company => (
        <div key={company.id}>{company.name}</div>
      ))}
    </div>
  );
}
```

---

## 🔄 Interceptors

### Request Interceptor (تلقائي)
- يضيف `Authorization: Bearer TOKEN` تلقائياً لكل طلب
- يحصل على Token من `localStorage`

### Response Interceptor (تلقائي)
- إذا كان الـ response `401 Unauthorized`:
  - يحذف Tokens من localStorage
  - يوجه المستخدم لصفحة Login

---

## ⚠️ معالجة الأخطاء

### طريقة موحدة لمعالجة الأخطاء
```typescript
try {
  const data = await apiClient.getCompanies();
  setCompanies(data);
} catch (error: any) {
  // Axios error
  if (error.response) {
    console.error('Server Error:', error.response.data);
    console.error('Status:', error.response.status);
  } else if (error.request) {
    console.error('Network Error:', error.message);
  } else {
    console.error('Error:', error.message);
  }
}
```

---

## 🎯 Generic Methods

للطلبات المخصصة:

```typescript
// GET
const data = await apiClient.get('/custom/endpoint', { param: 'value' });

// POST
const result = await apiClient.post('/custom/endpoint', { data: 'value' });

// PATCH
const updated = await apiClient.patch('/custom/endpoint', { data: 'value' });

// DELETE
await apiClient.delete('/custom/endpoint');
```

---

## ✅ مميزات API Client

- ✅ **مركزي**: جميع API calls في مكان واحد
- ✅ **Type-safe**: مع TypeScript types
- ✅ **Auto Authorization**: يضيف Token تلقائياً
- ✅ **Error Handling**: معالجة موحدة للأخطاء
- ✅ **Auto Redirect**: توجيه تلقائي عند انتهاء الجلسة
- ✅ **Clean Code**: كود نظيف وسهل القراءة
- ✅ **Reusable**: قابل لإعادة الاستخدام

---

## 📝 ملاحظات مهمة

1. **لا تستخدم `fetch` مباشرة!** استخدم `apiClient` دائماً
2. **Token تلقائي:** لا حاجة لإضافة Authorization header يدوياً
3. **Error Handling:** استخدم try/catch دائماً
4. **Types:** استخدم Types من `@/types` للـ type safety

---

## 🔗 API Endpoints المتاحة

### Authentication
- `POST /auth/login`
- `POST /auth/register`
- `GET /auth/me`
- `POST /auth/refresh`
- `POST /auth/logout`

### Companies
- `GET /companies`
- `POST /companies`
- `GET /companies/:id`
- `PATCH /companies/:id`
- `DELETE /companies/:id`

### Documents
- `GET /documents`
- `POST /documents/upload`
- `GET /documents/:id`
- `GET /documents/:id/download`
- `PATCH /documents/:id`
- `DELETE /documents/:id`

### Users
- `GET /users`
- `POST /users`
- `GET /users/:id`
- `PATCH /users/:id`
- `DELETE /users/:id`

### Shares
- `GET /shares`
- `POST /shares`
- `PATCH /shares/:id/permission`
- `DELETE /shares/:id`

### Notifications
- `GET /notifications`
- `PATCH /notifications/:id/read`
- `DELETE /notifications/:id`

### Dashboard
- `GET /dashboard/stats`
- `GET /dashboard/monthly`

---

**✅ الآن جميع API calls منظمة ومركزية!**

