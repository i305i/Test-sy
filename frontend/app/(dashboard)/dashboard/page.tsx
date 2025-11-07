'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks';
import { LoadingSpinner } from '@/components/common';
import apiClient from '@/lib/api';
import Link from 'next/link';

interface DashboardStats {
  totalCompanies: number;
  readyCompanies: number;
  inProgressCompanies: number;
  totalDocuments: number;
  recentDocuments: number;
  pendingReviews: number;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  companies: any[];
  activities: any[];
  totalCompanies: number;
  totalDocuments: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    if (user?.role !== 'EMPLOYEE') {
      fetchEmployees();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const data = await apiClient.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      // قيم فارغة في حالة فشل الاتصال
      setStats({
        totalCompanies: 0,
        readyCompanies: 0,
        inProgressCompanies: 0,
        totalDocuments: 0,
        recentDocuments: 0,
        pendingReviews: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      setIsLoadingEmployees(true);
      const data = await apiClient.getEmployeesWithCompanies();
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  const formatActivityTime = (date: string) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffMs = now.getTime() - activityDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `منذ ${diffMins} دقيقة`;
    } else if (diffHours < 24) {
      return `منذ ${diffHours} ساعة`;
    } else if (diffDays < 7) {
      return `منذ ${diffDays} يوم`;
    } else {
      return activityDate.toLocaleDateString('ar-SA');
    }
  };

  const getActivityLabel = (action: string) => {
    const labels: Record<string, string> = {
      COMPANY_CREATED: 'إنشاء شركة',
      COMPANY_UPDATED: 'تحديث شركة',
      DOCUMENT_UPLOADED: 'رفع مستند',
      DOCUMENT_APPROVED: 'الموافقة على مستند',
      DOCUMENT_REJECTED: 'رفض مستند',
      DOCUMENT_DOWNLOADED: 'تحميل مستند',
      COMPANY_SHARED: 'مشاركة شركة',
    };
    return labels[action] || action;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  const statCards = [
    {
      title: 'إجمالي الشركات',
      value: stats?.totalCompanies || 0,
      change: '+12%',
      changeType: 'increase',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      color: 'blue',
    },
    {
      title: 'الشركات الجاهزة',
      value: stats?.readyCompanies || 0,
      change: '+8%',
      changeType: 'increase',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'green',
    },
    {
      title: 'قيد الإنجاز',
      value: stats?.inProgressCompanies || 0,
      change: '-3%',
      changeType: 'decrease',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'yellow',
    },
    {
      title: 'إجمالي المستندات',
      value: stats?.totalDocuments || 0,
      change: '+23%',
      changeType: 'increase',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'purple',
    },
  ];

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800',
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      text: 'text-green-600 dark:text-green-400',
      border: 'border-green-200 dark:border-green-800',
    },
    yellow: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      text: 'text-yellow-600 dark:text-yellow-400',
      border: 'border-yellow-200 dark:border-yellow-800',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      text: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-200 dark:border-purple-800',
    },
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              مرحباً، {user?.firstName} {user?.lastName}! 👋
            </h1>
            <p className="text-blue-100 text-lg">
              إليك نظرة سريعة على نشاطات اليوم
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const colors = colorClasses[stat.color as keyof typeof colorClasses];
          return (
            <div
              key={index}
              className={`${colors.bg} border ${colors.border} rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:scale-105`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${colors.text}`}>{stat.icon}</div>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    stat.changeType === 'increase'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  }`}
                >
                  {stat.change}
                </span>
              </div>
              <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">
                {stat.title}
              </h3>
              <p className={`text-3xl font-bold ${colors.text}`}>{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              إجراءات سريعة
            </h2>
            <div className="space-y-3">
              <Link
                href="/companies/create"
                className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors group"
              >
                <div className="w-10 h-10 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">إضافة شركة جديدة</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">إنشاء ملف شركة</p>
                </div>
              </Link>

              <Link
                href="/documents"
                className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors group"
              >
                <div className="w-10 h-10 bg-green-600 dark:bg-green-500 rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">رفع مستند</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">إضافة وثيقة جديدة</p>
                </div>
              </Link>

              <Link
                href="/reports"
                className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors group"
              >
                <div className="w-10 h-10 bg-purple-600 dark:bg-purple-500 rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">عرض التقارير</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">تحليل البيانات</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                النشاطات الأخيرة
              </h2>
              <Link
                href="/audit-logs"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                عرض الكل
              </Link>
            </div>
            <div className="space-y-4">
              {[
                {
                  type: 'document',
                  title: 'تم رفع مستند جديد',
                  description: 'عقد تأسيس شركة ABC',
                  time: 'منذ ساعة',
                  icon: '📄',
                  color: 'blue',
                },
                {
                  type: 'company',
                  title: 'تم تحديث حالة الشركة',
                  description: 'شركة XYZ أصبحت جاهزة',
                  time: 'منذ ساعتين',
                  icon: '✅',
                  color: 'green',
                },
                {
                  type: 'share',
                  title: 'تمت مشاركة شركة',
                  description: 'شركة DEF مع محمد أحمد',
                  time: 'منذ 3 ساعات',
                  icon: '🔗',
                  color: 'purple',
                },
                {
                  type: 'document',
                  title: 'تم الموافقة على مستند',
                  description: 'السجل التجاري - شركة GHI',
                  time: 'منذ 5 ساعات',
                  icon: '✔️',
                  color: 'green',
                },
              ].map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="text-2xl">{activity.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {activity.title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {activity.description}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Employees Section */}
      {user?.role !== 'EMPLOYEE' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              الموظفين
            </h2>
          </div>
          {isLoadingEmployees ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : employees.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              لا يوجد موظفين
            </p>
          ) : (
            <div className="space-y-4">
              {employees.map((employee) => (
                <div
                  key={employee.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedEmployee?.id === employee.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                  }`}
                  onClick={() => setSelectedEmployee(selectedEmployee?.id === employee.id ? null : employee)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">
                          {employee.firstName[0]}{employee.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {employee.firstName} {employee.lastName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {employee.email}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                          <span>{employee.totalCompanies} شركة</span>
                          <span>•</span>
                          <span>{employee.totalDocuments} مستند</span>
                        </div>
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        selectedEmployee?.id === employee.id ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {selectedEmployee?.id === employee.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                      {/* Companies */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          الشركات ({employee.companies.length})
                        </h3>
                        {employee.companies.length === 0 ? (
                          <p className="text-sm text-gray-500 dark:text-gray-400">لا توجد شركات</p>
                        ) : (
                          <div className="space-y-2">
                            {employee.companies.map((company: any) => (
                              <Link
                                key={company.id}
                                href={`/companies/${company.id}`}
                                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                <div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {company.name}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {company._count.documents} مستند • {company._count.folders} مجلد
                                  </p>
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(company.createdAt).toLocaleDateString('ar-SA')}
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Activities */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          الأنشطة الأخيرة ({employee.activities.length})
                        </h3>
                        {employee.activities.length === 0 ? (
                          <p className="text-sm text-gray-500 dark:text-gray-400">لا توجد أنشطة</p>
                        ) : (
                          <div className="space-y-2">
                            {employee.activities.map((activity: any) => (
                              <div
                                key={activity.id}
                                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                              >
                                <div>
                                  <p className="text-sm text-gray-900 dark:text-white">
                                    {getActivityLabel(activity.action)}
                                  </p>
                                  {activity.details && typeof activity.details === 'object' && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {activity.details.fileName || activity.details.companyName || ''}
                                    </p>
                                  )}
                                </div>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatActivityTime(activity.createdAt)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
