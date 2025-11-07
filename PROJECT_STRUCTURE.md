# 🏗️ بنية المشروع (Project Structure)

## نظرة عامة

المشروع يتبع معمارية Monorepo مع فصل واضح بين Frontend و Backend.

```
company-docs-manager/
├── 📁 frontend/                 # تطبيق Next.js
├── 📁 backend/                  # خادم Node.js/Express
├── 📁 docs/                     # التوثيق
├── 📁 docker/                   # ملفات Docker
├── 📁 scripts/                  # سكربتات مساعدة
├── 📄 docker-compose.yml        # إعداد Docker Compose
├── 📄 .gitignore
├── 📄 README.md
└── 📄 package.json              # Root package.json للـ monorepo
```

---

## 📱 Frontend Structure (Next.js 14)

```
frontend/
├── 📁 src/
│   ├── 📁 app/                            # App Router
│   │   ├── 📁 (auth)/                     # مجموعة المصادقة
│   │   │   ├── 📁 login/
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 register/
│   │   │   │   └── 📄 page.tsx
│   │   │   └── 📄 layout.tsx              # Layout للصفحات بدون مصادقة
│   │   │
│   │   ├── 📁 (dashboard)/                # مجموعة لوحة التحكم (تتطلب مصادقة)
│   │   │   ├── 📁 dashboard/
│   │   │   │   └── 📄 page.tsx            # الصفحة الرئيسية
│   │   │   │
│   │   │   ├── 📁 companies/
│   │   │   │   ├── 📄 page.tsx            # قائمة الشركات
│   │   │   │   ├── 📁 [id]/
│   │   │   │   │   ├── 📄 page.tsx        # تفاصيل الشركة
│   │   │   │   │   ├── 📁 edit/
│   │   │   │   │   │   └── 📄 page.tsx
│   │   │   │   │   └── 📁 documents/
│   │   │   │   │       └── 📄 page.tsx
│   │   │   │   └── 📁 new/
│   │   │   │       └── 📄 page.tsx        # إنشاء شركة جديدة
│   │   │   │
│   │   │   ├── 📁 documents/
│   │   │   │   ├── 📄 page.tsx
│   │   │   │   └── 📁 [id]/
│   │   │   │       └── 📄 page.tsx
│   │   │   │
│   │   │   ├── 📁 users/                  # (Admin only)
│   │   │   │   ├── 📄 page.tsx
│   │   │   │   ├── 📁 [id]/
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   └── 📁 new/
│   │   │   │       └── 📄 page.tsx
│   │   │   │
│   │   │   ├── 📁 reports/
│   │   │   │   └── 📄 page.tsx
│   │   │   │
│   │   │   ├── 📁 settings/
│   │   │   │   ├── 📄 page.tsx
│   │   │   │   ├── 📁 profile/
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   └── 📁 system/            # (Admin only)
│   │   │   │       └── 📄 page.tsx
│   │   │   │
│   │   │   ├── 📁 audit-logs/            # (Admin/Auditor only)
│   │   │   │   └── 📄 page.tsx
│   │   │   │
│   │   │   └── 📄 layout.tsx              # Layout الرئيسي
│   │   │
│   │   ├── 📁 api/                        # API Routes (optional)
│   │   │   └── 📁 auth/
│   │   │       └── 📁 [...nextauth]/
│   │   │           └── 📄 route.ts
│   │   │
│   │   ├── 📄 layout.tsx                  # Root Layout
│   │   ├── 📄 page.tsx                    # Home page (redirect)
│   │   ├── 📄 loading.tsx                 # Global loading
│   │   ├── 📄 error.tsx                   # Global error
│   │   └── 📄 not-found.tsx               # 404 page
│   │
│   ├── 📁 components/                     # مكونات React
│   │   ├── 📁 ui/                         # مكونات UI أساسية (Shadcn)
│   │   │   ├── 📄 button.tsx
│   │   │   ├── 📄 input.tsx
│   │   │   ├── 📄 dialog.tsx
│   │   │   ├── 📄 dropdown-menu.tsx
│   │   │   ├── 📄 table.tsx
│   │   │   ├── 📄 card.tsx
│   │   │   ├── 📄 badge.tsx
│   │   │   ├── 📄 avatar.tsx
│   │   │   ├── 📄 toast.tsx
│   │   │   └── 📄 ...
│   │   │
│   │   ├── 📁 layout/                     # مكونات الـ Layout
│   │   │   ├── 📄 Header.tsx
│   │   │   ├── 📄 Sidebar.tsx
│   │   │   ├── 📄 Footer.tsx
│   │   │   └── 📄 Breadcrumbs.tsx
│   │   │
│   │   ├── 📁 companies/                  # مكونات خاصة بالشركات
│   │   │   ├── 📄 CompanyCard.tsx
│   │   │   ├── 📄 CompanyList.tsx
│   │   │   ├── 📄 CompanyForm.tsx
│   │   │   ├── 📄 CompanyDetails.tsx
│   │   │   ├── 📄 CompanyFilters.tsx
│   │   │   └── 📄 CompanyStatusBadge.tsx
│   │   │
│   │   ├── 📁 documents/                  # مكونات خاصة بالوثائق
│   │   │   ├── 📄 DocumentCard.tsx
│   │   │   ├── 📄 DocumentList.tsx
│   │   │   ├── 📄 DocumentUpload.tsx
│   │   │   ├── 📄 DocumentPreview.tsx
│   │   │   ├── 📄 DocumentViewer.tsx
│   │   │   └── 📄 DocumentStatusBadge.tsx
│   │   │
│   │   ├── 📁 users/                      # مكونات خاصة بالمستخدمين
│   │   │   ├── 📄 UserCard.tsx
│   │   │   ├── 📄 UserList.tsx
│   │   │   ├── 📄 UserForm.tsx
│   │   │   └── 📄 UserAvatar.tsx
│   │   │
│   │   ├── 📁 shares/                     # مكونات المشاركة
│   │   │   ├── 📄 ShareDialog.tsx
│   │   │   ├── 📄 ShareList.tsx
│   │   │   └── 📄 AccessRequestCard.tsx
│   │   │
│   │   ├── 📁 comments/                   # مكونات التعليقات
│   │   │   ├── 📄 CommentList.tsx
│   │   │   ├── 📄 CommentItem.tsx
│   │   │   └── 📄 CommentForm.tsx
│   │   │
│   │   ├── 📁 notifications/              # مكونات الإشعارات
│   │   │   ├── 📄 NotificationBell.tsx
│   │   │   ├── 📄 NotificationList.tsx
│   │   │   └── 📄 NotificationItem.tsx
│   │   │
│   │   ├── 📁 dashboard/                  # مكونات لوحة التحكم
│   │   │   ├── 📄 StatCard.tsx
│   │   │   ├── 📄 ChartCard.tsx
│   │   │   ├── 📄 ActivityFeed.tsx
│   │   │   └── 📄 QuickActions.tsx
│   │   │
│   │   ├── 📁 forms/                      # مكونات النماذج المتقدمة
│   │   │   ├── 📄 FormField.tsx
│   │   │   ├── 📄 FormSelect.tsx
│   │   │   ├── 📄 FormDatePicker.tsx
│   │   │   ├── 📄 FormFileUpload.tsx
│   │   │   └── 📄 FormMultiSelect.tsx
│   │   │
│   │   └── 📁 common/                     # مكونات مشتركة
│   │       ├── 📄 LoadingSpinner.tsx
│   │       ├── 📄 ErrorMessage.tsx
│   │       ├── 📄 EmptyState.tsx
│   │       ├── 📄 ConfirmDialog.tsx
│   │       ├── 📄 SearchBar.tsx
│   │       ├── 📄 Pagination.tsx
│   │       └── 📄 DataTable.tsx
│   │
│   ├── 📁 lib/                            # مكتبات ووظائف مساعدة
│   │   ├── 📄 api.ts                      # API client
│   │   ├── 📄 auth.ts                     # مساعدات المصادقة
│   │   ├── 📄 utils.ts                    # وظائف مساعدة عامة
│   │   ├── 📄 constants.ts                # ثوابت
│   │   ├── 📄 validations.ts              # مخططات Zod للتحقق
│   │   └── 📄 date-utils.ts               # وظائف التاريخ
│   │
│   ├── 📁 hooks/                          # Custom React Hooks
│   │   ├── 📄 useAuth.ts
│   │   ├── 📄 useCompanies.ts
│   │   ├── 📄 useDocuments.ts
│   │   ├── 📄 useNotifications.ts
│   │   ├── 📄 useDebounce.ts
│   │   ├── 📄 useInfiniteScroll.ts
│   │   └── 📄 usePermissions.ts
│   │
│   ├── 📁 store/                          # State Management (Zustand)
│   │   ├── 📄 auth.store.ts
│   │   ├── 📄 companies.store.ts
│   │   ├── 📄 notifications.store.ts
│   │   ├── 📄 ui.store.ts
│   │   └── 📄 index.ts
│   │
│   ├── 📁 types/                          # TypeScript Types
│   │   ├── 📄 user.types.ts
│   │   ├── 📄 company.types.ts
│   │   ├── 📄 document.types.ts
│   │   ├── 📄 share.types.ts
│   │   ├── 📄 notification.types.ts
│   │   ├── 📄 api.types.ts
│   │   └── 📄 index.ts
│   │
│   ├── 📁 styles/                         # ملفات الأنماط
│   │   ├── 📄 globals.css                 # Tailwind globals
│   │   └── 📄 theme.css                   # متغيرات CSS
│   │
│   └── 📁 config/                         # ملفات التكوين
│       ├── 📄 routes.ts                   # تعريف المسارات
│       ├── 📄 permissions.ts              # صلاحيات الأدوار
│       └── 📄 site.ts                     # إعدادات الموقع
│
├── 📁 public/                             # ملفات عامة
│   ├── 📁 images/
│   ├── 📁 icons/
│   ├── 📄 favicon.ico
│   └── 📄 robots.txt
│
├── 📄 next.config.js                      # إعدادات Next.js
├── 📄 tailwind.config.js                  # إعدادات Tailwind
├── 📄 tsconfig.json                       # إعدادات TypeScript
├── 📄 .eslintrc.json                      # إعدادات ESLint
├── 📄 .prettierrc                         # إعدادات Prettier
├── 📄 package.json
└── 📄 .env.local                          # متغيرات البيئة
```

