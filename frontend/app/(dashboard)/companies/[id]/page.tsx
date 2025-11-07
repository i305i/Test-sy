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
  const [shares, setShares] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [permissionLevel, setPermissionLevel] = useState('VIEW');
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    fetchCompany();
    if (activeTab === 'shares') {
      fetchShares();
      fetchEmployees();
    }
  }, [resolvedParams.id, activeTab]);

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

  const fetchShares = async () => {
    try {
      const data = await apiClient.getCompanyShares(resolvedParams.id);
      setShares(data);
    } catch (error) {
      console.error('Error fetching shares:', error);
      setShares([]);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await apiClient.getUsers({ limit: 100 });
      // Filter employees only
      const allUsers = response.items || [];
      const employeeList = allUsers.filter((u: any) => u.role === 'EMPLOYEE');
      console.log('Fetched employees:', employeeList);
      setEmployees(employeeList);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    }
  };

  const handleShare = async () => {
    if (!selectedEmployeeId) {
      showToast('الرجاء اختيار موظف', 'error');
      return;
    }

    try {
      setIsSharing(true);
      await apiClient.shareCompany(resolvedParams.id, {
        sharedWithUserId: selectedEmployeeId,
        permissionLevel,
      });
      showToast('تم مشاركة الشركة بنجاح', 'success');
      setShowShareModal(false);
      setSelectedEmployeeId('');
      setPermissionLevel('VIEW');
      fetchShares();
      fetchCompany();
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'فشل في مشاركة الشركة', 'error');
    } finally {
      setIsSharing(false);
    }
  };

  const handleRevokeShare = async (shareId: string) => {
    if (!confirm('هل أنت متأكد من إلغاء المشاركة؟')) return;

    try {
      await apiClient.revokeShare(shareId);
      showToast('تم إلغاء المشاركة بنجاح', 'success');
      fetchShares();
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'فشل في إلغاء المشاركة', 'error');
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
              {company.commercialRegistration || 'لا يوجد'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <CompanyStatusBadge status={company.status} />
            <select
              value={company.status}
              onChange={async (e) => {
                try {
                  setIsLoading(true);
                  await apiClient.updateCompany(company.id, { status: e.target.value });
                  showToast('تم تحديث حالة الشركة بنجاح', 'success');
                  fetchCompany();
                } catch (error: any) {
                  showToast(error.response?.data?.error?.message || 'فشل في تحديث الحالة', 'error');
                } finally {
                  setIsLoading(false);
                }
              }}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              <option value="IN_PROGRESS">قيد الإنجاز</option>
              <option value="READY">جاهزة</option>
              <option value="ON_HOLD">متوقفة</option>
              <option value="ARCHIVED">مؤرشفة</option>
            </select>
          </div>
          <button
            onClick={async () => {
              try {
                setIsLoading(true);
                await apiClient.downloadAllCompanyFiles(company.id);
                showToast('تم بدء تحميل الملفات', 'success');
              } catch (error: any) {
                console.error('Error downloading files:', error);
                showToast(error.response?.data?.error?.message || 'فشل في تحميل الملفات', 'error');
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={isLoading || (company._count?.documents || 0) === 0}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            تحميل جميع الملفات ({company.name})
          </button>
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
                    {company.commercialRegistration || 'لا يوجد'}
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
            <div className="space-y-6">
              {/* Share Button */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  الموظفين المشاركين ({shares.length})
                </h3>
                <button
                  onClick={() => setShowShareModal(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  مشاركة مع موظف
                </button>
              </div>

              {/* Shares List */}
              {shares.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p>لا توجد مشاركات حالياً</p>
                  <p className="text-sm mt-2">ابدأ بمشاركة الشركة مع الموظفين</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {shares.map((share) => (
                    <div
                      key={share.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-400 font-bold">
                            {share.sharedWithUser?.firstName?.[0]}{share.sharedWithUser?.lastName?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {share.sharedWithUser?.firstName} {share.sharedWithUser?.lastName}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {share.sharedWithUser?.email}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              share.permissionLevel === 'VIEW' 
                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                : share.permissionLevel === 'EDIT'
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            }`}>
                              {share.permissionLevel === 'VIEW' ? 'عرض فقط' : 
                               share.permissionLevel === 'EDIT' ? 'تعديل' : 'إدارة كاملة'}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              منذ {new Date(share.createdAt).toLocaleDateString('ar-SA')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={share.permissionLevel}
                          onChange={async (e) => {
                            try {
                              await apiClient.updateSharePermission(share.id, e.target.value);
                              showToast('تم تحديث الصلاحيات بنجاح', 'success');
                              fetchShares();
                            } catch (error: any) {
                              showToast(error.response?.data?.error?.message || 'فشل تحديث الصلاحيات', 'error');
                            }
                          }}
                          className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="VIEW">عرض فقط</option>
                          <option value="EDIT">تعديل</option>
                          <option value="MANAGE">إدارة كاملة</option>
                        </select>
                        <button
                          onClick={() => handleRevokeShare(share.id)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="إلغاء المشاركة"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              قريباً: سجل النشاط
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  مشاركة الشركة مع موظف
                </h3>
                <button
                  onClick={() => {
                    setShowShareModal(false);
                    setSelectedEmployeeId('');
                    setPermissionLevel('VIEW');
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  اختر الموظف <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">اختر موظف</option>
                  {employees
                    .filter(emp => !shares.some(s => s.sharedWithUserId === emp.id && s.status === 'ACTIVE'))
                    .map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.firstName} {employee.lastName} ({employee.email})
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  مستوى الصلاحية <span className="text-red-500">*</span>
                </label>
                <select
                  value={permissionLevel}
                  onChange={(e) => setPermissionLevel(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="VIEW">عرض فقط - يمكنه عرض المستندات فقط</option>
                  <option value="EDIT">تعديل - يمكنه رفع وتعديل المستندات</option>
                  <option value="MANAGE">إدارة كاملة - جميع الصلاحيات</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowShareModal(false);
                    setSelectedEmployeeId('');
                    setPermissionLevel('VIEW');
                  }}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleShare}
                  disabled={isSharing || !selectedEmployeeId}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSharing ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      جاري المشاركة...
                    </>
                  ) : (
                    'مشاركة'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

