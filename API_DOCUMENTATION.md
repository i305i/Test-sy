# 🔌 توثيق الـ API (API Documentation)

## نظرة عامة

RESTful API مبني على معايير REST مع دعم JSON.

**Base URL**: `https://api.companydocs.com/v1`

## 🔐 المصادقة (Authentication)

### نظام JWT (JSON Web Tokens)

```
Authorization: Bearer <access_token>
```

### 1. تسجيل الدخول

**POST** `/auth/login`

```json
Request:
{
  "email": "user@example.com",
  "password": "password123"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "first_name": "أحمد",
      "last_name": "محمد",
      "role": "employee",
      "avatar_url": null
    },
    "tokens": {
      "access_token": "eyJhbGc...",
      "refresh_token": "eyJhbGc...",
      "expires_in": 900
    }
  }
}
```

### 2. تحديث الـ Token

**POST** `/auth/refresh`

```json
Request:
{
  "refresh_token": "eyJhbGc..."
}

Response: 200 OK
{
  "success": true,
  "data": {
    "access_token": "eyJhbGc...",
    "expires_in": 900
  }
}
```

### 3. تسجيل الخروج

**POST** `/auth/logout`

```json
Request:
{
  "refresh_token": "eyJhbGc..."
}

Response: 200 OK
{
  "success": true,
  "message": "تم تسجيل الخروج بنجاح"
}
```

### 4. تسجيل مستخدم جديد

**POST** `/auth/register` (Admin only)

```json
Request:
{
  "email": "newuser@example.com",
  "password": "password123",
  "first_name": "خالد",
  "last_name": "أحمد",
  "role": "employee",
  "phone": "+966501234567"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "newuser@example.com",
      "first_name": "خالد",
      "last_name": "أحمد",
      "role": "employee"
    }
  }
}
```

### 5. نسيت كلمة المرور

**POST** `/auth/forgot-password`

```json
Request:
{
  "email": "user@example.com"
}

Response: 200 OK
{
  "success": true,
  "message": "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني"
}
```

### 6. إعادة تعيين كلمة المرور

**POST** `/auth/reset-password`

```json
Request:
{
  "token": "reset_token_from_email",
  "password": "new_password123"
}

Response: 200 OK
{
  "success": true,
  "message": "تم تغيير كلمة المرور بنجاح"
}
```

## 👥 إدارة المستخدمين (Users)

### 1. الحصول على المستخدم الحالي

**GET** `/users/me`

```json
Response: 200 OK
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "أحمد",
    "last_name": "محمد",
    "phone": "+966501234567",
    "role": "employee",
    "status": "active",
    "avatar_url": "https://...",
    "email_verified": true,
    "two_factor_enabled": false,
    "created_at": "2025-01-15T10:30:00Z",
    "last_login_at": "2025-11-06T14:20:00Z"
  }
}
```

### 2. الحصول على جميع المستخدمين

**GET** `/users` (Admin/Supervisor only)

Query Parameters:
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `role` (filter by role)
- `status` (filter by status)
- `search` (search in name/email)
- `sort` (default: created_at)
- `order` (asc/desc, default: desc)

```json
Response: 200 OK
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "email": "user@example.com",
        "first_name": "أحمد",
        "last_name": "محمد",
        "role": "employee",
        "status": "active",
        "avatar_url": null,
        "created_at": "2025-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "total_pages": 3
    }
  }
}
```

### 3. الحصول على مستخدم محدد

**GET** `/users/:id` (Admin/Supervisor only)

```json
Response: 200 OK
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "أحمد",
    "last_name": "محمد",
    "phone": "+966501234567",
    "role": "employee",
    "status": "active",
    "statistics": {
      "companies_owned": 15,
      "documents_uploaded": 120,
      "companies_shared": 5
    },
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

### 4. تحديث المستخدم

**PATCH** `/users/:id` (Admin or self)

```json
Request:
{
  "first_name": "أحمد",
  "last_name": "علي",
  "phone": "+966501234567",
  "avatar_url": "https://..."
}

Response: 200 OK
{
  "success": true,
  "data": {
    "user": { /* updated user object */ }
  }
}
```

### 5. تحديث دور المستخدم

**PATCH** `/users/:id/role` (Admin only)

```json
Request:
{
  "role": "supervisor"
}

