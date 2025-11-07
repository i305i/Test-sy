import { create } from 'zustand';
import apiClient from '@/lib/api';
import type { Company, CompanyFilters, PaginatedResponse } from '@/types';

interface CompaniesState {
  companies: Company[];
  currentCompany: Company | null;
  filters: CompanyFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  isLoading: boolean;
  error: string | null;
  fetchCompanies: () => Promise<void>;
  fetchCompany: (id: string) => Promise<void>;
  setFilters: (filters: Partial<CompanyFilters>) => void;
  setPage: (page: number) => void;
  clearCurrentCompany: () => void;
  clearError: () => void;
}

export const useCompaniesStore = create<CompaniesState>((set, get) => ({
  companies: [],
  currentCompany: null,
  filters: {},
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  isLoading: false,
  error: null,

  fetchCompanies: async () => {
    set({ isLoading: true, error: null });
    try {
      const { filters, pagination } = get();
      const response: PaginatedResponse<Company> = await apiClient.getCompanies({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      });

      set({
        companies: response.items,
        pagination: {
          page: response.meta.page,
          limit: response.meta.limit,
          total: response.meta.total,
          totalPages: response.meta.totalPages,
        },
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error?.message || 'فشل في تحميل الشركات',
        isLoading: false,
      });
    }
  },

  fetchCompany: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const company = await apiClient.getCompany(id);
      set({ currentCompany: company, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.error?.message || 'فشل في تحميل بيانات الشركة',
        isLoading: false,
      });
    }
  },

  setFilters: (newFilters: Partial<CompanyFilters>) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      pagination: { ...state.pagination, page: 1 }, // Reset to page 1 when filters change
    }));
    get().fetchCompanies();
  },

  setPage: (page: number) => {
    set((state) => ({
      pagination: { ...state.pagination, page },
    }));
    get().fetchCompanies();
  },

  clearCurrentCompany: () => set({ currentCompany: null }),

  clearError: () => set({ error: null }),
}));

