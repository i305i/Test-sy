'use client';

import Link from 'next/link';
import { CompanyStatusBadge } from './CompanyStatusBadge';
import type { Company } from '@/types';

interface CompanyCardProps {
  company: Pick<Company, 'id' | 'name' | 'companyType' | 'status' | 'description' | 'registrationNumber' | '_count' | 'createdAt'>;
}

export function CompanyCard({ company }: CompanyCardProps) {
  const companyTypeLabels: Record<string, string> = {
    LLC: 'شركة ذات مسؤولية محدودة',
    SOLE_PROPRIETORSHIP: 'مؤسسة فردية',
    PARTNERSHIP: 'شركة تضامنية',
    CORPORATION: 'شركة مساهمة',
    OTHER: 'أخرى',
  };

  return (
    <Link href={`/companies/${company.id}`}>
      <div className="group bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-110 transition-transform">
              {company.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {company.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {company.registrationNumber || 'بدون رقم تسجيل'}
              </p>
            </div>
          </div>
          <CompanyStatusBadge status={company.status} />
        </div>

        {/* Company Type */}
        {company.companyType && (
          <div className="mb-4">
            <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-lg">
              {companyTypeLabels[company.companyType] || company.companyType}
            </span>
          </div>
        )}

        {/* Description */}
        {company.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
            {company.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{company._count?.documents || 0} مستند</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>{company._count?.shares || 0} مشاركة</span>
          </div>
        </div>

        {/* View Details Button */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 font-medium group-hover:translate-x-2 transition-transform">
            <span>عرض التفاصيل</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default CompanyCard;