Response: 200 OK
{
  "success": true,
  "message": "تم تحديث دور المستخدم بنجاح"
}
```

### 6. تعطيل/تفعيل المستخدم

**PATCH** `/users/:id/status` (Admin only)

```json
Request:
{
  "status": "inactive"
}

Response: 200 OK
{
  "success": true,
  "message": "تم تحديث حالة المستخدم بنجاح"
}
```

### 7. حذف المستخدم

**DELETE** `/users/:id` (Admin only)

```json
Response: 200 OK
{
  "success": true,
  "message": "تم حذف المستخدم بنجاح"
}
```

## 🏢 إدارة الشركات (Companies)

### 1. الحصول على جميع الشركات

**GET** `/companies`

Query Parameters:
- `page` (default: 1)
- `limit` (default: 20)
- `status` (ready, in_progress, on_hold, archived)
- `search` (search in name, CR, tax number)
- `owner_id` (filter by owner)
- `completion_min` (minimum completion %)
- `completion_max` (maximum completion %)
- `sort` (name, created_at, updated_at, completion_percentage)
- `order` (asc/desc)

```json
Response: 200 OK
{
  "success": true,
  "data": {
    "companies": [
      {
        "id": "uuid",
        "name": "شركة الأمل للتجارة",
        "commercial_registration": "1234567890",
        "status": "ready",
        "completion_percentage": 100,
        "owner": {
          "id": "uuid",
          "first_name": "أحمد",
          "last_name": "محمد"
        },
        "total_documents": 25,
        "approved_documents": 25,
        "created_at": "2025-01-15T10:30:00Z",
        "updated_at": "2025-11-06T14:20:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "total_pages": 8
    }
  }
}
```

### 2. إنشاء شركة جديدة

**POST** `/companies`

```json
Request:
{
  "name": "شركة النور للتجارة",
  "name_arabic": "شركة النور للتجارة",
  "description": "شركة متخصصة في التجارة العامة",
  "company_type": "llc",
  "commercial_registration": "1234567890",
  "tax_number": "300123456789003",
  "establishment_date": "2020-01-15",
  "country": "السعودية",
  "city": "الرياض",
  "district": "العليا",
  "street": "شارع الملك فهد",
  "building_number": "1234",
  "postal_code": "12345",
  "primary_email": "info@alnoor.com",
  "primary_phone": "+966112345678",
  "website": "https://www.alnoor.com",
  "tags": ["تجارة", "عامة"],
  "custom_fields": {
    "capital": "1000000",
    "partners_count": 3
  }
}

Response: 201 Created
{
  "success": true,
  "data": {
    "company": {
      "id": "uuid",
      "name": "شركة النور للتجارة",
      "commercial_registration": "1234567890",
      "status": "in_progress",
      "completion_percentage": 0,
      "owner_id": "uuid",
      "created_at": "2025-11-06T14:30:00Z"
    }
  }
}
```

### 3. الحصول على شركة محددة

**GET** `/companies/:id`

```json
Response: 200 OK
{
  "success": true,
  "data": {
    "company": {
      "id": "uuid",
      "name": "شركة النور للتجارة",
      "name_arabic": "شركة النور للتجارة",
      "description": "شركة متخصصة في التجارة العامة",
      "company_type": "llc",
      "commercial_registration": "1234567890",
      "tax_number": "300123456789003",
      "establishment_date": "2020-01-15",
      "address": {
        "country": "السعودية",
        "city": "الرياض",
        "district": "العليا",
        "street": "شارع الملك فهد",
        "building_number": "1234",
        "postal_code": "12345"
      },
      "contact": {
        "primary_email": "info@alnoor.com",
        "primary_phone": "+966112345678",
        "secondary_phone": null,
        "website": "https://www.alnoor.com"
      },
      "status": "in_progress",
      "completion_percentage": 45,
      "owner": {
        "id": "uuid",
        "first_name": "أحمد",
        "last_name": "محمد",
        "email": "ahmed@example.com"
      },
      "statistics": {
        "total_documents": 10,
        "approved_documents": 7,
        "pending_documents": 2,
        "rejected_documents": 1,
        "expired_documents": 0
      },
      "tags": ["تجارة", "عامة"],
      "custom_fields": {
        "capital": "1000000",
        "partners_count": 3
      },
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-11-06T14:20:00Z"
    }
  }
}
```

### 4. تحديث بيانات الشركة

**PATCH** `/companies/:id`

```json
Request:
{
  "name": "شركة النور للتجارة المحدودة",
  "description": "وصف محدث",
  "primary_phone": "+966112345679"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "company": { /* updated company object */ }
  }
}
```

### 5. تحديث حالة الشركة

**PATCH** `/companies/:id/status` (Supervisor/Admin)

```json
Request:
{
  "status": "ready",
  "notes": "جميع الوثائق مكتملة ومعتمدة"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "company": {
      "id": "uuid",
      "status": "ready",
      "updated_at": "2025-11-06T14:30:00Z"
    }
  }
}
```

### 6. حذف الشركة

**DELETE** `/companies/:id`

```json
Response: 200 OK
{
  "success": true,
  "message": "تم حذف الشركة بنجاح"
}
```

### 7. أرشفة الشركة

**POST** `/companies/:id/archive`

```json
Response: 200 OK
{
  "success": true,
  "message": "تم أرشفة الشركة بنجاح"
}
```

### 8. استرجاع الشركة من الأرشيف

**POST** `/companies/:id/unarchive`

```json
Response: 200 OK
{
  "success": true,
  "message": "تم استرجاع الشركة من الأرشيف بنجاح"
}
```

### 9. إحصائيات الشركات

**GET** `/companies/statistics`

```json
Response: 200 OK
{
  "success": true,
  "data": {
    "total": 150,
    "by_status": {
      "ready": 80,
      "in_progress": 50,
      "on_hold": 15,
      "archived": 5
    },
    "average_completion": 67,
    "total_documents": 3750,
    "this_month": {
      "new_companies": 12,
      "completed_companies": 8
    }
  }
}
```

## 📄 إدارة الوثائق (Documents)

### 1. الحصول على وثائق الشركة

**GET** `/companies/:companyId/documents`

Query Parameters:
- `page` (default: 1)
- `limit` (default: 50)
- `category` (legal, financial, hr, government, contract, report, other)
- `status` (pending, approved, rejected, expired)
- `search` (search in name)
- `sort` (name, uploaded_at, size, expiry_date)
- `order` (asc/desc)

```json
Response: 200 OK
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": "uuid",
        "name": "السجل التجاري",
        "original_name": "commercial_registration.pdf",
        "file_size": 2048576,
        "mime_type": "application/pdf",
        "extension": "pdf",
        "category": "legal",
        "document_type": "commercial_registration",
        "status": "approved",
        "version": 2,
        "is_latest_version": true,
        "issue_date": "2023-01-15",
        "expiry_date": "2025-12-31",
        "access_level": "confidential",
        "uploaded_by": {
          "id": "uuid",
          "first_name": "أحمد",
          "last_name": "محمد"
        },
        "uploaded_at": "2025-01-20T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 25,
      "total_pages": 1
    }
  }
}
```

### 2. رفع وثيقة جديدة

**POST** `/companies/:companyId/documents`

Content-Type: `multipart/form-data`

```
Form Data:
- file: (binary)
- name: "السجل التجاري"
- category: "legal"
- document_type: "commercial_registration"
- issue_date: "2023-01-15"
- expiry_date: "2025-12-31"
- access_level: "confidential"
- description: "السجل التجاري للشركة"
- tags: ["رسمي", "مهم"]

