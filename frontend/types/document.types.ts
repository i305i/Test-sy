export enum DocumentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export enum DocumentCategory {
  LICENSE = 'LICENSE',
  CONTRACT = 'CONTRACT',
  FINANCIAL = 'FINANCIAL',
  LEGAL = 'LEGAL',
  OPERATIONAL = 'OPERATIONAL',
  OTHER = 'OTHER',
}

export enum AccessLevel {
  PUBLIC = 'PUBLIC',
  INTERNAL = 'INTERNAL',
  CONFIDENTIAL = 'CONFIDENTIAL',
  RESTRICTED = 'RESTRICTED',
}

export interface Document {
  id: string;
  title: string;
  description?: string;
  category: DocumentCategory;
  status: DocumentStatus;
  accessLevel: AccessLevel;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  companyId: string;
  company?: {
    id: string;
    name: string;
  };
  uploadedById: string;
  uploadedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  expiryDate?: string;
  version: number;
  parentDocumentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentFilters {
  companyId?: string;
  category?: DocumentCategory;
  status?: DocumentStatus;
  search?: string;
}

export interface UploadDocumentInput {
  title: string;
  description?: string;
  category: DocumentCategory;
  companyId: string;
  expiryDate?: string;
  accessLevel?: AccessLevel;
}