---

## 🖥️ Backend Structure (NestJS)

```
backend/
├── 📁 src/
│   ├── 📁 modules/                        # Feature Modules
│   │   │
│   │   ├── 📁 auth/                       # Authentication Module
│   │   │   ├── 📄 auth.module.ts
│   │   │   ├── 📄 auth.controller.ts
│   │   │   ├── 📄 auth.service.ts
│   │   │   ├── 📁 strategies/
│   │   │   │   ├── 📄 jwt.strategy.ts
│   │   │   │   ├── 📄 jwt-refresh.strategy.ts
│   │   │   │   └── 📄 local.strategy.ts
│   │   │   ├── 📁 guards/
│   │   │   │   ├── 📄 jwt-auth.guard.ts
│   │   │   │   ├── 📄 jwt-refresh.guard.ts
│   │   │   │   ├── 📄 local-auth.guard.ts
│   │   │   │   └── 📄 roles.guard.ts
│   │   │   ├── 📁 decorators/
│   │   │   │   ├── 📄 current-user.decorator.ts
│   │   │   │   ├── 📄 roles.decorator.ts
│   │   │   │   └── 📄 public.decorator.ts
│   │   │   └── 📁 dto/
│   │   │       ├── 📄 login.dto.ts
│   │   │       ├── 📄 register.dto.ts
│   │   │       └── 📄 refresh-token.dto.ts
│   │   │
│   │   ├── 📁 users/                      # Users Module
│   │   │   ├── 📄 users.module.ts
│   │   │   ├── 📄 users.controller.ts
│   │   │   ├── 📄 users.service.ts
│   │   │   ├── 📁 dto/
│   │   │   │   ├── 📄 create-user.dto.ts
│   │   │   │   ├── 📄 update-user.dto.ts
│   │   │   │   └── 📄 query-user.dto.ts
│   │   │   └── 📁 entities/
│   │   │       └── 📄 user.entity.ts
│   │   │
│   │   ├── 📁 companies/                  # Companies Module
│   │   │   ├── 📄 companies.module.ts
│   │   │   ├── 📄 companies.controller.ts
│   │   │   ├── 📄 companies.service.ts
│   │   │   ├── 📁 dto/
│   │   │   │   ├── 📄 create-company.dto.ts
│   │   │   │   ├── 📄 update-company.dto.ts
│   │   │   │   └── 📄 query-company.dto.ts
│   │   │   └── 📁 entities/
│   │   │       └── 📄 company.entity.ts
│   │   │
│   │   ├── 📁 documents/                  # Documents Module
│   │   │   ├── 📄 documents.module.ts
│   │   │   ├── 📄 documents.controller.ts
│   │   │   ├── 📄 documents.service.ts
│   │   │   ├── 📁 dto/
│   │   │   │   ├── 📄 upload-document.dto.ts
│   │   │   │   ├── 📄 update-document.dto.ts
│   │   │   │   └── 📄 query-document.dto.ts
│   │   │   └── 📁 entities/
│   │   │       └── 📄 document.entity.ts
│   │   │
│   │   ├── 📁 shares/                     # Sharing Module
│   │   │   ├── 📄 shares.module.ts
│   │   │   ├── 📄 shares.controller.ts
│   │   │   ├── 📄 shares.service.ts
│   │   │   └── 📁 dto/
│   │   │       ├── 📄 create-share.dto.ts
│   │   │       └── 📄 update-share.dto.ts
│   │   │
│   │   ├── 📁 comments/                   # Comments Module
│   │   │   ├── 📄 comments.module.ts
│   │   │   ├── 📄 comments.controller.ts
│   │   │   ├── 📄 comments.service.ts
│   │   │   └── 📁 dto/
│   │   │       └── 📄 create-comment.dto.ts
│   │   │
│   │   ├── 📁 notifications/              # Notifications Module
│   │   │   ├── 📄 notifications.module.ts
│   │   │   ├── 📄 notifications.controller.ts
│   │   │   ├── 📄 notifications.service.ts
│   │   │   └── 📄 notifications.gateway.ts  # WebSocket
│   │   │
│   │   ├── 📁 dashboard/                  # Dashboard Module
│   │   │   ├── 📄 dashboard.module.ts
│   │   │   ├── 📄 dashboard.controller.ts
│   │   │   └── 📄 dashboard.service.ts
│   │   │
│   │   ├── 📁 reports/                    # Reports Module
│   │   │   ├── 📄 reports.module.ts
│   │   │   ├── 📄 reports.controller.ts
│   │   │   ├── 📄 reports.service.ts
│   │   │   └── 📁 processors/
│   │   │       └── 📄 report.processor.ts  # Queue processor
│   │   │
│   │   ├── 📁 search/                     # Search Module
│   │   │   ├── 📄 search.module.ts
│   │   │   ├── 📄 search.controller.ts
│   │   │   └── 📄 search.service.ts
│   │   │
│   │   ├── 📁 audit/                      # Audit Module
│   │   │   ├── 📄 audit.module.ts
│   │   │   ├── 📄 audit.controller.ts
│   │   │   ├── 📄 audit.service.ts
│   │   │   └── 📁 interceptors/
│   │   │       └── 📄 audit-log.interceptor.ts
│   │   │
│   │   └── 📁 settings/                   # Settings Module
│   │       ├── 📄 settings.module.ts
│   │       ├── 📄 settings.controller.ts
│   │       └── 📄 settings.service.ts
│   │
│   ├── 📁 common/                         # Shared/Common Module
│   │   ├── 📄 common.module.ts
│   │   │
│   │   ├── 📁 guards/                     # Global Guards
│   │   │   ├── 📄 permissions.guard.ts
│   │   │   ├── 📄 ownership.guard.ts
│   │   │   └── 📄 throttler.guard.ts
│   │   │
│   │   ├── 📁 interceptors/               # Global Interceptors
│   │   │   ├── 📄 transform.interceptor.ts
│   │   │   ├── 📄 logging.interceptor.ts
│   │   │   └── 📄 timeout.interceptor.ts
│   │   │
│   │   ├── 📁 filters/                    # Exception Filters
│   │   │   ├── 📄 http-exception.filter.ts
│   │   │   ├── 📄 prisma-exception.filter.ts
│   │   │   └── 📄 all-exceptions.filter.ts
│   │   │
│   │   ├── 📁 pipes/                      # Custom Pipes
│   │   │   ├── 📄 parse-uuid.pipe.ts
│   │   │   └── 📄 validation.pipe.ts
│   │   │
│   │   ├── 📁 decorators/                 # Custom Decorators
│   │   │   ├── 📄 api-paginated-response.decorator.ts
│   │   │   ├── 📄 api-standard-response.decorator.ts
│   │   │   └── 📄 is-saudi-phone.decorator.ts
│   │   │
│   │   ├── 📁 dto/                        # Common DTOs
│   │   │   ├── 📄 pagination.dto.ts
│   │   │   ├── 📄 query.dto.ts
│   │   │   └── 📄 id-param.dto.ts
│   │   │
│   │   ├── 📁 interfaces/                 # Common Interfaces
│   │   │   ├── 📄 paginated-result.interface.ts
│   │   │   ├── 📄 api-response.interface.ts
│   │   │   └── 📄 jwt-payload.interface.ts
│   │   │
│   │   ├── 📁 enums/                      # Enums
│   │   │   ├── 📄 user-role.enum.ts
│   │   │   ├── 📄 company-status.enum.ts
│   │   │   └── 📄 document-category.enum.ts
│   │   │
│   │   └── 📁 constants/                  # Constants
│   │       ├── 📄 permissions.constant.ts
│   │       ├── 📄 errors.constant.ts
│   │       └── 📄 config.constant.ts
│   │
│   ├── 📁 database/                       # Database Module
│   │   ├── 📄 database.module.ts
│   │   ├── 📄 prisma.service.ts           # Prisma Service
│   │   └── 📄 prisma-client-exception.filter.ts
│   │
│   ├── 📁 storage/                        # Storage Module (MinIO)
│   │   ├── 📄 storage.module.ts
│   │   ├── 📄 storage.service.ts
│   │   └── 📁 interceptors/
│   │       └── 📄 file-upload.interceptor.ts
│   │
│   ├── 📁 cache/                          # Cache Module (Redis)
│   │   ├── 📄 cache.module.ts
│   │   ├── 📄 redis.service.ts
│   │   └── 📁 decorators/
│   │       └── 📄 cache-key.decorator.ts
│   │
│   ├── 📁 queue/                          # Queue Module (Bull)
│   │   ├── 📄 queue.module.ts
│   │   ├── 📁 processors/
│   │   │   ├── 📄 email.processor.ts
│   │   │   ├── 📄 notification.processor.ts
│   │   │   ├── 📄 report.processor.ts
│   │   │   └── 📄 ocr.processor.ts
│   │   └── 📁 jobs/
│   │       ├── 📄 cleanup-sessions.job.ts
│   │       └── 📄 expiry-notifications.job.ts
│   │
│   ├── 📁 mail/                           # Mail Module
│   │   ├── 📄 mail.module.ts
│   │   ├── 📄 mail.service.ts
│   │   └── 📁 templates/
│   │       ├── 📄 welcome.template.ts
│   │       └── 📄 reset-password.template.ts
│   │
│   ├── 📁 config/                         # Configuration
│   │   ├── 📄 app.config.ts
│   │   ├── 📄 database.config.ts
│   │   ├── 📄 jwt.config.ts
│   │   ├── 📄 redis.config.ts
│   │   ├── 📄 minio.config.ts
│   │   ├── 📄 mail.config.ts
│   │   └── 📄 throttler.config.ts
│   │
│   ├── 📄 app.module.ts                   # Root Module
│   ├── 📄 app.controller.ts               # Health check
│   ├── 📄 app.service.ts
│   └── 📄 main.ts                         # Bootstrap
│
├── 📁 prisma/                             # Prisma
│   ├── 📄 schema.prisma                   # Database schema
│   ├── 📁 migrations/                     # Database migrations
│   └── 📄 seed.ts                         # Database seeding
│
├── 📁 tests/                              # Tests
│   ├── 📁 unit/
│   │   ├── 📁 services/
│   │   ├── 📁 utils/
│   │   └── 📁 validators/
│   ├── 📁 integration/
│   │   └── 📁 api/
│   └── 📁 e2e/
│
├── 📁 uploads/                            # Temporary uploads (gitignored)
│   └── 📁 temp/
│
├── 📄 tsconfig.json
├── 📄 .eslintrc.json
├── 📄 .prettierrc
├── 📄 jest.config.js
├── 📄 package.json
└── 📄 .env                                # Environment variables
```