Response: 201 Created
{
  "success": true,
  "data": {
    "document": {
      "id": "uuid",
      "name": "السجل التجاري",
      "file_size": 2048576,
      "mime_type": "application/pdf",
      "status": "pending",
      "uploaded_at": "2025-11-06T14:30:00Z"
    }
  }
}
```

### 3. رفع وثائق متعددة

**POST** `/companies/:companyId/documents/batch`

Content-Type: `multipart/form-data`

```
Form Data:
- files[]: (multiple binaries)
- category: "legal"
- access_level: "confidential"

Response: 201 Created
{
  "success": true,
  "data": {
    "documents": [
      { "id": "uuid1", "name": "file1.pdf", "status": "success" },
      { "id": "uuid2", "name": "file2.pdf", "status": "success" },
      { "id": null, "name": "file3.pdf", "status": "failed", "error": "File too large" }
    ],
    "summary": {
      "total": 3,
      "successful": 2,
      "failed": 1
    }
  }
}
```

### 4. الحصول على وثيقة محددة

**GET** `/documents/:id`

```json
Response: 200 OK
{
  "success": true,
  "data": {
    "document": {
      "id": "uuid",
      "company_id": "uuid",
      "name": "السجل التجاري",
      "original_name": "commercial_registration_v2.pdf",
      "file_path": "/companies/uuid/legal/doc.pdf",
      "file_size": 2048576,
      "mime_type": "application/pdf",
      "extension": "pdf",
      "category": "legal",
      "document_type": "commercial_registration",
      "version": 2,
      "parent_document_id": "parent-uuid",
      "is_latest_version": true,
      "status": "approved",
      "approved_by": {
        "id": "uuid",
        "first_name": "محمد",
        "last_name": "علي"
      },
      "approved_at": "2025-02-01T10:00:00Z",
      "issue_date": "2023-01-15",
      "expiry_date": "2025-12-31",
      "access_level": "confidential",
      "description": "السجل التجاري للشركة - الإصدار الثاني",
      "tags": ["رسمي", "مهم"],
      "checksum": "sha256hash",
      "ocr_processed": true,
      "storage_provider": "minio",
      "uploaded_by": {
        "id": "uuid",
        "first_name": "أحمد",
        "last_name": "محمد"
      },
      "uploaded_at": "2025-01-20T10:30:00Z",
      "updated_at": "2025-02-01T10:00:00Z"
    }
  }
}
```

### 5. تحديث بيانات الوثيقة

**PATCH** `/documents/:id`

```json
Request:
{
  "name": "السجل التجاري - محدث",
  "description": "وصف محدث",
  "expiry_date": "2026-12-31",
  "tags": ["رسمي", "مهم", "محدث"]
}

