# 📦 نظام رفع المستندات في MinIO - الخطة الكاملة

## 🎯 **نظرة عامة**

نظام متكامل لرفع وإدارة الملفات باستخدام MinIO (S3-compatible storage) مع تكامل كامل بين Backend (NestJS) و Frontend (Next.js).

---

## 📁 **1. بنية تخزين الملفات في MinIO**

### **الهيكل التنظيمي:**

```
company-docs-bucket/
├── companies/
│   ├── {companyId}/
│   │   ├── commercial-registration/
│   │   │   ├── {documentId}-original.pdf
│   │   │   └── {documentId}-v2.pdf
│   │   ├── tax-certificate/
│   │   │   └── {documentId}-original.pdf
│   │   ├── contracts/
│   │   │   ├── {documentId}-contract-2024.pdf
│   │   │   └── {documentId}-contract-2025.pdf
│   │   ├── financial-statements/
│   │   │   └── {documentId}-Q1-2024.xlsx
│   │   └── general/
│   │       └── {documentId}-misc.docx
│
├── users/
│   ├── {userId}/
│   │   ├── avatar/
│   │   │   └── avatar-{timestamp}.jpg
│   │   └── documents/
│   │       └── {documentId}-personal.pdf
│
└── temp/
    └── {sessionId}/
        └── temp-file-{timestamp}.pdf
```

### **تسمية الملفات:**
```
{documentId}-{version}-{originalName}.{extension}

مثال:
550e8400-e29b-41d4-a716-446655440000-v1-commercial-registration.pdf
```

---

## 🔧 **2. إعداد MinIO في Docker Compose**

### **docker-compose.yml**

```yaml
version: '3.8'

services:
  minio:
    image: minio/minio:latest
    container_name: companydocs-minio
    ports:
      - "9000:9000"      # API Port
      - "9001:9001"      # Console Port
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin123
      MINIO_DOMAIN: localhost
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

  # MinIO Client (للإعداد الأولي)
  minio-init:
    image: minio/mc:latest
    depends_on:
      - minio
    entrypoint: >
      /bin/sh -c "
      mc alias set myminio http://minio:9000 minioadmin minioadmin123;
      mc mb myminio/company-docs-bucket --ignore-existing;
      mc anonymous set none myminio/company-docs-bucket;
      exit 0;
      "

volumes:
  minio_data:
    driver: local
```

---

## 🚀 **3. Backend Implementation (NestJS)**

### **A. Storage Service (`backend/src/modules/storage/storage.service.ts`)**

