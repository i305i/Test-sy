export enum CompanyStatus {
  READY = 'READY',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  ARCHIVED = 'ARCHIVED',
  INCOMPLETE = 'INCOMPLETE', // Legacy support
  CANCELLED = 'CANCELLED', // Legacy support
}

export enum CompanyType {
  LLC = 'LLC',
  CORPORATION = 'CORPORATION',
  PARTNERSHIP = 'PARTNERSHIP',
  SOLE_PROPRIETORSHIP = 'SOLE_PROPRIETORSHIP',
}

export interface Company {
  id: string;
  name: string;
  description?: string;
  status: CompanyStatus;
  companyType?: CompanyType;
  registrationNumber?: string;
  taxId?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string;
  ownerId: string;
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  _count: {
    documents: number;
    shares: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CompanyFilters {
  status?: CompanyStatus;
  search?: string;
  ownerId?: string;
  companyType?: CompanyType;
}

export interface CreateCompanyInput {
  name: string;
  description?: string;
  companyType?: CompanyType;
  registrationNumber?: string;
  taxId?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface UpdateCompanyInput {
  name?: string;
  description?: string;
  status?: CompanyStatus;
  companyType?: CompanyType;
  registrationNumber?: string;
  taxId?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