Response: 200 OK
{
  "success": true,
  "data": {
    "document": { /* updated document object */ }
  }
}
```

### 6. الموافقة على الوثيقة

**POST** `/documents/:id/approve` (Supervisor/Admin)

```json
Request:
{
  "notes": "الوثيقة صحيحة ومعتمدة"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "document": {
      "id": "uuid",
      "status": "approved",
      "approved_at": "2025-11-06T14:30:00Z"
    }
  }
}
```

### 7. رفض الوثيقة

**POST** `/documents/:id/reject` (Supervisor/Admin)

```json
Request:
{
  "reason": "الوثيقة غير واضحة، يرجى رفع نسخة أفضل"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "document": {
      "id": "uuid",
      "status": "rejected",
      "rejection_reason": "الوثيقة غير واضحة، يرجى رفع نسخة أفضل"
    }
  }
}
```

### 8. تحميل الوثيقة

**GET** `/documents/:id/download`

```json
Response: 200 OK
{
  "success": true,
  "data": {
    "download_url": "https://minio.../presigned-url?expires=3600",
    "expires_in": 3600,
    "file_name": "commercial_registration.pdf"
  }
}
```

أو تحميل مباشر:

**GET** `/documents/:id/download?direct=true`

```
Response: 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="commercial_registration.pdf"

[Binary File Data]
```

### 9. معاينة الوثيقة

**GET** `/documents/:id/preview`

```json
Response: 200 OK
{
  "success": true,
  "data": {
    "preview_url": "https://minio.../presigned-url?expires=3600",
    "expires_in": 3600
  }
}
```

### 10. حذف الوثيقة

**DELETE** `/documents/:id`

```json
Response: 200 OK
{
  "success": true,
  "message": "تم حذف الوثيقة بنجاح"
}
```

### 11. الحصول على إصدارات الوثيقة

**GET** `/documents/:id/versions`

```json
Response: 200 OK
{
  "success": true,
  "data": {
    "versions": [
      {
        "id": "uuid-v2",
        "version": 2,
        "is_latest_version": true,
        "file_size": 2048576,
        "uploaded_by": {
          "id": "uuid",
          "first_name": "أحمد"
        },
        "uploaded_at": "2025-02-01T10:00:00Z"
      },
      {
        "id": "uuid-v1",
        "version": 1,
        "is_latest_version": false,
        "file_size": 1998000,
        "uploaded_by": {
          "id": "uuid",
          "first_name": "أحمد"
        },
        "uploaded_at": "2025-01-20T10:30:00Z"
      }
    ]
  }
}
```

### 12. رفع إصدار جديد من الوثيقة

**POST** `/documents/:id/versions`

Content-Type: `multipart/form-data`

```
Form Data:
- file: (binary)
- note: "تحديث السجل التجاري"

