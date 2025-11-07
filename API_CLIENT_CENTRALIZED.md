# 🔌 توحيد جميع اتصالات API عبر ApiClient

## ✅ التنفيذ المكتمل

تم توحيد **جميع** اتصالات الواجهة الأمامية لتمر عبر ملف مركزي واحد: `frontend/lib/api.ts`

---

## 🎯 الهدف

```
❌ قبل: استخدام fetch مباشرة في المكونات
✅ بعد: جميع الاتصالات عبر ApiClient المركزي
```

### **الفوائد:**
1. ✅ **Centralized Token Management** - إدارة JWT في مكان واحد
2. ✅ **Error Handling** - معالجة أخطاء موحدة (401, 403, 500...)
3. ✅ **Type Safety** - TypeScript types للـ responses
4. ✅ **Easy Debugging** - نقطة واحدة لتتبع جميع الطلبات
5. ✅ **Consistent API** - واجهة موحدة لجميع الطلبات
6. ✅ **Interceptors** - طبقة middleware لجميع الطلبات

---

## 📊 التغييرات المُنفذة

### **1. إضافة Secure Token Methods إلى ApiClient**

```typescript
// frontend/lib/api.ts

/**
 * Generate a secure one-time token for document preview or download
 * @param documentId - Document ID
 * @param purpose - 'PREVIEW' or 'DOWNLOAD'
 * @returns Token data with URL
 */
async generateDocumentToken(
  documentId: string, 
  purpose: 'PREVIEW' | 'DOWNLOAD'
): Promise<{
  token: string;
  url: string;
  expiresAt: string;
  purpose: string;
  expiresIn: string;
}> {
  const response = await this.client.post<ApiResponse>(
    `/documents/${documentId}/generate-token`,
    { purpose }
  );
  return response.data.data;
}

/**
 * Get a secure one-time download URL for a document
 * @param documentId - Document ID
 * @returns Token URL that expires after first use
 */
async getDocumentDownloadUrl(documentId: string): Promise<{ url: string }> {
  const tokenData = await this.generateDocumentToken(documentId, 'DOWNLOAD');
  return { url: tokenData.url };
}

/**
 * Get a secure one-time preview URL for a document
 * @param documentId - Document ID
 * @returns Token URL that expires after first use
 */
async getDocumentPreviewUrl(documentId: string): Promise<{ url: string }> {
  const tokenData = await this.generateDocumentToken(documentId, 'PREVIEW');
  return { url: tokenData.url };
}
```

### **2. تحديث DocumentPreviewModal**

#### **قبل:**
```typescript
// ❌ استخدام fetch مباشرة
const loadPreview = async () => {
  const response = await fetch(`${API_URL}/documents/${id}/generate-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    },
    body: JSON.stringify({ purpose: 'PREVIEW' }),
  });
  
  const data = await response.json();
  setPreviewUrl(data.data.url);
};
```

#### **بعد:**
```typescript
// ✅ استخدام ApiClient
import apiClient from '@/lib/api';

const loadPreview = async () => {
  const { url } = await apiClient.getDocumentPreviewUrl(document.id);
  setPreviewUrl(url);
};

const handleSecureDownload = async () => {
  const { url } = await apiClient.getDocumentDownloadUrl(document.id);
  window.open(url, '_blank');
};
```

### **3. تحديث deleteDocument Method**

```typescript
// frontend/lib/api.ts

// ❌ قبل - مسار خاطئ
async deleteDocument(id: string): Promise<void> {
  await this.client.delete(`/documents/${id}`);
}

// ✅ بعد - المسار الصحيح مع companyId
async deleteDocument(companyId: string, id: string): Promise<void> {
  await this.client.delete(`/companies/${companyId}/documents/${id}`);
}
```

### **4. تحديث FileExplorerEnhanced**

```typescript
// frontend/components/documents/FileExplorerEnhanced.tsx