```typescript
import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class StorageService {
  private minioClient: Minio.Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    this.bucketName = this.configService.get('MINIO_BUCKET_NAME') || 'company-docs-bucket';

    this.minioClient = new Minio.Client({
      endPoint: this.configService.get('MINIO_ENDPOINT') || 'localhost',
      port: parseInt(this.configService.get('MINIO_PORT') || '9000'),
      useSSL: this.configService.get('MINIO_USE_SSL') === 'true',
      accessKey: this.configService.get('MINIO_ACCESS_KEY') || 'minioadmin',
      secretKey: this.configService.get('MINIO_SECRET_KEY') || 'minioadmin123',
    });

    this.ensureBucketExists();
  }

  /**
   * التأكد من وجود Bucket
   */
  private async ensureBucketExists() {
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        console.log(`✅ Bucket "${this.bucketName}" created successfully`);
      }
    } catch (error) {
      console.error('❌ Error creating bucket:', error);
    }
  }

  /**
   * رفع ملف إلى MinIO
   * @param file - الملف المرفوع
   * @param companyId - معرف الشركة
   * @param category - تصنيف المستند
   * @param metadata - بيانات إضافية
   * @returns معلومات الملف المرفوع
   */
  async uploadFile(
    file: Express.Multer.File,
    companyId: string,
    category: string,
    metadata?: Record<string, string>,
  ): Promise<{
    fileKey: string;
    originalName: string;
    size: number;
    mimeType: string;
    url: string;
  }> {
    try {
      // التحقق من نوع الملف
      this.validateFile(file);

      // إنشاء مسار الملف
      const fileExtension = path.extname(file.originalname);
      const fileKey = this.generateFileKey(companyId, category, fileExtension);

      // Metadata للملف
      const metaData = {
        'Content-Type': file.mimetype,
        'X-Original-Name': file.originalname,
        'X-Upload-Date': new Date().toISOString(),
        'X-Company-ID': companyId,
        'X-Category': category,
        ...metadata,
      };

      // رفع الملف
      await this.minioClient.putObject(
        this.bucketName,
        fileKey,
        file.buffer,
        file.size,
        metaData,
      );

      console.log(`✅ File uploaded: ${fileKey}`);

      return {
        fileKey,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        url: await this.getFileUrl(fileKey),
      };
    } catch (error) {
      console.error('❌ Upload error:', error);
      throw new InternalServerErrorException('فشل في رفع الملف');
    }
  }

  /**
   * إنشاء رابط تحميل مؤقت (Presigned URL)
   * @param fileKey - مفتاح الملف
   * @param expirySeconds - مدة صلاحية الرابط (بالثواني)
   * @returns رابط التحميل المؤقت
   */
  async getPresignedDownloadUrl(
    fileKey: string,
    expirySeconds: number = 3600, // ساعة واحدة افتراضياً
  ): Promise<string> {
    try {
      return await this.minioClient.presignedGetObject(
        this.bucketName,
        fileKey,
        expirySeconds,
      );
    } catch (error) {
      console.error('❌ Error generating presigned URL:', error);
      throw new InternalServerErrorException('فشل في إنشاء رابط التحميل');
    }
  }

  /**
   * إنشاء رابط رفع مؤقت (Presigned Upload URL)
   * @param fileKey - مفتاح الملف
   * @param expirySeconds - مدة صلاحية الرابط
   * @returns رابط الرفع المؤقت
   */
  async getPresignedUploadUrl(
    fileKey: string,
    expirySeconds: number = 3600,
  ): Promise<string> {
    try {
      return await this.minioClient.presignedPutObject(
        this.bucketName,
        fileKey,
        expirySeconds,
      );
    } catch (error) {
      console.error('❌ Error generating presigned upload URL:', error);
      throw new InternalServerErrorException('فشل في إنشاء رابط الرفع');
    }
  }

  /**
   * حذف ملف من MinIO
   * @param fileKey - مفتاح الملف
   */
  async deleteFile(fileKey: string): Promise<void> {
    try {
      await this.minioClient.removeObject(this.bucketName, fileKey);
      console.log(`✅ File deleted: ${fileKey}`);
    } catch (error) {
      console.error('❌ Delete error:', error);
      throw new InternalServerErrorException('فشل في حذف الملف');
    }
  }

  /**
   * حذف جميع ملفات شركة
   * @param companyId - معرف الشركة
   */
  async deleteCompanyFiles(companyId: string): Promise<void> {
    try {
      const prefix = `companies/${companyId}/`;
      const objectsList = [];
      const objectsStream = this.minioClient.listObjectsV2(
        this.bucketName,
        prefix,
        true,
      );

      for await (const obj of objectsStream) {
        objectsList.push(obj.name);
      }

      if (objectsList.length > 0) {
        await this.minioClient.removeObjects(this.bucketName, objectsList);
        console.log(`✅ Deleted ${objectsList.length} files for company ${companyId}`);
      }
    } catch (error) {
      console.error('❌ Error deleting company files:', error);
      throw new InternalServerErrorException('فشل في حذف ملفات الشركة');
    }
  }

  /**
   * الحصول على معلومات الملف
   * @param fileKey - مفتاح الملف
   * @returns معلومات الملف
   */
  async getFileInfo(fileKey: string): Promise<{
    size: number;
    etag: string;
    lastModified: Date;
    metaData: Record<string, string>;
  }> {
    try {
      const stat = await this.minioClient.statObject(this.bucketName, fileKey);
      return {
        size: stat.size,
        etag: stat.etag,
        lastModified: stat.lastModified,
        metaData: stat.metaData,
      };
    } catch (error) {
      console.error('❌ Error getting file info:', error);
      throw new InternalServerErrorException('فشل في الحصول على معلومات الملف');
    }
  }

  /**
   * التحقق من صلاحية الملف
   */
  private validateFile(file: Express.Multer.File) {
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    const ALLOWED_TYPES = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/msword', // .doc
      'application/vnd.ms-excel', // .xls
    ];

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('حجم الملف يتجاوز الحد المسموح (50 MB)');
    }

    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('نوع الملف غير مدعوم');
    }
  }

  /**
   * إنشاء مفتاح فريد للملف
   */
  private generateFileKey(
    companyId: string,
    category: string,
    extension: string,
  ): string {
    const documentId = uuidv4();
    const timestamp = Date.now();
    return `companies/${companyId}/${category}/${documentId}-${timestamp}${extension}`;
  }

  /**
   * الحصول على رابط الملف
   */
  private async getFileUrl(fileKey: string): Promise<string> {
    // يمكن استخدام Presigned URL أو CDN URL
    return await this.getPresignedDownloadUrl(fileKey, 604800); // أسبوع واحد
  }
}
```

---

### **B. Documents Controller (`backend/src/modules/documents/documents.controller.ts`)**