Response: 201 Created
{
  "success": true,
  "data": {
    "document": {
      "id": "new-uuid",
      "version": 3,
      "is_latest_version": true,
      "parent_document_id": "uuid",
      "uploaded_at": "2025-11-06T14:30:00Z"
    }
  }
}
```

## 🤝 إدارة المشاركة (Sharing)

### 1. مشاركة شركة مع مستخدم

**POST** `/companies/:companyId/share`

```json
Request:
{
  "shared_with_user_id": "uuid",
  "permission_level": "edit",
  "valid_until": "2026-12-31T23:59:59Z",
  "note": "مشاركة للمراجعة"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "share": {
      "id": "uuid",
      "company_id": "uuid",
      "shared_with_user": {
        "id": "uuid",
        "first_name": "خالد",
        "last_name": "أحمد",
        "email": "khaled@example.com"
      },
      "permission_level": "edit",
      "valid_until": "2026-12-31T23:59:59Z",
      "status": "active",
      "created_at": "2025-11-06T14:30:00Z"
    }
  }
}
```

### 2. الحصول على المشاركات لشركة

**GET** `/companies/:companyId/shares`

```json
Response: 200 OK
{
  "success": true,
  "data": {
    "shares": [
      {
        "id": "uuid",
        "shared_with_user": {
          "id": "uuid",
          "first_name": "خالد",
          "last_name": "أحمد",
          "email": "khaled@example.com",
          "avatar_url": null
        },
        "shared_by_user": {
          "id": "uuid",
          "first_name": "أحمد",
          "last_name": "محمد"
        },
        "permission_level": "edit",
        "valid_until": "2026-12-31T23:59:59Z",
        "status": "active",
        "created_at": "2025-11-06T14:30:00Z"
      }
    ]
  }
}
```

### 3. تحديث صلاحيات المشاركة

**PATCH** `/shares/:shareId`

```json
Request:
{
  "permission_level": "manage",
  "valid_until": "2027-12-31T23:59:59Z"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "share": { /* updated share object */ }
  }
}
```

### 4. إلغاء المشاركة

**DELETE** `/shares/:shareId`

```json
Response: 200 OK
{
  "success": true,
  "message": "تم إلغاء المشاركة بنجاح"
}
```

### 5. الشركات المشاركة معي

**GET** `/shares/shared-with-me`

```json
Response: 200 OK
{
  "success": true,
  "data": {
    "companies": [
      {
        "id": "uuid",
        "name": "شركة الأمل للتجارة",
        "owner": {
          "id": "uuid",
          "first_name": "محمد",
          "last_name": "علي"
        },
        "share": {
          "permission_level": "view",
          "valid_until": "2026-12-31T23:59:59Z",
          "shared_at": "2025-11-01T10:00:00Z"
        }
      }
    ]
  }
}
```

### 6. طلب وصول لشركة

**POST** `/companies/:companyId/request-access`

```json
Request:
{
  "permission_level": "view",
  "reason": "أحتاج للاطلاع على المستندات للمراجعة"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "request": {
      "id": "uuid",
      "company_id": "uuid",
      "permission_level": "view",
      "reason": "أحتاج للاطلاع على المستندات للمراجعة",
      "status": "pending",
      "created_at": "2025-11-06T14:30:00Z"
    }
  }
}
```

### 7. الموافقة على طلب الوصول

**POST** `/access-requests/:requestId/approve`

```json
Request:
{
  "valid_until": "2026-12-31T23:59:59Z",
  "response_note": "تمت الموافقة"
}

Response: 200 OK
{
  "success": true,
  "message": "تمت الموافقة على طلب الوصول"
}
```

### 8. رفض طلب الوصول

**POST** `/access-requests/:requestId/reject`

```json
Request:
{
  "response_note": "عذراً، لا يمكن الموافقة على الطلب حالياً"
}