---

## 📚 Prisma Schema Example

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                String    @id @default(uuid())
  email             String    @unique
  passwordHash      String    @map("password_hash")
  firstName         String    @map("first_name")
  lastName          String    @map("last_name")
  phone             String?
  role              UserRole
  status            UserStatus @default(ACTIVE)
  avatarUrl         String?   @map("avatar_url")
  lastLoginAt       DateTime? @map("last_login_at")
  emailVerified     Boolean   @default(false) @map("email_verified")
  twoFactorEnabled  Boolean   @default(false) @map("two_factor_enabled")
  twoFactorSecret   String?   @map("two_factor_secret")
  
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")
  
  // Relations
  ownedCompanies    Company[]  @relation("CompanyOwner")
  uploadedDocuments Document[] @relation("DocumentUploader")
  comments          Comment[]
  notifications     Notification[]
  sessions          Session[]
  auditLogs         AuditLog[]
  
  sharesGiven       CompanyShare[] @relation("ShareGiver")
  sharesReceived    CompanyShare[] @relation("ShareReceiver")
  accessRequests    AccessRequest[]
  
  @@map("users")
}

enum UserRole {
  SUPER_ADMIN
  ADMIN
  SUPERVISOR
  EMPLOYEE
  AUDITOR
  
  @@map("user_role")
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  
  @@map("user_status")
}