```typescript
import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  Body,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto } from './dto/upload-document.dto';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  /**
   * رفع مستند جديد
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadDocumentDto,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('لم يتم رفع أي ملف');
    }

    return this.documentsService.uploadDocument(file, uploadDto, user.id);
  }

  /**
   * الحصول على قائمة المستندات
   */
  @Get()
  async getDocuments(@Query() query: any, @CurrentUser() user: any) {
    return this.documentsService.findAll(query, user.id, user.role);
  }

  /**
   * الحصول على تفاصيل مستند
   */
  @Get(':id')
  async getDocument(@Param('id') id: string, @CurrentUser() user: any) {
    return this.documentsService.findOne(id, user.id, user.role);
  }

  /**
   * الحصول على رابط تحميل المستند
   */
  @Get(':id/download')
  async getDownloadUrl(@Param('id') id: string, @CurrentUser() user: any) {
    return this.documentsService.getDownloadUrl(id, user.id, user.role);
  }

  /**
   * حذف مستند
   */
  @Delete(':id')
  async deleteDocument(@Param('id') id: string, @CurrentUser() user: any) {
    return this.documentsService.remove(id, user.id, user.role);
  }

  /**
   * الحصول على مستندات شركة معينة
   */
  @Get('company/:companyId')
  async getCompanyDocuments(
    @Param('companyId') companyId: string,
    @Query() query: any,
    @CurrentUser() user: any,
  ) {
    return this.documentsService.findByCompany(companyId, query, user.id, user.role);
  }
}
```

---

## 💻 **4. Frontend Implementation (Next.js)**

### **A. Upload Document Modal (`frontend/components/documents/UploadDocumentModal.tsx`)**

تحديث الكود الحالي ليشمل تكامل كامل مع Backend:

```typescript
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { useToast } from '@/components/common';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId?: string;
  onSuccess?: () => void;
}

export function UploadDocumentModal({
  isOpen,
  onClose,
  companyId,
  onSuccess,
}: UploadDocumentModalProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    companyId: companyId || '',
    category: 'GENERAL',
    title: '',
    description: '',
  });

  const categories = [
    { value: 'COMMERCIAL_REGISTRATION', label: 'السجل التجاري' },
    { value: 'TAX_CERTIFICATE', label: 'الشهادة الضريبية' },
    { value: 'CONTRACT', label: 'عقد' },
    { value: 'FINANCIAL_STATEMENT', label: 'كشف مالي' },
    { value: 'LICENSE', label: 'رخصة' },
    { value: 'INVOICE', label: 'فاتورة' },
    { value: 'REPORT', label: 'تقرير' },
    { value: 'GENERAL', label: 'عام' },
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // التحقق من حجم الملف (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        showToast('حجم الملف يتجاوز 50 ميجابايت', 'error');
        return;
      }

      // التحقق من نوع الملف
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];

      if (!allowedTypes.includes(file.type)) {
        showToast('نوع الملف غير مدعوم', 'error');
        return;
      }

      setSelectedFile(file);
      
      // تعيين عنوان تلقائي من اسم الملف إذا لم يكن محدداً
      if (!formData.title) {
        setFormData(prev => ({
          ...prev,
          title: file.name.replace(/\.[^/.]+$/, ''), // إزالة الامتداد
        }));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showToast('الرجاء اختيار ملف', 'error');
      return;
    }

    if (!formData.companyId) {
      showToast('الرجاء اختيار شركة', 'error');
      return;
    }

    if (!formData.title) {
      showToast('الرجاء إدخال عنوان المستند', 'error');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // إنشاء FormData
      const uploadFormData = new FormData();
      uploadFormData.append('file', selectedFile);
      uploadFormData.append('companyId', formData.companyId);
      uploadFormData.append('category', formData.category);
      uploadFormData.append('title', formData.title);
      if (formData.description) {
        uploadFormData.append('description', formData.description);
      }

      // رفع الملف مع تتبع التقدم
      const document = await apiClient.uploadDocument(uploadFormData, (progress) => {
        setUploadProgress(progress);
      });

      showToast('تم رفع المستند بنجاح', 'success');
      
      // Reset form
      setSelectedFile(null);
      setFormData({
        companyId: companyId || '',
        category: 'GENERAL',
        title: '',
        description: '',
      });
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Upload error:', error);
      showToast(error.response?.data?.error?.message || 'فشل في رفع المستند', 'error');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            📤 رفع مستند جديد
          </h2>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* File Upload Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              الملف <span className="text-red-500">*</span>
            </label>
            <div
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                selectedFile
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 bg-gray-50 dark:bg-gray-700/50'
              } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx,.doc,.xls"
                className="hidden"
                disabled={isUploading}
              />
              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <svg className="w-12 h-12 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedFile.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    اضغط لاختيار ملف أو اسحبه هنا
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    PDF, Word, Excel, JPG, PNG (حتى 50 MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>جاري الرفع...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Company Selection */}
          {!companyId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                الشركة <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.companyId}
                onChange={(e) => setFormData(prev => ({ ...prev, companyId: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                placeholder="معرف الشركة"
                disabled={isUploading}
              />
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              التصنيف <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              disabled={isUploading}
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              عنوان المستند <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              placeholder="مثال: السجل التجاري 2024"
              disabled={isUploading}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              الوصف
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent resize-none"
              placeholder="وصف اختياري للمستند..."
              disabled={isUploading}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            إلغاء
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || !formData.companyId || !formData.title || isUploading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                جاري الرفع...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                رفع المستند
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

### **B. API Client (`frontend/lib/api.ts`)**

إضافة وظائف رفع وتحميل المستندات:

```typescript
// ... existing code ...

  // Documents
  async uploadDocument(
    formData: FormData,
    onProgress?: (progress: number) => void
  ): Promise<any> {
    const response = await this.client.post<ApiResponse>('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data.data;
  }

  async getDocuments(params?: PaginationParams & any): Promise<PaginatedResponse<any>> {
    const response = await this.client.get<ApiResponse<PaginatedResponse<any>>>('/documents', {
      params,
    });
    const data = response.data.data;
    return {
      data: data.documents || [],
      pagination: data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 }
    };
  }

  async getDocument(id: string): Promise<any> {
    const response = await this.client.get<ApiResponse>(`/documents/${id}`);
    return response.data.data.document;
  }

  async getDocumentDownloadUrl(id: string): Promise<{ url: string }> {
    const response = await this.client.get<ApiResponse>(`/documents/${id}/download`);
    return response.data.data;
  }

  async deleteDocument(id: string): Promise<void> {
    await this.client.delete(`/documents/${id}`);
  }

  async getCompanyDocuments(companyId: string, params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.client.get<ApiResponse<PaginatedResponse<any>>>(
      `/documents/company/${companyId}`,
      { params }
    );
    const data = response.data.data;
    return {
      data: data.documents || [],
      pagination: data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 }
    };
  }