Response: 200 OK
{
  "success": true,
  "message": "تم رفض طلب الوصول"
}
```

## 💬 إدارة التعليقات (Comments)

### 1. الحصول على تعليقات الشركة/الوثيقة

**GET** `/comments`

Query Parameters:
- `commentable_type` (company/document) [required]
- `commentable_id` (uuid) [required]
- `include_replies` (true/false, default: true)

```json
Response: 200 OK
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": "uuid",
        "content": "يرجى مراجعة هذه الوثيقة",
        "created_by": {
          "id": "uuid",
          "first_name": "أحمد",
          "last_name": "محمد",
          "avatar_url": null
        },
        "created_at": "2025-11-06T14:00:00Z",
        "updated_at": "2025-11-06T14:00:00Z",
        "resolved": false,
        "replies": [
          {
            "id": "uuid",
            "content": "تمت المراجعة",
            "created_by": {
              "id": "uuid",
              "first_name": "خالد",
              "last_name": "أحمد"
            },
            "created_at": "2025-11-06T14:30:00Z"
          }
        ]
      }
    ]
  }
}
```

### 2. إضافة تعليق

**POST** `/comments`

```json
Request:
{
  "commentable_type": "document",
  "commentable_id": "uuid",
  "content": "يرجى مراجعة هذه الوثيقة",
  "mentioned_users": ["uuid1", "uuid2"]
}

Response: 201 Created
{
  "success": true,
  "data": {
    "comment": {
      "id": "uuid",
      "content": "يرجى مراجعة هذه الوثيقة",
      "created_by": {
        "id": "uuid",
        "first_name": "أحمد",
        "last_name": "محمد"
      },
      "created_at": "2025-11-06T14:00:00Z"
    }
  }
}
```

### 3. الرد على تعليق

**POST** `/comments/:commentId/reply`

```json
Request:
{
  "content": "تمت المراجعة، كل شيء على ما يرام"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "comment": {
      "id": "uuid",
      "parent_comment_id": "parent-uuid",
      "content": "تمت المراجعة، كل شيء على ما يرام",
      "created_at": "2025-11-06T14:30:00Z"
    }
  }
}
```

### 4. تحديث تعليق

**PATCH** `/comments/:id`

```json
Request:
{
  "content": "تعليق محدث"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "comment": { /* updated comment */ }
  }
}
```

### 5. حل التعليق (Mark as Resolved)

**POST** `/comments/:id/resolve`

```json
Response: 200 OK
{
  "success": true,
  "data": {
    "comment": {
      "id": "uuid",
      "resolved": true,
      "resolved_at": "2025-11-06T15:00:00Z"
    }
  }
}
```

### 6. حذف تعليق

**DELETE** `/comments/:id`

```json
Response: 200 OK
{
  "success": true,
  "message": "تم حذف التعليق بنجاح"
}
```

## 🔔 إدارة الإشعارات (Notifications)

### 1. الحصول على إشعارات المستخدم

**GET** `/notifications`

Query Parameters:
- `page` (default: 1)
- `limit` (default: 20)
- `unread_only` (true/false, default: false)
- `type` (filter by type)

```json
Response: 200 OK
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "uuid",
        "type": "document_uploaded",
        "title": "وثيقة جديدة",
        "message": "تم رفع وثيقة جديدة في شركة الأمل للتجارة",
        "read": false,
        "reference_type": "document",
        "reference_id": "doc-uuid",
        "data": {
          "company_name": "شركة الأمل للتجارة",
          "document_name": "السجل التجاري"
        },
        "created_at": "2025-11-06T14:00:00Z"
      }
    ],
    "unread_count": 5,
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50
    }
  }
}
```

### 2. تحديد إشعار كمقروء

**PATCH** `/notifications/:id/read`

```json
Response: 200 OK
{
  "success": true,
  "message": "تم تحديد الإشعار كمقروء"
}
```

### 3. تحديد جميع الإشعارات كمقروءة

**POST** `/notifications/mark-all-read`

```json
Response: 200 OK
{
  "success": true,
  "message": "تم تحديد جميع الإشعارات كمقروءة"
}
```

### 4. حذف إشعار

**DELETE** `/notifications/:id`

```json
Response: 200 OK
{
  "success": true,
  "message": "تم حذف الإشعار"
}
```

### 5. حذف جميع الإشعارات المقروءة

**DELETE** `/notifications/read`

```json
Response: 200 OK
{
  "success": true,
  "message": "تم حذف جميع الإشعارات المقروءة"
}
```

## 📊 لوحة التحكم والإحصائيات (Dashboard)

### 1. إحصائيات عامة

**GET** `/dashboard/statistics`

```json
Response: 200 OK
{
  "success": true,
  "data": {
    "companies": {
      "total": 150,
      "ready": 80,
      "in_progress": 50,
      "on_hold": 15,
      "archived": 5
    },
    "documents": {
      "total": 3750,
      "approved": 3200,
      "pending": 400,
      "rejected": 100,
      "expired": 50
    },
    "users": {
      "total": 45,
      "active": 40,
      "inactive": 5
    },
    "storage": {
      "used_bytes": 1073741824,
      "used_gb": 1.0,
      "total_files": 3750
    },
    "recent_activity": {
      "new_companies_this_month": 12,
      "new_documents_this_month": 145,
      "completed_companies_this_month": 8
    }
  }
}
```

### 2. إحصائيات الشركات حسب الوقت

**GET** `/dashboard/companies-trend`

Query Parameters:
- `period` (week, month, year, default: month)

```json
Response: 200 OK
{
  "success": true,
  "data": {
    "labels": ["يناير", "فبراير", "مارس", "أبريل"],
    "datasets": [
      {
        "label": "شركات جديدة",
        "data": [5, 8, 12, 10]
      },
      {
        "label": "شركات مكتملة",
        "data": [3, 5, 8, 7]
      }
    ]
  }
}
```

### 3. توزيع الشركات حسب الحالة

**GET** `/dashboard/companies-by-status`

```json
Response: 200 OK
{
  "success": true,
  "data": {
    "labels": ["جاهزة", "قيد العمل", "معلقة", "محفوظة"],
    "data": [80, 50, 15, 5],
    "percentages": [53.3, 33.3, 10.0, 3.4]
  }
}
```

### 4. أنشط المستخدمين

**GET** `/dashboard/top-users`

Query Parameters:
- `limit` (default: 10)
- `metric` (companies, documents, uploads, default: documents)

```json
Response: 200 OK
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "full_name": "أحمد محمد",
        "companies_count": 15,
        "documents_count": 120,
        "uploads_this_month": 25
      }
    ]
  }
}
```

### 5. النشاطات الأخيرة

**GET** `/dashboard/recent-activities`

Query Parameters:
- `limit` (default: 20)

```json
Response: 200 OK
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "uuid",
        "user": {
          "id": "uuid",
          "full_name": "أحمد محمد"
        },
        "action": "uploaded_document",
        "description": "رفع وثيقة 'السجل التجاري' في شركة الأمل للتجارة",
        "reference_type": "document",
        "reference_id": "uuid",
        "created_at": "2025-11-06T14:30:00Z"
      }
    ]
  }
}
```

## 📈 التقارير (Reports)

### 1. إنشاء تقرير

**POST** `/reports/generate`

```json
Request:
{
  "type": "companies_summary",
  "format": "pdf",
  "filters": {
    "status": ["ready", "in_progress"],
    "date_from": "2025-01-01",
    "date_to": "2025-12-31"
  }
}

