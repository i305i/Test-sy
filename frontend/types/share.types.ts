export enum PermissionLevel {
  VIEW = 'VIEW',
  EDIT = 'EDIT',
  ADMIN = 'ADMIN',
}

export interface Share {
  id: string;
  companyId: string;
  company?: {
    id: string;
    name: string;
  };
  sharedWithId: string;
  sharedWith?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  sharedById: string;
  sharedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  permissionLevel: PermissionLevel;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShareInput {
  companyId: string;
  sharedWithId: string;
  permissionLevel: PermissionLevel;
  expiresAt?: string;
}

export interface UpdateSharePermissionInput {
  permissionLevel: PermissionLevel;
}