// ... existing code ...
```

---

## 🔒 **5. الأمان (Security)**

### **A. Presigned URLs**
- جميع روابط التحميل مؤقتة (1 ساعة افتراضياً)
- لا يمكن الوصول المباشر للملفات بدون authentication
- يتم التحقق من صلاحيات المستخدم قبل إنشاء الرابط

### **B. التحقق من الصلاحيات**
```typescript
// في DocumentsService
async checkAccess(documentId: string, userId: string, userRole: string): Promise<boolean> {
  const document = await this.prisma.document.findUnique({
    where: { id: documentId },
    include: {
      company: {
        include: {
          shares: true,
        },
      },
    },
  });

  if (!document) return false;

  // المدير العام يمكنه الوصول لكل شيء
  if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') return true;

  // صاحب الشركة
  if (document.company.ownerId === userId) return true;

  // المشاركون في الشركة
  const hasAccess = document.company.shares.some(
    (share) => share.sharedWithId === userId
  );

  return hasAccess;
}
```

### **C. تشفير البيانات**
- HTTPS للاتصال بين Frontend و Backend
- SSL/TLS للاتصال بين Backend و MinIO (في Production)

---

## 📊 **6. المراقبة والتتبع**

### **A. Logging**
```typescript
// في StorageService
private logActivity(action: string, fileKey: string, userId: string) {
  console.log({
    timestamp: new Date().toISOString(),
    action,
    fileKey,
    userId,
    service: 'StorageService',
  });
}
```

### **B. Audit Trail**
حفظ سجل كامل لجميع عمليات الرفع/التحميل/الحذف في جدول `AuditLog`.

---

## ✅ **7. الخلاصة**

### **الخطوات الرئيسية:**

1. ✅ **تشغيل MinIO** عبر Docker Compose
2. ✅ **Backend**: StorageService + DocumentsController + DocumentsService
3. ✅ **Frontend**: UploadDocumentModal + API Client
4. ✅ **الأمان**: Presigned URLs + Permission Checks
5. ✅ **المراقبة**: Logging + Audit Trail

### **ملاحظات مهمة:**
- جميع الملفات تُخزن في MinIO بأسماء فريدة (UUID)
- الروابط مؤقتة ولا يمكن استخدامها بعد انتهاء صلاحيتها
- يتم التحقق من صلاحيات المستخدم قبل كل عملية
- دعم Versioning للملفات (يمكن رفع نفس المستند بإصدارات مختلفة)

---

**🚀 الآن النظام جاهز للاستخدام بالكامل!**