Response: 202 Accepted
{
  "success": true,
  "data": {
    "report_id": "uuid",
    "status": "generating",
    "message": "جاري إنشاء التقرير، سيتم إشعارك عند الانتهاء"
  }
}
```

### 2. الحصول على حالة التقرير

**GET** `/reports/:reportId/status`

```json
Response: 200 OK
{
  "success": true,
  "data": {
    "report_id": "uuid",
    "status": "completed",
    "download_url": "https://.../report.pdf",
    "expires_at": "2025-11-07T14:30:00Z"
  }
}
```

### 3. تحميل التقرير

**GET** `/reports/:reportId/download`

```
Response: 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="report_2025_11_06.pdf"

[Binary File Data]
```

## 🔍 البحث (Search)

### 1. بحث عام

**GET** `/search`

Query Parameters:
- `q` (search query) [required]
- `type` (companies, documents, users)
- `limit` (default: 20)

```json
Response: 200 OK
{
  "success": true,
  "data": {
    "companies": [
      {
        "id": "uuid",
        "name": "شركة الأمل للتجارة",
        "commercial_registration": "1234567890",
        "status": "ready"
      }
    ],
    "documents": [
      {
        "id": "uuid",
        "name": "السجل التجاري",
        "company_name": "شركة الأمل للتجارة"
      }
    ],
    "users": []
  }
}
```

### 2. بحث متقدم في الشركات

**POST** `/search/companies/advanced`

```json
Request:
{
  "name": "شركة",
  "commercial_registration": "123",
  "status": ["ready", "in_progress"],
  "completion_min": 50,
  "completion_max": 100,
  "created_from": "2025-01-01",
  "created_to": "2025-12-31",
  "owner_ids": ["uuid1", "uuid2"],
  "tags": ["تجارة"]
}

