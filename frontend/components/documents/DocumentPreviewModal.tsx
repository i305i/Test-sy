'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api';
import { FileIcon } from './FileIcon';
import { getFileTypeLabel, formatFileSize } from '@/lib/file-utils';
import { LoadingSpinner } from '@/components/common';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: any;
}

export function DocumentPreviewModal({ isOpen, onClose, document }: DocumentPreviewModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && document) {
      loadPreview();
    }
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [isOpen, document]);

  const loadPreview = async () => {
    setIsLoading(true);
    try {
      // إنشاء One-Time Token آمن للمعاينة عبر ApiClient
      const { url } = await apiClient.getDocumentPreviewUrl(document.id);
      
      // استخدام URL الآمن (Proxy من الباك إند - One-Time Use)
      setPreviewUrl(url);
    } catch (error) {
      console.error('Error loading preview:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecureDownload = async () => {
    try {
      // إنشاء One-Time Token آمن للتحميل عبر ApiClient
      const { url } = await apiClient.getDocumentDownloadUrl(document.id);
      
      // تحميل الملف عبر URL آمن (One-Time Use)
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('فشل في تحميل الملف. الرجاء المحاولة مرة أخرى.');
    }
  };

  if (!isOpen) return null;

  const canPreview = () => {
    const previewableTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'text/plain',
    ];
    return previewableTypes.includes(document?.mimeType);
  };

  const renderPreview = () => {
    if (!canPreview()) {
      return (
        <div className="flex flex-col items-center justify-center h-full space-y-4 text-gray-500 dark:text-gray-400">
          <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg font-medium">المعاينة غير متاحة لهذا النوع من الملفات</p>
          <p className="text-sm">يمكنك تحميل الملف لعرضه</p>
          <a
            href={document.downloadUrl}
            download={document.originalName}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            تحميل الملف
          </a>
        </div>
      );
    }

    if (!previewUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-full space-y-4 text-gray-500 dark:text-gray-400">
          <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg font-medium">فشل تحميل المعاينة</p>
          <p className="text-sm">الرجاء المحاولة مرة أخرى أو تحميل الملف</p>
          <a
            href={document.downloadUrl}
            download={document.originalName}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            تحميل الملف
          </a>
        </div>
      );
    }

    if (document.mimeType === 'application/pdf') {
      return (
        <iframe
          src={previewUrl}
          className="w-full h-full rounded-lg"
          title={document.name}
        />
      );
    }

    if (document.mimeType.startsWith('image/')) {
      return (
        <div className="flex items-center justify-center h-full p-4">
          <img
            src={previewUrl}
            alt={document.name}
            className="max-w-full max-h-full object-contain rounded-lg"
            onError={(e) => {
              console.error('Error loading image:', e);
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
      );
    }

    if (document.mimeType === 'text/plain') {
      return (
        <iframe
          src={previewUrl}
          className="w-full h-full rounded-lg bg-white dark:bg-gray-900"
          title={document.name}
        />
      );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-6xl h-[90vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
              <FileIcon mimeType={document?.mimeType} className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {document?.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatFileSize(document?.fileSize)} • {getFileTypeLabel(document?.mimeType)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSecureDownload}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="تحميل آمن (One-Time)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="h-[calc(100%-5rem)] overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <LoadingSpinner />
            </div>
          ) : (
            renderPreview()
          )}
        </div>
      </div>
    </div>
  );
}

