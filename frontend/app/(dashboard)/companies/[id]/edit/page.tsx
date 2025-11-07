'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { useToast } from '@/components/common';
import { LoadingSpinner } from '@/components/common';
import Link from 'next/link';

interface EditCompanyProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditCompanyPage({ params }: EditCompanyProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    companyType: 'LLC',
    commercialRegistration: '',
  });

  useEffect(() => {
    fetchCompany();
  }, [resolvedParams.id]);

  const fetchCompany = async () => {
    try {
      setIsLoading(true);
      const company = await apiClient.getCompany(resolvedParams.id);
      setFormData({
        name: company.name || '',
        companyType: company.companyType || 'LLC',
        commercialRegistration: company.commercialRegistration || '',
      });
    } catch (error) {
      console.error('Error fetching company:', error);
      showToast('فشل في جلب بيانات الشركة', 'error');
      router.push(`/companies/${resolvedParams.id}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await apiClient.updateCompany(resolvedParams.id, {
        name: formData.name,
        companyType: formData.companyType,
        commercialRegistration: formData.commercialRegistration.trim() || undefined,
      });
      showToast('تم تحديث الشركة بنجاح! ✅', 'success');
      setTimeout(() => {
        router.push(`/companies/${resolvedParams.id}`);
      }, 500);
    } catch (error: any) {
      console.error('Error updating company:', error);
      showToast(error.response?.data?.error?.message || 'فشل في تحديث الشركة', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/companies/${resolvedParams.id}`}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            تعديل الشركة
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            تحديث بيانات الشركة
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 space-y-6">
        {/* Basic Information */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            المعلومات الأساسية
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                اسم الشركة <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="مثال: شركة التقنية المتقدمة"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                نوع الشركة <span className="text-red-500">*</span>
              </label>
              <select
                name="companyType"
                required
                value={formData.companyType}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="INDIVIDUAL">مؤسسة فردية</option>
                <option value="PARTNERSHIP">شركة تضامنية</option>
                <option value="LLC">شركة ذات مسؤولية محدودة</option>
                <option value="PUBLIC_COMPANY">شركة مساهمة عامة</option>
                <option value="PRIVATE_COMPANY">شركة مساهمة خاصة</option>
                <option value="NON_PROFIT">مؤسسة غير ربحية</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                رقم السجل التجاري
              </label>
              <input
                type="text"
                name="commercialRegistration"
                value={formData.commercialRegistration}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="اتركه فارغاً إذا لم يكن متوفراً"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                إذا تركت الحقل فارغاً، سيظهر "لا يوجد"
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Link
            href={`/companies/${resolvedParams.id}`}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            إلغاء
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                جاري الحفظ...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                حفظ التغييرات
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