Response: 200 OK
{
  "success": true,
  "data": {
    "companies": [ /* matching companies */ ],
    "total": 25
  }
}
```

## 📋 سجلات التدقيق (Audit Logs)

### 1. الحصول على سجلات التدقيق

**GET** `/audit-logs` (Admin/Auditor only)

Query Parameters:
- `page` (default: 1)
- `limit` (default: 50)
- `user_id` (filter by user)
- `action` (filter by action)
- `resource_type` (filter by resource)
- `date_from`
- `date_to`

```json
Response: 200 OK
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "uuid",
        "user": {
          "id": "uuid",
          "full_name": "أحمد محمد"
        },
        "action": "UPDATE",
        "resource_type": "companies",
        "resource_id": "uuid",
        "ip_address": "192.168.1.100",
        "status": "success",
        "details": {
          "changed_fields": ["status", "completion_percentage"]
        },
        "created_at": "2025-11-06T14:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1000
    }
  }
}
```

## ⚙️ الإعدادات (Settings)

### 1. الحصول على الإعدادات

**GET** `/settings` (Admin only)

```json
Response: 200 OK
{
  "success": true,
  "data": {
    "settings": {
      "system": {
        "app_name": "نظام إدارة الشركات والوثائق",
        "timezone": "Asia/Riyadh",
        "language": "ar"
      },
      "storage": {
        "max_file_size": 52428800,
        "allowed_extensions": ["pdf", "jpg", "png", "docx", "xlsx"]
      },
      "security": {
        "session_timeout": 900,
        "max_login_attempts": 5,
        "password_min_length": 8,
        "require_two_factor": false
      },
      "notifications": {
        "email_enabled": true,
        "sms_enabled": false,
        "expiry_notification_days": 30
      }
    }
  }
}
```

### 2. تحديث الإعدادات

**PATCH** `/settings` (Admin only)

```json
Request:
{
  "storage.max_file_size": 104857600,
  "notifications.expiry_notification_days": 60
}

Response: 200 OK
{
  "success": true,
  "message": "تم تحديث الإعدادات بنجاح"
}
```

## ❌ معالجة الأخطاء (Error Handling)

جميع الأخطاء تعاد بالصيغة التالية:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "رسالة الخطأ بالعربية",
    "details": { /* optional additional details */ }
  }
}
```

### رموز الأخطاء الشائعة:

| Status Code | Error Code | Description |
|-------------|------------|-------------|
| 400 | VALIDATION_ERROR | خطأ في البيانات المدخلة |
| 401 | UNAUTHORIZED | غير مصرح بالدخول |
| 403 | FORBIDDEN | لا تملك الصلاحية |
| 404 | NOT_FOUND | المورد غير موجود |
| 409 | CONFLICT | تعارض في البيانات |
| 413 | FILE_TOO_LARGE | الملف كبير جداً |
| 429 | RATE_LIMIT_EXCEEDED | تجاوزت عدد الطلبات المسموح |
| 500 | INTERNAL_ERROR | خطأ داخلي في الخادم |

مثال:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "خطأ في البيانات المدخلة",
    "details": {
      "fields": {
        "email": "البريد الإلكتروني مطلوب",
        "password": "كلمة المرور يجب أن تكون 8 أحرف على الأقل"
      }
    }
  }
}
```

## 📊 التصفية والترتيب (Pagination & Sorting)

جميع endpoints التي تعيد قوائم تدعم:

```
?page=1
&limit=20
&sort=created_at
&order=desc
&search=keyword
```

الإرجاع:

```json
{
  "success": true,
  "data": {
    "items": [ /* array of items */ ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "total_pages": 8,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

## 🔒 Rate Limiting

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699360200
```

## 📌 ملاحظات

1. جميع التواريخ بصيغة ISO 8601 (UTC)
2. جميع الـ IDs بصيغة UUID
3. جميع الـ endpoints تتطلب مصادقة ما عدا `/auth/login` و `/auth/refresh`
4. الحد الأقصى لحجم الملف: 50MB (قابل للتعديل في الإعدادات)
5. Rate Limiting: 100 requests per minute per user
6. جميع الـ responses تدعم الضغط (gzip)
7. يجب إرسال `Content-Type: application/json` للـ requests (ما عدا رفع الملفات)