model Company {
  id                    String    @id @default(uuid())
  name                  String
  nameArabic            String?   @map("name_arabic")
  description           String?
  companyType           CompanyType? @map("company_type")
  commercialRegistration String?  @unique @map("commercial_registration")
  taxNumber             String?   @map("tax_number")
  establishmentDate     DateTime? @map("establishment_date") @db.Date
  
  // Address
  country               String?
  city                  String?
  district              String?
  street                String?
  buildingNumber        String?   @map("building_number")
  postalCode            String?   @map("postal_code")
  
  // Contact
  primaryEmail          String?   @map("primary_email")
  primaryPhone          String?   @map("primary_phone")
  secondaryPhone        String?   @map("secondary_phone")
  website               String?
  
  // Status
  status                CompanyStatus @default(IN_PROGRESS)
  completionPercentage  Int       @default(0) @map("completion_percentage")
  
  // Metadata
  notes                 String?
  tags                  String[]
  customFields          Json?     @map("custom_fields")
  
  // Ownership
  ownerId               String    @map("owner_id")
  owner                 User      @relation("CompanyOwner", fields: [ownerId], references: [id])
  
  // Timestamps
  createdAt             DateTime  @default(now()) @map("created_at")
  updatedAt             DateTime  @updatedAt @map("updated_at")
  archivedAt            DateTime? @map("archived_at")
  
  // Relations
  documents             Document[]
  shares                CompanyShare[]
  accessRequests        AccessRequest[]
  comments              Comment[]
  
  @@index([ownerId])
  @@index([status])
  @@index([commercialRegistration])
  @@map("companies")
}

