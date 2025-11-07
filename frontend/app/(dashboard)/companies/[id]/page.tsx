'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { LoadingSpinner } from '@/components/common';
import { CompanyStatusBadge } from '@/components/companies';
import { useToast } from '@/components/common';
import { FileExplorer } from '@/components/documents';
import Link from 'next/link';

interface CompanyDetailsProps {
  params: Promise<{
    id: string;
  }>;
}

export default function CompanyDetailsPage({ params }: CompanyDetailsProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { showToast } = useToast();
  const [company, setCompany] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchCompany();
  }, [resolvedParams.id]);

  const fetchCompany = async () => {
    try {
      const data = await apiClient.getCompany(resolvedParams.id);
      setCompany(data);
    } catch (error) {
      console.error('Error fetching company:', error);
      showToast('فشل في جلب بيانات الشركة', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('هل أنت متأكد من حذف هذه الشركة؟')) return;

    try {
      await apiClient.deleteCompany(resolvedParams.id);
      showToast('تم حذف الشركة بنجاح', 'success');
      router.push('/companies');
    } catch (error) {
      showToast('فشل في حذف الشركة', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          الشركة غير موجودة
        </h2>
        <Link href="/companies" className="text-blue-600 hover:underline mt-4 inline-block">
          العودة للقائمة
        </Link>
      </div>
    );
  }

  const companyTypeLabels: Record<string, string> = {
    LLC: 'شركة ذات مسؤولية محدودة',
    SOLE_PROPRIETORSHIP: 'مؤسسة فردية',
    PARTNERSHIP: 'شركة تضامنية',
    CORPORATION: 'شركة مساهمة',
    OTHER: 'أخرى',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/companies"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {company.name}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {company.commercialRegistration}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <CompanyStatusBadge status={company.status} />
          <Link
            href={`/companies/${company.id}/edit`}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            تعديل
          </Link>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            حذف
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">المستندات</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {company._count?.documents || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">المشاركات</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {company._count?.shares || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">التعليقات</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {company._count?.comments || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">آخر تحديث</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                {new Date(company.updatedAt).toLocaleDateString('ar-SA')}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-8 px-6">
            {[
              { id: 'overview', label: 'نظرة عامة', icon: '📋' },
              { id: 'documents', label: 'المستندات', icon: '📄' },
              { id: 'shares', label: 'المشاركات', icon: '🔗' },
              { id: 'activity', label: 'النشاط', icon: '🕒' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <span className="ml-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    نوع الشركة
                  </label>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {companyTypeLabels[company.companyType] || company.companyType}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    رقم السجل التجاري
                  </label>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {company.commercialRegistration}
                  </p>
                </div>
                {company.taxNumber && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      الرقم الضريبي
                    </label>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {company.taxNumber}
                    </p>
                  </div>
                )}
                {company.primaryPhone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      رقم الهاتف
                    </label>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {company.primaryPhone}
                    </p>
                  </div>
                )}
                {company.primaryEmail && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      البريد الإلكتروني
                    </label>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {company.primaryEmail}
                    </p>
                  </div>
                )}
                {company.website && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      الموقع الإلكتروني
                    </label>
                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                      {company.website}
                    </a>
                  </div>
                )}
              </div>

              {/* Location */}
              {(company.street || company.district || company.city || company.country) && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    الموقع
                  </label>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {[company.street, company.district, company.city, company.country].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}

              {/* Description */}
              {company.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    الوصف
                  </label>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {company.description}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="h-[600px]">
              <FileExplorer companyId={company.id} companyName={company.name} />
            </div>
          )}

          {activeTab === 'shares' && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              قريباً: قائمة المشاركات
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              قريباً: سجل النشاط
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

