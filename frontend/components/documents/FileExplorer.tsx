'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { LoadingSpinner } from '@/components/common';
import { useToast } from '@/components/common';
import { UploadDocumentModal } from './UploadDocumentModal';
import { DocumentPreviewModal } from './DocumentPreviewModal';

interface Folder {
  id: string;
  name: string;
  path: string;
  createdAt: string;
  _count: {
    children: number;
    documents: number;
  };
}

interface Document {
  id: string;
  title: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
  uploadedBy: {
    firstName: string;
    lastName: string;
  };
}

interface FileExplorerProps {
  companyId: string;
  companyName: string;
  initialFolderId?: string | null;
}

export function FileExplorer({ companyId, companyName, initialFolderId = null }: FileExplorerProps) {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(initialFolderId);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: 'folder' | 'document'; id: string } | null>(null);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [folderTree, setFolderTree] = useState<any[]>([]);
  const [previewDocument, setPreviewDocument] = useState<any | null>(null);

  useEffect(() => {
    fetchFolderContents();
    fetchFolderTree();
  }, [currentFolderId, companyId]);

  const fetchFolderContents = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getFolderContents(companyId, currentFolderId);
      setFolders(data.folders || []);
      setDocuments(data.documents || []);
      setBreadcrumbs(data.breadcrumbs || []);
    } catch (error) {
      console.error('Error fetching folder contents:', error);
      showToast('فشل في جلب محتويات المجلد', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFolderTree = async () => {
    try {
      const tree = await apiClient.getFolderTree(companyId);
      setFolderTree(tree);
    } catch (error) {
      console.error('Error fetching folder tree:', error);
    }
  };

  const handleFolderClick = (folderId: string) => {
    setCurrentFolderId(folderId);
    setSelectedItems(new Set());
  };

  const handleBreadcrumbClick = (folderId: string | null) => {
    setCurrentFolderId(folderId);
    setSelectedItems(new Set());
  };

  const handleDocumentClick = async (documentId: string) => {
    try {
      const doc = documents.find(d => d.id === documentId);
      if (doc) {
        setPreviewDocument(doc);
      }
    } catch (error) {
      showToast('فشل في فتح المستند', 'error');
    }
  };

  const handleContextMenu = (e: React.MouseEvent, type: 'folder' | 'document', id: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type,
      id,
    });
  };

  const handleCreateFolder = async (name: string) => {
    try {
      await apiClient.createFolder(companyId, name, currentFolderId);
      showToast('تم إنشاء المجلد بنجاح', 'success');
      fetchFolderContents();
      fetchFolderTree();
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'فشل في إنشاء المجلد', 'error');
    }
  };

  const handleDelete = async (type: 'folder' | 'document', id: string) => {
    if (!confirm(`هل أنت متأكد من حذف هذا ${type === 'folder' ? 'المجلد' : 'المستند'}؟`)) {
      return;
    }

    try {
      if (type === 'folder') {
        await apiClient.deleteFolder(id);
      } else {
        await apiClient.deleteDocument(companyId, id);
      }
      showToast('تم الحذف بنجاح', 'success');
      fetchFolderContents();
      if (type === 'folder') {
        fetchFolderTree();
      }
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'فشل في الحذف', 'error');
    }
  };

  const handleDownload = async (documentId: string) => {
    try {
      const { url } = await apiClient.getDocumentDownloadUrl(documentId);
      const link = document.createElement('a');
      link.href = url;
      link.download = '';
      link.click();
      showToast('جاري التحميل...', 'success');
    } catch (error) {
      showToast('فشل في تحميل المستند', 'error');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFileIcon = (mimeType: string): string => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('image')) return '🖼️';
    return '📎';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Sidebar - Folder Tree */}
      <div className="w-64 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 overflow-y-auto">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          المجلدات
        </h3>
        
        <button
          onClick={() => setCurrentFolderId(null)}
          className={`w-full text-right px-3 py-2 rounded-lg mb-2 transition-colors ${
            currentFolderId === null
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          🏢 {companyName}
        </button>
        
        <FolderTreeView
          folders={folderTree}
          currentFolderId={currentFolderId}
          onFolderClick={handleFolderClick}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-4">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.id || 'root'} className="flex items-center gap-2">
                {index > 0 && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                )}
                <button
                  onClick={() => handleBreadcrumbClick(crumb.id)}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {index === 0 ? `🏢 ${companyName}` : crumb.name}
                </button>
              </div>
            ))}
          </div>

          {/* Actions Bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNewFolderModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                مجلد جديد
              </button>
              
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                رفع ملف
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث..."
                  className="w-64 px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 border border-gray-300 dark:border-gray-600 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'list'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
          {folders.length === 0 && documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-gray-500 dark:text-gray-400">
              <svg className="w-20 h-20 mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <p className="text-lg font-medium mb-2">هذا المجلد فارغ</p>
              <p className="text-sm">ابدأ بإنشاء مجلد أو رفع ملف</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {/* Folders */}
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  onDoubleClick={() => handleFolderClick(folder.id)}
                  onContextMenu={(e) => handleContextMenu(e, 'folder', folder.id)}
                  className="group bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 p-4 cursor-pointer transition-all hover:shadow-lg"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="text-5xl mb-3">📁</div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate w-full mb-1">
                      {folder.name}
                    </p>
                    <div className="flex items-center justify-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      {folder._count?.children > 0 && (
                        <span className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                          <span>📁</span>
                          <span className="font-medium">{folder._count.children} مجلد</span>
                        </span>
                      )}
                      {folder._count?.documents > 0 && (
                        <span className="flex items-center gap-1 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                          <span>📄</span>
                          <span className="font-medium">{folder._count.documents} ملف</span>
                        </span>
                      )}
                      {folder._count?.children === 0 && folder._count?.documents === 0 && (
                        <span className="text-gray-400 italic">فارغ</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Documents */}
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  onDoubleClick={() => handleDocumentClick(doc.id)}
                  onContextMenu={(e) => handleContextMenu(e, 'document', doc.id)}
                  className="group bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-400 p-4 cursor-pointer transition-all hover:shadow-lg"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="text-5xl mb-3">{getFileIcon(doc.mimeType)}</div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate w-full mb-1" title={doc.title}>
                      {doc.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(doc.fileSize)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">الاسم</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">النوع</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">الحجم</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">التاريخ</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Folders */}
                  {folders.map((folder) => (
                    <tr
                      key={folder.id}
                      onDoubleClick={() => handleFolderClick(folder.id)}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                    >
                      <td className="px-4 py-3 flex items-center gap-3">
                        <span className="text-2xl">📁</span>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{folder.name}</span>
                          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {folder._count?.children > 0 && (
                              <span className="flex items-center gap-1">
                                <span>📁</span>
                                <span>{folder._count.children} مجلد</span>
                              </span>
                            )}
                            {folder._count?.documents > 0 && (
                              <span className="flex items-center gap-1">
                                <span>📄</span>
                                <span>{folder._count.documents} ملف</span>
                              </span>
                            )}
                            {folder._count?.children === 0 && folder._count?.documents === 0 && (
                              <span>فارغ</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">مجلد</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {folder._count?.children > 0 && `${folder._count.children} مجلد`}
                        {folder._count?.children > 0 && folder._count?.documents > 0 && ' • '}
                        {folder._count?.documents > 0 && `${folder._count.documents} ملف`}
                        {folder._count?.children === 0 && folder._count?.documents === 0 && 'فارغ'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{formatDate(folder.createdAt)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete('folder', folder.id);
                          }}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* Documents */}
                  {documents.map((doc) => (
                    <tr
                      key={doc.id}
                      onDoubleClick={() => handleDocumentClick(doc.id)}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                    >
                      <td className="px-4 py-3 flex items-center gap-3">
                        <span className="text-2xl">{getFileIcon(doc.mimeType)}</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{doc.title}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">مستند</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{formatFileSize(doc.fileSize)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{formatDate(doc.createdAt)}</td>
                      <td className="px-4 py-3 flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(doc.id);
                          }}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete('document', doc.id);
                          }}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showNewFolderModal && (
        <NewFolderModal
          onClose={() => setShowNewFolderModal(false)}
          onCreate={handleCreateFolder}
        />
      )}

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

      {/* Document Preview Modal */}
      {previewDocument && (
        <DocumentPreviewModal
          isOpen={!!previewDocument}
          onClose={() => setPreviewDocument(null)}
          document={previewDocument}
        />
      )}
    </div>
  );
}

// Folder Tree Component
function FolderTreeView({ folders, currentFolderId, onFolderClick }: any) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFolder = (folder: any, level: number = 0) => {
    const hasChildren = folder.children && folder.children.length > 0;
    const isExpanded = expandedFolders.has(folder.id);
    const isCurrent = currentFolderId === folder.id;

    return (
      <div key={folder.id}>
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-1 cursor-pointer transition-colors ${
            isCurrent
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
          style={{ paddingRight: `${12 + level * 16}px` }}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(folder.id);
              }}
              className="w-4 h-4 flex items-center justify-center"
            >
              <svg
                className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" />
              </svg>
            </button>
          )}
          <button
            onClick={() => onFolderClick(folder.id)}
            className="flex items-center gap-2 flex-1 text-sm"
          >
            <span>📁</span>
            <span className="truncate">{folder.name}</span>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              {folder._count?.children > 0 && (
                <span className="flex items-center gap-1">
                  <span>📁</span>
                  <span>{folder._count.children}</span>
                </span>
              )}
              {folder._count?.documents > 0 && (
                <span className="flex items-center gap-1">
                  <span>📄</span>
                  <span>{folder._count.documents}</span>
                </span>
              )}
            </div>
          </button>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {folder.children.map((child: any) => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {folders.map((folder: any) => renderFolder(folder))}
    </div>
  );
}

// New Folder Modal
function NewFolderModal({ onClose, onCreate }: any) {
  const [folderName, setFolderName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (folderName.trim()) {
      onCreate(folderName.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">إنشاء مجلد جديد</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <input
            type="text"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="اسم المجلد"
            autoFocus
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
          />
          <div className="flex gap-3 justify-end mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={!folderName.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              إنشاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