enum CompanyType {
  INDIVIDUAL
  PARTNERSHIP
  LLC
  PUBLIC_COMPANY
  PRIVATE_COMPANY
  NON_PROFIT
  
  @@map("company_type")
}

enum CompanyStatus {
  READY
  IN_PROGRESS
  ON_HOLD
  ARCHIVED
  
  @@map("company_status")
}

model Document {
  id                  String    @id @default(uuid())
  companyId           String    @map("company_id")
  company             Company   @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  // File info
  name                String
  originalName        String    @map("original_name")
  filePath            String    @map("file_path")
  fileSize            BigInt    @map("file_size")
  mimeType            String    @map("mime_type")
  extension           String?
  
  // Categorization
  category            DocumentCategory?
  documentType        String?   @map("document_type")
  
  // Version control
  version             Int       @default(1)
  parentDocumentId    String?   @map("parent_document_id")
  parentDocument      Document? @relation("DocumentVersions", fields: [parentDocumentId], references: [id])
  versions            Document[] @relation("DocumentVersions")
  isLatestVersion     Boolean   @default(true) @map("is_latest_version")
  
  // Status
  status              DocumentStatus @default(PENDING)
  approvedById        String?   @map("approved_by")
  approvedBy          User?     @relation("ApprovedDocuments", fields: [approvedById], references: [id])
  approvedAt          DateTime? @map("approved_at")
  rejectionReason     String?   @map("rejection_reason")
  
  // Expiry
  issueDate           DateTime? @map("issue_date") @db.Date
  expiryDate          DateTime? @map("expiry_date") @db.Date
  expiryNotified      Boolean   @default(false) @map("expiry_notified")
  
  // Security
  accessLevel         AccessLevel @default(PRIVATE) @map("access_level")
  checksum            String?
  encrypted           Boolean   @default(false)
  
  // Metadata
  description         String?
  tags                String[]
  customMetadata      Json?     @map("custom_metadata")
  
  // OCR
  ocrText             String?   @map("ocr_text")
  ocrProcessed        Boolean   @default(false) @map("ocr_processed")
  
  // Storage
  storageProvider     String    @default("minio") @map("storage_provider")
  storageBucket       String?   @map("storage_bucket")
  storageKey          String?   @map("storage_key")
  
  // Timestamps
  uploadedAt          DateTime  @default(now()) @map("uploaded_at")
  updatedAt           DateTime  @updatedAt @map("updated_at")
  
  // Audit
  uploadedById        String    @map("uploaded_by")
  uploadedBy          User      @relation("DocumentUploader", fields: [uploadedById], references: [id])
  
  // Relations
  comments            Comment[]
  
  @@index([companyId])
  @@index([category])
  @@index([status])
  @@index([expiryDate])
  @@map("documents")
}

