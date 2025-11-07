import { UserRole } from '@/types/user.types';

export interface Route {
  name: string;
  path: string;
  icon?: string;
  allowedRoles?: UserRole[];
  children?: Route[];
}

export const routes: Route[] = [
  {
    name: 'لوحة التحكم',
    path: '/dashboard',
    icon: 'home',
    allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.EMPLOYEE, UserRole.AUDITOR],
  },
  {
    name: 'الشركات',
    path: '/companies',
    icon: 'building',
    allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.EMPLOYEE, UserRole.AUDITOR],
  },
  {
    name: 'المستندات',
    path: '/documents',
    icon: 'file',
    allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.EMPLOYEE, UserRole.AUDITOR],
  },
  {
    name: 'المستخدمين',
    path: '/users',
    icon: 'users',
    allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.AUDITOR],
  },
  {
    name: 'الإعدادات',
    path: '/settings',
    icon: 'settings',
    allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.EMPLOYEE, UserRole.AUDITOR],
  },
];

export const authRoutes = {
  login: '/login',
  register: '/register',
};

export const publicRoutes = [authRoutes.login, authRoutes.register];

export const defaultRedirect = {
  [UserRole.SUPER_ADMIN]: '/dashboard',
  [UserRole.ADMIN]: '/dashboard',
  [UserRole.SUPERVISOR]: '/dashboard',
  [UserRole.EMPLOYEE]: '/dashboard',
  [UserRole.AUDITOR]: '/dashboard',
};

// Route paths object for easy access
export const ROUTES = {
  DASHBOARD: '/dashboard',
  COMPANIES: {
    LIST: '/companies',
    CREATE: '/companies/create',
    DETAIL: (id: string) => `/companies/${id}`,
  },
  DOCUMENTS: {
    LIST: '/documents',
  },
  USERS: {
    LIST: '/users',
    CREATE: '/users/create',
    DETAIL: (id: string) => `/users/${id}`,
  },
  SETTINGS: '/settings',
  LOGIN: '/login',
  REGISTER: '/register',
};

