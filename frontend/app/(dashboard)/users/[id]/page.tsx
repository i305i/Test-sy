'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import apiClient from '@/lib/api';
import { LoadingSpinner } from '@/components/common';
import { useToast } from '@/components/common';
import { useAuthStore } from '@/store';
import type { User, UserRole } from '@/types/user.types';

export default function UserDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const { showToast } = useToast();
  const { user: currentUser } = useAuthStore();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'EMPLOYEE' as UserRole,
    status: 'ACTIVE',
  });

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      setIsLoading(true);
      const userData = await apiClient.getUser(userId);
      setUser(userData);
      setFormData({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        role: userData.role,
        status: userData.status,
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      showToast('فشل في تحميل بيانات المستخدم', 'error');
      router.push('/users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      await apiClient.updateUser(userId, formData);
      showToast('تم تحديث بيانات المستخدم بنجاح! ✅', 'success');
      setIsEditing(false);
      fetchUser();
    } catch (error: any) {
      console.error('Error updating user:', error);
      showToast(error.response?.data?.error?.message || 'فشل في تحديث المستخدم', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (userId === currentUser?.id) {
      showToast('لا يمكنك حذف حسابك الخاص', 'error');
      return;
    }

    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;

    try {
      await apiClient.deleteUser(userId);
      showToast('تم حذف المستخدم بنجاح', 'success');
      router.push('/users');
    } catch (error) {
      showToast('فشل حذف المستخدم', 'error');
    }
  };

  const getRoleBadge = (role: UserRole) => {
    const badges: Record<UserRole, { label: string; className: string; icon: string }> = {
      SUPER_ADMIN: {
        label: 'مدير عام',
        className: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
        icon: '🔴',
      },
      ADMIN: {
        label: 'مدير',
        className: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
        icon: '👑',
      },
      SUPERVISOR: {
        label: 'مشرف',
        className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
        icon: '👨‍💼',
      },
      EMPLOYEE: {
        label: 'موظف',
        className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
        icon: '👷',
      },
      AUDITOR: {
        label: 'مدقق',
        className: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
        icon: '🔍',
      },
    };
    return badges[role];
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      ACTIVE: { label: 'نشط', className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
      INACTIVE: { label: 'غير نشط', className: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' },
      SUSPENDED: { label: 'موقوف', className: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
    };
    return badges[status] || badges.ACTIVE;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const roleBadge = getRoleBadge(user.role);
  const statusBadge = getStatusBadge(user.status);
  const isCurrentUser = user.id === currentUser?.id;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          رجوع
        </button>
      </div>

      {/* User Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header Banner */}
        <div className="h-32 bg-gradient-to-r from-blue-600 to-purple-600"></div>

        {/* Profile Section */}
        <div className="px-8 pb-8">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between -mt-16 mb-6">
            <div className="flex items-end gap-4">
              {/* Avatar */}
              <div className="w-32 h-32 bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-5xl shadow-2xl border-4 border-white dark:border-gray-800">
                {(user.firstName || 'A').charAt(0)}{(user.lastName || 'B').charAt(0)}
              </div>

              {/* Name & Title */}
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {user.firstName} {user.lastName}
                  </h1>
                  {isCurrentUser && (
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-medium rounded-full">
                      أنت
                    </span>
                  )}
                </div>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  {user.email}
                </p>
                <div className="flex gap-2 mt-2">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full ${roleBadge.className}`}>
                    <span>{roleBadge.icon}</span>
                    {roleBadge.label}
                  </span>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusBadge.className}`}>
                    {statusBadge.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4 md:mt-0">
              {!isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    تعديل
                  </button>
                  {!isCurrentUser && (
                    <button
                      onClick={handleDelete}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-red-500/30 hover:shadow-red-500/50"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      حذف
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        role: user.role,
                        status: user.status,
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/30 hover:shadow-green-500/50"
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
                </>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  المعلومات الشخصية
                </h2>

                {!isEditing ? (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 space-y-4">
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">الاسم الأول</label>
                      <p className="text-gray-900 dark:text-white font-medium mt-1">{user.firstName}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">اسم العائلة</label>
                      <p className="text-gray-900 dark:text-white font-medium mt-1">{user.lastName}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">البريد الإلكتروني</label>
                      <p className="text-gray-900 dark:text-white font-medium mt-1">{user.email}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        الاسم الأول
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        اسم العائلة
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        البريد الإلكتروني
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Role & Status */}
              {isEditing && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    الصلاحيات والحالة
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        الدور الوظيفي
                      </label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="EMPLOYEE">👷 موظف</option>
                        <option value="SUPERVISOR">👨‍💼 مشرف</option>
                        <option value="ADMIN">👑 مدير</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        الحالة
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="ACTIVE">نشط</option>
                        <option value="INACTIVE">غير نشط</option>
                        <option value="SUSPENDED">موقوف</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Account Info */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">معلومات الحساب</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">معرف المستخدم</span>
                    <p className="text-gray-900 dark:text-white font-mono mt-1 text-xs break-all">
                      {user.id}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">تاريخ الانضمام</span>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {new Date(user.createdAt).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">آخر تحديث</span>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {new Date(user.updatedAt).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">💡 نصيحة</h3>
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  يمكنك تعديل معلومات المستخدم والصلاحيات من خلال الضغط على زر "تعديل"
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