enum DocumentCategory {
  LEGAL
  FINANCIAL
  HR
  GOVERNMENT
  CONTRACT
  REPORT
  OTHER
  
  @@map("document_category")
}

enum DocumentStatus {
  PENDING
  APPROVED
  REJECTED
  EXPIRED
  
  @@map("document_status")
}

enum AccessLevel {
  PUBLIC
  INTERNAL
  CONFIDENTIAL
  RESTRICTED
  
  @@map("access_level")
}

// ... المزيد من الـ models
```

---

## 🐳 Docker Structure

```
docker/
├── 📄 Dockerfile.frontend              # Frontend Dockerfile
├── 📄 Dockerfile.backend               # Backend Dockerfile
├── 📄 Dockerfile.nginx                 # Nginx Dockerfile
├── 📄 nginx.conf                       # Nginx configuration
└── 📁 postgres/
    └── 📄 init.sql                     # Database initialization
```

---

## 📜 Scripts Structure

```
scripts/
├── 📄 setup.sh                         # مساعد الإعداد الأولي
├── 📄 seed-db.sh                       # تعبئة قاعدة البيانات
├── 📄 backup-db.sh                     # نسخ احتياطي للقاعدة
├── 📄 restore-db.sh                    # استعادة النسخة الاحتياطية
├── 📄 migrate.sh                       # تشغيل migrations
└── 📄 test.sh                          # تشغيل الاختبارات
```

---

## 📝 Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_APP_NAME="نظام إدارة الشركات والوثائق"
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ENABLE_ANALYTICS=false
```

