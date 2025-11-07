import { useAuth } from './useAuth';
import type { Permission } from '@/config/permissions';

export function usePermissions() {
  const { checkPermission, checkAnyPermission, checkAllPermissions } = useAuth();

  const can = (permission: Permission): boolean => {
    return checkPermission(permission);
  };

  const canAny = (permissions: Permission[]): boolean => {
    return checkAnyPermission(permissions);
  };

  const canAll = (permissions: Permission[]): boolean => {
    return checkAllPermissions(permissions);
  };

  return {
    can,
    canAny,
    canAll,
  };
}

