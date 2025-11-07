import { useAuthStore } from '@/store';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '@/config/permissions';
import type { Permission } from '@/config/permissions';
import type { UserRole } from '@/types';

export function useAuth() {
  const { user, isAuthenticated, isLoading, login, logout, clearError, error } = useAuthStore();

  const checkPermission = (permission: Permission): boolean => {
    if (!user) return false;
    return hasPermission(user.role as UserRole, permission);
  };

  const checkAnyPermission = (permissions: Permission[]): boolean => {
    if (!user) return false;
    return hasAnyPermission(user.role as UserRole, permissions);
  };

  const checkAllPermissions = (permissions: Permission[]): boolean => {
    if (!user) return false;
    return hasAllPermissions(user.role as UserRole, permissions);
  };

  const isAdmin = user?.role === 'ADMIN';
  const isSupervisor = user?.role === 'SUPERVISOR';
  const isEmployee = user?.role === 'EMPLOYEE';

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    clearError,
    checkPermission,
    checkAnyPermission,
    checkAllPermissions,
    isAdmin,
    isSupervisor,
    isEmployee,
  };
}