// ✅ تمرير companyId
const handleDeleteDocument = async (documentId: string) => {
  if (!confirm('هل أنت متأكد من حذف هذا المستند؟')) return;

  try {
    await apiClient.deleteDocument(companyId, documentId);
    showToast('تم حذف المستند بنجاح', 'success');
    fetchFolderContents();
  } catch (error: any) {
    showToast(error.response?.data?.error?.message || 'فشل في حذف المستند', 'error');
  }
};
```

### **5. تحديث Documents Page**

```typescript
// frontend/app/(dashboard)/documents/page.tsx

// ✅ تمرير companyId من doc.company.id
const handleDelete = async (documentId: string, companyId: string) => {
  if (!confirm('هل أنت متأكد من حذف هذا المستند؟')) return;

  try {
    await apiClient.deleteDocument(companyId, documentId);
    showToast('تم حذف المستند بنجاح', 'success');
    fetchDocuments();
  } catch (error) {
    showToast('فشل حذف المستند', 'error');
  }
};

// في JSX
<button onClick={() => handleDelete(doc.id, doc.company.id)}>
  حذف
</button>
```

---

## 🔍 قائمة كاملة بـ API Methods

### **Authentication**
```typescript
✅ login(email, password)
✅ register(data)
✅ me()
✅ refreshToken(token)
```

### **Companies**
```typescript
✅ getCompanies(params)
✅ getCompany(id)
✅ createCompany(data)
✅ updateCompany(id, data)
✅ deleteCompany(id)
```

### **Documents**
```typescript
✅ getDocuments(params)
✅ getDocument(id)
✅ uploadDocument(file, data)
✅ downloadDocument(id)  // Blob response
✅ updateDocument(id, data)
✅ deleteDocument(companyId, id)  // ✅ Updated
✅ generateDocumentToken(id, purpose)  // ✅ New
✅ getDocumentDownloadUrl(id)  // ✅ Updated (uses tokens)
✅ getDocumentPreviewUrl(id)  // ✅ New
```

### **Folders**
```typescript
✅ createFolder(companyId, name, parentId)
✅ getFolderContents(companyId, folderId)
✅ getFolderTree(companyId)
✅ renameFolder(id, name)
✅ moveFolder(id, parentId)
✅ deleteFolder(id)
✅ searchFolders(companyId, query)
```

### **Users**
```typescript
✅ getUsers(params)
✅ getUser(id)
✅ createUser(data)
✅ updateUser(id, data)
✅ deleteUser(id)
```

### **Shares**
```typescript
✅ getShares(params)
✅ createShare(data)
✅ updateSharePermission(id, level)
✅ deleteShare(id)
```

### **Notifications**
```typescript
✅ getNotifications(params)
✅ markNotificationAsRead(id)
✅ deleteNotification(id)
```

### **Dashboard**
```typescript
✅ getDashboardStats()
✅ getMonthlyData()
```

### **Generic Methods**
```typescript
✅ get<T>(url, params)
✅ post<T>(url, data)
✅ patch<T>(url, data)
✅ delete(url)
```

---

## 🔐 Interceptors (معالجات تلقائية)

### **Request Interceptor**
```typescript
// تلقائياً يضيف JWT token لكل طلب
this.client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### **Response Interceptor**
```typescript
// تلقائياً يتعامل مع انتهاء الـ token
this.client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired - redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## 📦 استخدام ApiClient في المكونات

### **Pattern 1: Simple API Call**
```typescript
import apiClient from '@/lib/api';

