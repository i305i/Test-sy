import { 
  CompanyStatus, 
  CompanyType, 
  DocumentStatus, 
  DocumentCategory,
  AccessLevel,
  PermissionLevel,
  UserRole,
  UserStatus,
  NotificationType 
} from '@/types';

export const COMPANY_STATUS_LABELS: Record<CompanyStatus, string> = {
  [CompanyStatus.READY]: 'جاهز',
  [CompanyStatus.IN_PROGRESS]: 'قيد العمل',
  [CompanyStatus.ON_HOLD]: 'معلق',
  [CompanyStatus.ARCHIVED]: 'مؤرشف',
  [CompanyStatus.INCOMPLETE]: 'غير مكتمل',
  [CompanyStatus.CANCELLED]: 'ملغي',
};

export const COMPANY_STATUS_COLORS: Record<CompanyStatus, string> = {
  [CompanyStatus.READY]: 'green',
  [CompanyStatus.IN_PROGRESS]: 'yellow',
  [CompanyStatus.ON_HOLD]: 'gray',
  [CompanyStatus.ARCHIVED]: 'blue',
  [CompanyStatus.INCOMPLETE]: 'orange',
  [CompanyStatus.CANCELLED]: 'red',
};

export const COMPANY_TYPE_LABELS: Record<CompanyType, string> = {
  [CompanyType.LLC]: 'شركة ذات مسؤولية محدودة',
  [CompanyType.CORPORATION]: 'شركة مساهمة',
  [CompanyType.PARTNERSHIP]: 'شركة تضامن',
  [CompanyType.SOLE_PROPRIETORSHIP]: 'مؤسسة فردية',
};

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  [DocumentStatus.PENDING]: 'قيد المراجعة',
  [DocumentStatus.APPROVED]: 'معتمد',
  [DocumentStatus.REJECTED]: 'مرفوض',
  [DocumentStatus.EXPIRED]: 'منتهي الصلاحية',
};

export const DOCUMENT_STATUS_COLORS: Record<DocumentStatus, string> = {
  [DocumentStatus.PENDING]: 'yellow',
  [DocumentStatus.APPROVED]: 'green',
  [DocumentStatus.REJECTED]: 'red',
  [DocumentStatus.EXPIRED]: 'gray',
};

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  [DocumentCategory.LICENSE]: 'رخصة',
  [DocumentCategory.CONTRACT]: 'عقد',
  [DocumentCategory.FINANCIAL]: 'مالي',
  [DocumentCategory.LEGAL]: 'قانوني',
  [DocumentCategory.OPERATIONAL]: 'تشغيلي',
  [DocumentCategory.OTHER]: 'أخرى',
};

export const ACCESS_LEVEL_LABELS: Record<AccessLevel, string> = {
  [AccessLevel.PUBLIC]: 'عام',
  [AccessLevel.INTERNAL]: 'داخلي',
  [AccessLevel.CONFIDENTIAL]: 'سري',
  [AccessLevel.RESTRICTED]: 'محدود',
};

export const PERMISSION_LEVEL_LABELS: Record<PermissionLevel, string> = {
  [PermissionLevel.VIEW]: 'عرض فقط',
  [PermissionLevel.EDIT]: 'تعديل',
  [PermissionLevel.ADMIN]: 'إدارة كاملة',
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'مدير عام',
  [UserRole.ADMIN]: 'مدير',
  [UserRole.SUPERVISOR]: 'مشرف',
  [UserRole.EMPLOYEE]: 'موظف',
  [UserRole.AUDITOR]: 'مدقق',
};

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  [UserStatus.ACTIVE]: 'نشط',
  [UserStatus.INACTIVE]: 'غير نشط',
  [UserStatus.SUSPENDED]: 'موقوف',
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  [NotificationType.DOCUMENT_UPLOADED]: 'تم رفع وثيقة جديدة',
  [NotificationType.DOCUMENT_APPROVED]: 'تم اعتماد وثيقة',
  [NotificationType.DOCUMENT_REJECTED]: 'تم رفض وثيقة',
  [NotificationType.COMPANY_SHARED]: 'تمت مشاركة شركة معك',
  [NotificationType.COMMENT_ADDED]: 'تعليق جديد',
  [NotificationType.STATUS_CHANGED]: 'تغيير في الحالة',
  [NotificationType.DOCUMENT_EXPIRING]: 'وثيقة قريبة من الانتهاء',
  [NotificationType.SYSTEM]: 'إشعار النظام',
};

export const FILE_TYPE_ICONS: Record<string, string> = {
  'application/pdf': '📄',
  'image/jpeg': '🖼️',
  'image/png': '🖼️',
  'application/msword': '📝',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
  'application/vnd.ms-excel': '📊',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
};

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  COMPANIES: '/companies',
  COMPANY_DETAIL: (id: string) => `/companies/${id}`,
  COMPANY_NEW: '/companies/new',
  DOCUMENTS: '/documents',
  DOCUMENT_DETAIL: (id: string) => `/documents/${id}`,
  USERS: '/users',
  USER_DETAIL: (id: string) => `/users/${id}`,
  USER_NEW: '/users/new',
  REPORTS: '/reports',
  SETTINGS: '/settings',
  SETTINGS_PROFILE: '/settings/profile',
  SETTINGS_SYSTEM: '/settings/system',
  AUDIT_LOGS: '/audit-logs',
} as const;

