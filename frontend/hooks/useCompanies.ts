import { useEffect } from 'react';
import { useCompaniesStore } from '@/store';
import type { CompanyFilters } from '@/types';

export function useCompanies(autoFetch = true) {
  const {
    companies,
    currentCompany,
    filters,
    pagination,
    isLoading,
    error,
    fetchCompanies,
    fetchCompany,
    setFilters,
    setPage,
    clearCurrentCompany,
    clearError,
  } = useCompaniesStore();

  useEffect(() => {
    if (autoFetch) {
      fetchCompanies();
    }
  }, [autoFetch, fetchCompanies]);

  const updateFilters = (newFilters: Partial<CompanyFilters>) => {
    setFilters(newFilters);
  };

  const goToPage = (page: number) => {
    setPage(page);
  };

  const nextPage = () => {
    if (pagination.page < pagination.totalPages) {
      setPage(pagination.page + 1);
    }
  };

  const previousPage = () => {
    if (pagination.page > 1) {
      setPage(pagination.page - 1);
    }
  };

  return {
    companies,
    currentCompany,
    filters,
    pagination,
    isLoading,
    error,
    fetchCompanies,
    fetchCompany,
    updateFilters,
    goToPage,
    nextPage,
    previousPage,
    clearCurrentCompany,
    clearError,
  };
}

