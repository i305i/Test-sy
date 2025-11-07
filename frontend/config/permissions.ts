import { UserRole } from '@/types/user.types';

export enum Permission {
  // Company permissions
  COMPANY_VIEW = 'company:view',
  COMPANY_CREATE = 'company:create',
  COMPANY_UPDATE = 'company:update',
  COMPANY_DELETE = 'company:delete',
  COMPANY_CHANGE_STATUS = 'company:change_status',
  
  // Document permissions
  DOCUMENT_VIEW = 'document:view',
  DOCUMENT_UPLOAD = 'document:upload',
  DOCUMENT_UPDATE = 'document:update',
  DOCUMENT_DELETE = 'document:delete',
  DOCUMENT_DOWNLOAD = 'document:download',
  DOCUMENT_APPROVE = 'document:approve',
  DOCUMENT_REJECT = 'document:reject',
  
  // User permissions
  USER_VIEW = 'user:view',
  USER_CREATE = 'user:create',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_CHANGE_ROLE = 'user:change_role',
  
  // Share permissions
  SHARE_CREATE = 'share:create',
  SHARE_UPDATE = 'share:update',
  SHARE_DELETE = 'share:delete',
  
  // Report permissions
  REPORT_VIEW = 'report:view',
  REPORT_GENERATE = 'report:generate',
  
  // Audit permissions
  AUDIT_VIEW = 'audit:view',
  
  // System permissions
  SYSTEM_SETTINGS = 'system:settings',
  
  // Dashboard permissions
  DASHBOARD_VIEW = 'dashboard:view',
  
  // Settings permissions
  SETTINGS_VIEW = 'settings:view',
}

export const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: [
    // All permissions - Super Admin has everything
    Permission.DASHBOARD_VIEW,
    Permission.COMPANY_VIEW,
    Permission.COMPANY_CREATE,
    Permission.COMPANY_UPDATE,
    Permission.COMPANY_DELETE,
    Permission.COMPANY_CHANGE_STATUS,
    Permission.DOCUMENT_VIEW,
    Permission.DOCUMENT_UPLOAD,
    Permission.DOCUMENT_UPDATE,
    Permission.DOCUMENT_DELETE,
    Permission.DOCUMENT_DOWNLOAD,
    Permission.DOCUMENT_APPROVE,
    Permission.DOCUMENT_REJECT,
    Permission.USER_VIEW,
    Permission.USER_CREATE,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.USER_CHANGE_ROLE,
    Permission.SHARE_CREATE,
    Permission.SHARE_UPDATE,
    Permission.SHARE_DELETE,
    Permission.REPORT_VIEW,
    Permission.REPORT_GENERATE,
    Permission.AUDIT_VIEW,
    Permission.SYSTEM_SETTINGS,
    Permission.SETTINGS_VIEW,
  ],
  [UserRole.ADMIN]: [
    // All permissions
    Permission.DASHBOARD_VIEW,
    Permission.COMPANY_VIEW,
    Permission.COMPANY_CREATE,
    Permission.COMPANY_UPDATE,
    Permission.COMPANY_DELETE,
    Permission.COMPANY_CHANGE_STATUS,
    Permission.DOCUMENT_VIEW,
    Permission.DOCUMENT_UPLOAD,
    Permission.DOCUMENT_UPDATE,
    Permission.DOCUMENT_DELETE,
    Permission.DOCUMENT_DOWNLOAD,
    Permission.DOCUMENT_APPROVE,
    Permission.DOCUMENT_REJECT,
    Permission.USER_VIEW,
    Permission.USER_CREATE,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.USER_CHANGE_ROLE,
    Permission.SHARE_CREATE,
    Permission.SHARE_UPDATE,
    Permission.SHARE_DELETE,
    Permission.REPORT_VIEW,
    Permission.REPORT_GENERATE,
    Permission.AUDIT_VIEW,
    Permission.SYSTEM_SETTINGS,
    Permission.SETTINGS_VIEW,
  ],
  [UserRole.SUPERVISOR]: [
    Permission.DASHBOARD_VIEW,
    Permission.COMPANY_VIEW,
    Permission.COMPANY_CREATE,
    Permission.COMPANY_UPDATE,
    Permission.COMPANY_CHANGE_STATUS,
    Permission.DOCUMENT_VIEW,
    Permission.DOCUMENT_UPLOAD,
    Permission.DOCUMENT_UPDATE,
    Permission.DOCUMENT_DOWNLOAD,
    Permission.DOCUMENT_APPROVE,
    Permission.DOCUMENT_REJECT,
    Permission.USER_VIEW,
    Permission.SHARE_CREATE,
    Permission.SHARE_UPDATE,
    Permission.REPORT_VIEW,
    Permission.REPORT_GENERATE,
    Permission.SETTINGS_VIEW,
  ],
  [UserRole.EMPLOYEE]: [
    Permission.DASHBOARD_VIEW,
    Permission.COMPANY_VIEW,
    Permission.COMPANY_CREATE,
    Permission.COMPANY_UPDATE,
    Permission.DOCUMENT_VIEW,
    Permission.DOCUMENT_UPLOAD,
    Permission.DOCUMENT_UPDATE,
    Permission.DOCUMENT_DOWNLOAD,
    Permission.SHARE_CREATE,
    Permission.SETTINGS_VIEW,
  ],
  [UserRole.AUDITOR]: [
    // Read-only access for auditing
    Permission.DASHBOARD_VIEW,
    Permission.COMPANY_VIEW,
    Permission.DOCUMENT_VIEW,
    Permission.DOCUMENT_DOWNLOAD,
    Permission.USER_VIEW,
    Permission.AUDIT_VIEW,
    Permission.REPORT_VIEW,
    Permission.SETTINGS_VIEW,
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