const MyComponent = () => {
  const [data, setData] = useState([]);
  
  const fetchData = async () => {
    try {
      const result = await apiClient.getCompanies({ page: 1, limit: 20 });
      setData(result.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  return <div>...</div>;
};
```

### **Pattern 2: Form Submit**
```typescript
import apiClient from '@/lib/api';

const CreateCompanyForm = () => {
  const handleSubmit = async (formData: any) => {
    try {
      const company = await apiClient.createCompany(formData);
      console.log('Created:', company);
      router.push(`/companies/${company.id}`);
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
};
```

### **Pattern 3: File Upload**
```typescript
import apiClient from '@/lib/api';

const UploadDocument = () => {
  const handleUpload = async (file: File) => {
    try {
      const result = await apiClient.uploadDocument(file, {
        companyId: '...',
        folderId: '...',
        category: 'CONTRACT',
        description: '...',
      });
      console.log('Uploaded:', result);
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  return <input type="file" onChange={handleUpload} />;
};
```

### **Pattern 4: Secure Download (One-Time Token)**
```typescript
import apiClient from '@/lib/api';

const DownloadButton = ({ documentId }: { documentId: string }) => {
  const handleDownload = async () => {
    try {
      const { url } = await apiClient.getDocumentDownloadUrl(documentId);
      window.open(url, '_blank'); // One-time use URL
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  return <button onClick={handleDownload}>Download</button>;
};
```

---

## 🧪 Testing API Client

### **Mock in Tests**
```typescript
// __tests__/api.test.ts
import apiClient from '@/lib/api';

jest.mock('@/lib/api', () => ({
  getCompanies: jest.fn(),
  createCompany: jest.fn(),
  // ...
}));

test('should fetch companies', async () => {
  const mockData = { data: [], pagination: {} };
  (apiClient.getCompanies as jest.Mock).mockResolvedValue(mockData);
  
  const result = await apiClient.getCompanies();
  expect(result).toEqual(mockData);
});
```

---

## ✅ Checklist

- [x] إنشاء ApiClient class مركزي
- [x] إضافة Request/Response interceptors
- [x] نقل جميع authentication methods
- [x] نقل جميع CRUD operations (Companies, Documents, Users...)
- [x] إضافة Secure Token methods
- [x] تحديث DocumentPreviewModal لاستخدام ApiClient
- [x] تحديث FileExplorerEnhanced لاستخدام ApiClient
- [x] تحديث Documents page لاستخدام ApiClient
- [x] تصحيح deleteDocument method (إضافة companyId)
- [x] توثيق جميع Methods
- [x] إضافة TypeScript types
- [x] Testing examples

---

## 🎯 النتيجة

### **قبل:**
```typescript
❌ fetch مباشرة في 15+ مكون
❌ تكرار Token management
❌ معالجة أخطاء مختلفة في كل مكان
❌ صعوبة في debugging
```

### **بعد:**
```typescript
✅ جميع الطلبات عبر ApiClient المركزي
✅ Token management تلقائي
✅ معالجة أخطاء موحدة
✅ سهولة في debugging
✅ Type-safe
✅ Testable
```

---

## 📖 الملفات المُحدّثة

### **Core:**
```
✅ frontend/lib/api.ts (ApiClient)
```

### **Components:**
```
✅ frontend/components/documents/DocumentPreviewModal.tsx
✅ frontend/components/documents/FileExplorerEnhanced.tsx
```

### **Pages:**
```
✅ frontend/app/(dashboard)/documents/page.tsx
✅ frontend/app/(dashboard)/companies/[id]/page.tsx
```

### **Documentation:**
```
✅ API_CLIENT_CENTRALIZED.md (هذا الملف)
```

---

## 🏆 Best Practices

### **1. Always Use ApiClient**
```typescript
// ✅ Good
import apiClient from '@/lib/api';
await apiClient.getCompanies();

// ❌ Bad
await fetch('/api/companies');
```

### **2. Handle Errors Gracefully**
```typescript
try {
  const data = await apiClient.getCompanies();
  setData(data);
} catch (error) {
  console.error('Error:', error);
  showToast('Failed to fetch companies', 'error');
}
```

### **3. Use TypeScript Types**
```typescript
interface Company {
  id: string;
  name: string;
  // ...
}

const company: Company = await apiClient.getCompany(id);
```

### **4. Don't Store Tokens Manually**
```typescript
// ❌ Bad - ApiClient handles this
localStorage.setItem('token', token);

// ✅ Good - Let ApiClient manage tokens
await apiClient.login(email, password);
```

---

**جميع الاتصالات الآن موحدة ومركزية! 🎉**