### Backend (.env)
```env
# Server
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/company_docs"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=company-docs
MINIO_USE_SSL=false

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRY=15m
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRY=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password
EMAIL_FROM=noreply@companydocs.com

# SMS
SMS_PROVIDER=twilio
SMS_API_KEY=
SMS_API_SECRET=

# Security
BCRYPT_ROUNDS=10
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000

# Storage
MAX_FILE_SIZE=52428800
UPLOAD_DIR=./uploads/temp

# OCR
OCR_ENABLED=false
OCR_LANGUAGE=ara

# Virus Scanning
VIRUS_SCAN_ENABLED=false
CLAMAV_HOST=localhost
CLAMAV_PORT=3310
```

---

## 📦 Package.json Examples

### Root package.json (Monorepo)
```json
{
  "name": "company-docs-manager",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "frontend",
    "backend"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
    "dev:frontend": "npm run dev --workspace=frontend",
    "dev:backend": "npm run dev --workspace=backend",
    "build": "npm run build --workspaces",
    "test": "npm run test --workspaces",
    "lint": "npm run lint --workspaces"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

### Frontend package.json
```json
{
  "name": "company-docs-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.4.0",
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.0",
    "@hookform/resolvers": "^3.3.0",
    "axios": "^1.6.0",
    "date-fns": "^2.30.0",
    "framer-motion": "^10.16.0",
    "lucide-react": "^0.294.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0",
    "prettier": "^3.0.0"
  }
}
```

### Backend package.json
```json
{
  "name": "company-docs-backend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "prebuild": "rimraf dist",
    "build": "nest build",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "migrate": "prisma migrate dev",
    "migrate:deploy": "prisma migrate deploy",
    "seed": "ts-node prisma/seed.ts",
    "studio": "prisma studio"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "@nestjs/jwt": "^10.0.0",
    "@nestjs/passport": "^10.0.0",
    "@nestjs/throttler": "^5.0.0",
    "@nestjs/swagger": "^7.0.0",
    "@nestjs/websockets": "^10.0.0",
    "@nestjs/platform-socket.io": "^10.0.0",
    "@nestjs/bull": "^10.0.0",
    "@nestjs/cache-manager": "^2.0.0",
    "passport": "^0.6.0",
    "passport-jwt": "^4.0.0",
    "passport-local": "^1.0.0",
    "bcrypt": "^5.1.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.0",
    "@prisma/client": "^5.0.0",
    "minio": "^7.1.0",
    "bull": "^4.11.0",
    "cache-manager": "^5.2.0",
    "cache-manager-redis-store": "^3.0.0",
    "redis": "^4.6.0",
    "nodemailer": "^6.9.0",
    "winston": "^3.11.0",
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.8.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/express": "^4.17.0",
    "@types/bcrypt": "^5.0.0",
    "@types/passport-jwt": "^3.0.0",
    "@types/passport-local": "^1.0.0",
    "@types/multer": "^1.4.0",
    "@types/node": "^20.0.0",
    "@types/jest": "^29.0.0",
    "@types/supertest": "^2.0.0",
    "typescript": "^5.0.0",
    "ts-node": "^10.9.0",
    "tsconfig-paths": "^4.2.0",
    "prisma": "^5.0.0",
    "jest": "^29.0.0",
    "ts-jest": "^29.0.0",
    "supertest": "^6.3.0",
    "eslint": "^8.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "prettier": "^3.0.0",
    "rimraf": "^5.0.0"
  }
}
```

---

## 🎯 الخلاصة

هذه البنية توفر:

✅ **فصل واضح** بين Frontend و Backend
✅ **قابلية التوسع** لإضافة ميزات جديدة
✅ **تنظيم محكم** للملفات والمجلدات
✅ **سهولة الصيانة** والتطوير
✅ **معايير صناعية** في التنظيم
✅ **TypeScript** في كل مكان لضمان الأمان
✅ **Testing** structure جاهز
✅ **Docker** ready للـ deployment

