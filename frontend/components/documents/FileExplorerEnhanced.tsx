'use client';

import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api';
import { LoadingSpinner, useToast } from '@/components/common';
import { UploadDocumentModal } from './UploadDocumentModal';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { OnlyOfficeEditor } from './OnlyOfficeEditor';
import { FileIcon } from './FileIcon';
import { getFileTypeLabel, getFileColor, formatFileSize, formatDate, isOnlyOfficeSupported, canEditDocument } from '@/lib/file-utils';
import { useAuthStore } from '@/store';

interface FileExplorerProps {
  companyId: string;
  companyName: string;
  initialFolderId?: string | null;
}

export function FileExplorer({ companyId, companyName, initialFolderId = null }: FileExplorerProps) {
  const { showToast } = useToast();
  const { user: currentUser } = useAuthStore();
  
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(initialFolderId);
  const [folders, setFolders] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<any | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [documentShares, setDocumentShares] = useState<Record<string, any[]>>({});
  const [documentsSharedByMe, setDocumentsSharedByMe] = useState<Record<string, any[]>>({});
  const [showShareModal, setShowShareModal] = useState<{ documentId: string; companyId: string } | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [permissionLevel, setPermissionLevel] = useState('VIEW');
  const [isSharing, setIsSharing] = useState(false);
  const [editingDocument, setEditingDocument] = useState<any | null>(null);

  useEffect(() => {
    fetchFolderContents();
    fetchEmployees();
  }, [currentFolderId, companyId]);

  useEffect(() => {
    // Fetch shares for all documents
    if (documents.length > 0) {
      documents.forEach(doc => {
        fetchDocumentShares(doc.id);
      });
    }
    // Fetch documents shared by current user
    fetchDocumentsSharedByMe();
  }, [documents, companyId]);

  const fetchFolderContents = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getFolderContents(companyId, currentFolderId);
      setFolders(data.folders || []);
      setDocuments(data.documents || []);
      
      // تحديث breadcrumbs لتبدأ باسم الشركة
      const updatedBreadcrumbs = data.breadcrumbs || [];
      if (updatedBreadcrumbs.length > 0 && updatedBreadcrumbs[0].id === null) {
        updatedBreadcrumbs[0].name = companyName;
      }
      setBreadcrumbs(updatedBreadcrumbs);
    } catch (error) {
      showToast('فشل في جلب محتويات المجلد', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await apiClient.getUsers({ limit: 100 });
      const allUsers = response.items || [];
      const employeeList = allUsers.filter((u: any) => u.role === 'EMPLOYEE');
      setEmployees(employeeList);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    }
  };

  const fetchDocumentShares = async (documentId: string) => {
    try {
      const shares = await apiClient.getDocumentShares(companyId, documentId);
      setDocumentShares(prev => ({
        ...prev,
        [documentId]: shares,
      }));
    } catch (error) {
      console.error('Error fetching document shares:', error);
    }
  };

  const handleShareDocument = async () => {
    if (!showShareModal || !selectedEmployeeId) return;

    try {
      setIsSharing(true);
      await apiClient.shareDocument(showShareModal.companyId, showShareModal.documentId, {
        sharedWithUserId: selectedEmployeeId,
        permissionLevel,
      });
      showToast('تم مشاركة المستند بنجاح', 'success');
      await fetchDocumentShares(showShareModal.documentId);
      setShowShareModal(null);
      setSelectedEmployeeId('');
      setPermissionLevel('VIEW');
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'فشل في مشاركة المستند', 'error');
    } finally {
      setIsSharing(false);
    }
  };

  const canManageShare = (document: any) => {
    if (!currentUser) return false;
    return (
      currentUser.role === 'ADMIN' ||
      currentUser.role === 'SUPERVISOR' ||
      document.uploadedById === currentUser.id
    );
  };

  const getMyShare = (documentId: string) => {
    if (!currentUser) return null;
    const shares = documentShares[documentId] || [];
    return shares.find((s: any) => s.sharedWithUserId === currentUser.id);
  };

  const fetchDocumentsSharedByMe = async () => {
    try {
      const sharedDocs = await apiClient.getDocumentsSharedByMe(companyId);
      const sharedMap: Record<string, any[]> = {};
      sharedDocs.forEach((item: any) => {
        const docId = item.document.id;
        if (!sharedMap[docId]) {
          sharedMap[docId] = [];
        }
        sharedMap[docId].push(item);
      });
      setDocumentsSharedByMe(sharedMap);
    } catch (error) {
      console.error('Error fetching documents shared by me:', error);
    }
  };

  const getSharedByMeInfo = (documentId: string) => {
    const shared = documentsSharedByMe[documentId];
    if (!shared || shared.length === 0) return null;
    // Return the first share (or combine all if needed)
    return shared[0];
  };

  // Drag & Drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    // رفع الملفات
    for (const file of files) {
      try {
        await apiClient.uploadDocument(file, {
          companyId,
          folderId: currentFolderId,
          category: 'OTHER',
          description: '',
        });
      } catch (error: any) {
        showToast(`فشل رفع ${file.name}`, 'error');
      }
    }
    
    showToast(`تم رفع ${files.length} ملف بنجاح`, 'success');
    fetchFolderContents();
  }, [companyId, currentFolderId]);

  const handleFolderClick = (folderId: string) => {
    setCurrentFolderId(folderId);
  };

  const handleBreadcrumbClick = (folderId: string | null) => {
    setCurrentFolderId(folderId);
  };

  const handleDocumentPreview = (document: any) => {
    setPreviewDocument(document);
  };

  const handleEditDocument = (document: any) => {
    // Check if file is supported and user can edit
    if (!isOnlyOfficeSupported(document.mimeType)) {
      showToast('نوع الملف غير مدعوم للتحرير', 'error');
      return;
    }

    if (!canEditDocument(document, currentUser?.id || '', currentUser?.role || '')) {
      showToast('ليس لديك صلاحية لتعديل هذا المستند', 'error');
      return;
    }

    setEditingDocument(document);
  };

  const handleDocumentDownload = async (doc: any) => {
    try {
      const blob = await apiClient.downloadDocument(doc.id, companyId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.originalName || doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast('تم تحميل المستند بنجاح', 'success');
    } catch (error: any) {
      console.error('Download error:', error);
      showToast(error.response?.data?.error?.message || 'فشل في تحميل المستند', 'error');
    }
  };

  const handleCreateFolder = async (name: string) => {
    try {
      await apiClient.createFolder(companyId, name, currentFolderId);
      showToast('تم إنشاء المجلد بنجاح ✅', 'success');
      fetchFolderContents();
      setShowNewFolderModal(false);
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'فشل في إنشاء المجلد', 'error');
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المجلد وجميع محتوياته؟')) return;

    try {
      await apiClient.deleteFolder(folderId);
      showToast('تم حذف المجلد بنجاح', 'success');
      fetchFolderContents();
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'فشل في حذف المجلد', 'error');
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستند؟')) return;

    try {
      await apiClient.deleteDocument(companyId, documentId);
      showToast('تم حذف المستند بنجاح', 'success');
      fetchFolderContents();
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'فشل في حذف المستند', 'error');
    }
  };

  const handleReplaceDocument = async (documentId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        await apiClient.replaceDocument(companyId, documentId, file);
        showToast('تم استبدال الملف بنجاح', 'success');
        fetchFolderContents();
      } catch (error: any) {
        showToast(error.response?.data?.error?.message || 'فشل في استبدال الملف', 'error');
      }
    };
    input.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Toolbar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 mb-4 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.id || 'root'} className="flex items-center gap-2">
              {index > 0 && (
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              )}
              <button
                onClick={() => handleBreadcrumbClick(crumb.id)}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
              >
                {index === 0 ? `🏢 ${crumb.name}` : crumb.name}
              </button>
            </div>
          ))}
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNewFolderModal(true)}
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              مجلد جديد
            </button>

            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              رفع ملف
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Content Area with Drag & Drop */}
      <div
        className={`flex-1 p-6 overflow-y-auto relative ${
          isDragging ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-dashed border-blue-400' : ''
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-50/90 dark:bg-blue-900/90 z-10 pointer-events-none">
            <div className="text-center">
              <svg className="w-20 h-20 mx-auto text-blue-600 dark:text-blue-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-xl font-semibold text-blue-600 dark:text-blue-400">أفلت الملفات هنا للرفع</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {folders.length === 0 && documents.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <svg className="w-24 h-24 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <p className="text-lg font-medium mb-2">هذا المجلد فارغ</p>
            <p className="text-sm">ابدأ بإضافة ملفات أو مجلدات جديدة</p>
          </div>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && (folders.length > 0 || documents.length > 0) && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {/* Folders */}
            {folders.map((folder) => (
              <div
                key={folder.id}
                className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer"
              >
                <div onClick={() => handleFolderClick(folder.id)}>
                  <div className="flex flex-col items-center text-center">
                    <svg className="w-16 h-16 text-blue-500 dark:text-blue-400 mb-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate w-full">{folder.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {folder._count?.documents || 0} ملف
                    </p>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFolder(folder.id);
                    }}
                    className="p-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}

            {/* Documents */}
            {documents.map((doc) => {
              const colorClass = getFileColor(doc.mimeType);
              const myShare = getMyShare(doc.id);
              const sharedByMe = getSharedByMeInfo(doc.id);
              const shares = documentShares[doc.id] || [];
              const canManage = canManageShare(doc);
              return (
                <div
                  key={doc.id}
                  className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer"
                  onClick={() => handleDocumentPreview(doc)}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-16 h-16 rounded-xl ${colorClass} flex items-center justify-center mb-2`}>
                      <FileIcon mimeType={doc.mimeType} className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate w-full" title={doc.name}>
                      {doc.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatFileSize(doc.fileSize)} • {getFileTypeLabel(doc.mimeType)}
                    </p>
                    {/* Share Info - Shared with me */}
                    {myShare && (
                      <div className="mt-2 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-600 dark:text-blue-400">
                        <span className="font-medium">مشارك معك</span>
                        <span className="block text-xs mt-0.5">
                          من: {myShare.sharedByUser?.firstName} {myShare.sharedByUser?.lastName}
                        </span>
                      </div>
                    )}
                    {/* Share Info - Shared by me */}
                    {sharedByMe && (
                      <div className="mt-2 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-lg text-xs text-green-600 dark:text-green-400">
                        <span className="font-medium">تم مشاركته من قبل</span>
                        <span className="block text-xs mt-0.5">
                          مع: {sharedByMe.sharedWith?.firstName} {sharedByMe.sharedWith?.lastName}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    {canManage && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowShareModal({ documentId: doc.id, companyId });
                        }}
                        className="p-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                        title="مشاركة"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                      </button>
                    )}
                    {isOnlyOfficeSupported(doc.mimeType) && canEditDocument(doc, currentUser?.id || '', currentUser?.role || '') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditDocument(doc);
                        }}
                        className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                        title="تحرير"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDocumentDownload(doc);
                      }}
                      className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                      title="تحميل"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                    {canManage && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReplaceDocument(doc.id);
                          }}
                          className="p-1.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                          title="استبدال"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-5-4l-5 5m0 0l-5-5m5 5V3" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDocument(doc.id);
                          }}
                          className="p-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                          title="حذف"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (folders.length > 0 || documents.length > 0) && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">الاسم</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">النوع</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">الحجم</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">التاريخ</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {/* Folders */}
                {folders.map((folder) => (
                  <tr
                    key={folder.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                    onClick={() => handleFolderClick(folder.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <svg className="w-8 h-8 text-blue-500 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{folder.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">مجلد</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">—</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDate(folder.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFolder(folder.id);
                        }}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}

                {/* Documents */}
                {documents.map((doc) => {
                  const myShare = getMyShare(doc.id);
                  const sharedByMe = getSharedByMeInfo(doc.id);
                  const canManage = canManageShare(doc);
                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                      onClick={() => handleDocumentPreview(doc)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg ${getFileColor(doc.mimeType)} flex items-center justify-center`}>
                            <FileIcon mimeType={doc.mimeType} className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{doc.name}</span>
                            {myShare && (
                              <div className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                                مشارك معك من: {myShare.sharedByUser?.firstName} {myShare.sharedByUser?.lastName}
                              </div>
                            )}
                            {sharedByMe && (
                              <div className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                                تم مشاركته من قبل مع: {sharedByMe.sharedWith?.firstName} {sharedByMe.sharedWith?.lastName}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{getFileTypeLabel(doc.mimeType)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatFileSize(doc.fileSize)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDate(doc.uploadedAt)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3 space-x-reverse">
                        {canManage && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowShareModal({ documentId: doc.id, companyId });
                            }}
                            className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                          >
                            مشاركة
                          </button>
                        )}
                        {isOnlyOfficeSupported(doc.mimeType) && canEditDocument(doc, currentUser?.id || '', currentUser?.role || '') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditDocument(doc);
                            }}
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                          >
                            تحرير
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDocumentDownload(doc);
                          }}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        >
                          تحميل
                        </button>
                        {canManage && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReplaceDocument(doc.id);
                              }}
                              className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                            >
                              استبدال
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDocument(doc.id);
                              }}
                              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                            >
                              حذف
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showUploadModal && (
        <UploadDocumentModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          companyId={companyId}
          folderId={currentFolderId}
          onSuccess={() => {
            fetchFolderContents();
            setShowUploadModal(false);
          }}
        />
      )}

      {showNewFolderModal && (
        <NewFolderModal
          isOpen={showNewFolderModal}
          onClose={() => setShowNewFolderModal(false)}
          onCreate={handleCreateFolder}
        />
      )}

      {previewDocument && (
        <DocumentPreviewModal
          isOpen={!!previewDocument}
          onClose={() => setPreviewDocument(null)}
          document={previewDocument}
        />
      )}

      {/* OnlyOffice Editor Modal */}
      {editingDocument && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
            <OnlyOfficeEditor
              documentId={editingDocument.id}
              mode="edit"
              onClose={() => {
                setEditingDocument(null);
                fetchFolderContents(); // Refresh to show updated document
              }}
              onSave={() => {
                fetchFolderContents(); // Refresh after save
              }}
            />
          </div>
        </div>
      )}

      {/* Share Document Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  مشاركة المستند
                </h3>
                <button
                  onClick={() => {
                    setShowShareModal(null);
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
                    .filter(emp => {
                      const shares = documentShares[showShareModal.documentId] || [];
                      return !shares.some(s => s.sharedWithUserId === emp.id && s.status === 'ACTIVE');
                    })
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
                  <option value="VIEW">عرض فقط - يمكنه عرض المستند فقط</option>
                  <option value="EDIT">تعديل - يمكنه تعديل المستند</option>
                  <option value="MANAGE">إدارة كاملة - جميع الصلاحيات</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowShareModal(null);
                    setSelectedEmployeeId('');
                    setPermissionLevel('VIEW');
                  }}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleShareDocument}
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

// New Folder Modal Component
function NewFolderModal({
  isOpen,
  onClose,
  onCreate,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}) {
  const [folderName, setFolderName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (folderName.trim()) {
      onCreate(folderName.trim());
      setFolderName('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">إنشاء مجلد جديد</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="اسم المجلد"
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={!folderName.trim()}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-xl transition-colors"
            >
              إنشاء
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

