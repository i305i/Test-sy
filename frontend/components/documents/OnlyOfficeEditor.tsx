'use client';

import { useEffect, useRef, useState } from 'react';
import apiClient from '@/lib/api';
import { useToast } from '@/components/common';
import { LoadingSpinner } from '@/components/common';

interface OnlyOfficeEditorProps {
  documentId: string;
  mode?: 'edit' | 'view';
  onClose?: () => void;
  onSave?: () => void;
}

declare global {
  interface Window {
    DocsAPI: any;
  }
}

export function OnlyOfficeEditor({
  documentId,
  mode = 'edit',
  onClose,
  onSave,
}: OnlyOfficeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    loadEditorConfig();
    loadOnlyOfficeScript();

    return () => {
      // Cleanup editor instance
      if (editorInstanceRef.current) {
        try {
          editorInstanceRef.current.destroyEditor();
        } catch (e) {
          console.error('Error destroying editor:', e);
        }
      }
    };
  }, [documentId, mode]);

  const loadOnlyOfficeScript = () => {
    // Check if script is already loaded
    if (window.DocsAPI) {
      return;
    }

    const script = document.createElement('script');
    script.src = process.env.NEXT_PUBLIC_ONLYOFFICE_DOCUMENT_SERVER_URL 
      ? `${process.env.NEXT_PUBLIC_ONLYOFFICE_DOCUMENT_SERVER_URL}/web-apps/apps/api/documents/api.js`
      : 'http://localhost:8080/web-apps/apps/api/documents/api.js';
    
    script.async = true;
    script.onload = () => {
      console.log('OnlyOffice script loaded');
    };
    script.onerror = () => {
      setError('فشل تحميل محرر OnlyOffice. تأكد من تشغيل OnlyOffice Document Server.');
      setIsLoading(false);
    };
    document.head.appendChild(script);
  };

  const loadEditorConfig = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const editorConfig = await apiClient.getOnlyOfficeConfig(documentId, mode);
      setConfig(editorConfig);
      
      // Wait for OnlyOffice script to load
      const checkScript = setInterval(() => {
        if (window.DocsAPI && editorRef.current) {
          clearInterval(checkScript);
          initializeEditor(editorConfig);
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkScript);
        if (!window.DocsAPI) {
          setError('فشل تحميل محرر OnlyOffice. تأكد من تشغيل OnlyOffice Document Server.');
          setIsLoading(false);
        }
      }, 10000);
    } catch (err: any) {
      console.error('Error loading editor config:', err);
      setError(err.response?.data?.error?.message || 'فشل في تحميل إعدادات المحرر');
      setIsLoading(false);
    }
  };

  const initializeEditor = (editorConfig: any) => {
    if (!window.DocsAPI || !editorRef.current) {
      return;
    }

    try {
      // Destroy existing editor if any
      if (editorInstanceRef.current) {
        editorInstanceRef.current.destroyEditor();
      }

      // Create new editor instance
      editorInstanceRef.current = new window.DocsAPI.DocEditor(
        editorRef.current,
        {
          ...editorConfig,
          events: {
            onDocumentReady: () => {
              console.log('Document ready');
              setIsLoading(false);
              showToast('تم تحميل المستند بنجاح', 'success');
            },
            onError: (event: any) => {
              console.error('Editor error:', event);
              setError('حدث خطأ في المحرر');
              setIsLoading(false);
            },
            onDocumentStateChange: (event: any) => {
              console.log('Document state changed:', event);
            },
            onInfo: (event: any) => {
              console.log('Editor info:', event);
            },
            onWarning: (event: any) => {
              console.warn('Editor warning:', event);
            },
            onRequestSave: (event: any) => {
              console.log('Request save:', event);
              // OnlyOffice will handle saving via callback URL
            },
            onRequestClose: () => {
              console.log('Request close');
              if (onClose) {
                onClose();
              }
            },
            onSave: (event: any) => {
              console.log('Document saved:', event);
              showToast('تم حفظ المستند بنجاح', 'success');
              if (onSave) {
                onSave();
              }
            },
            onSaveAs: (event: any) => {
              console.log('Save as:', event);
            },
            onDownloadAs: (event: any) => {
              console.log('Download as:', event);
            },
            onMetaChange: (event: any) => {
              console.log('Meta changed:', event);
            },
            onWarning: (event: any) => {
              console.warn('Warning:', event);
            },
          },
        }
      );
    } catch (err: any) {
      console.error('Error initializing editor:', err);
      setError('فشل في تهيئة المحرر');
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 max-w-md w-full">
          <div className="flex items-start gap-4">
            <svg
              className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
                خطأ في تحميل المحرر
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mb-4">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  loadEditorConfig();
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
              >
                إعادة المحاولة
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            محرر المستندات
          </h2>
          {mode === 'edit' && (
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
              وضع التحرير
            </span>
          )}
          {mode === 'view' && (
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium">
              وضع العرض فقط
            </span>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="إغلاق"
          >
            <svg
              className="w-5 h-5 text-gray-600 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Editor Container */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-10">
            <div className="text-center">
              <LoadingSpinner />
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                جاري تحميل المحرر...
              </p>
            </div>
          </div>
        )}
        <div
          ref={editorRef}
          className="w-full h-full"
          style={{ minHeight: '600px' }}
        />
      </div>
    </div>
  );
}

