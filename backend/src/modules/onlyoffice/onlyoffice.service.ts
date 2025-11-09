import { Injectable, Logger, BadRequestException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { DocumentsService } from '../documents/documents.service';

@Injectable()
export class OnlyOfficeService {
  private readonly logger = new Logger(OnlyOfficeService.name);
  private readonly documentServerUrl: string;
  private readonly secret: string;
  private readonly callbackUrl: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private storageService: StorageService,
    @Inject(forwardRef(() => DocumentsService))
    private documentsService: DocumentsService,
  ) {
    this.documentServerUrl = 
      this.configService.get('ONLYOFFICE_DOCUMENT_SERVER_URL') || 
      'http://localhost:8080';
    
    this.secret = 
      this.configService.get('ONLYOFFICE_SECRET') || 
      'your-secret-key-change-in-production';
    
    const backendUrl = 
      this.configService.get('BACKEND_URL') || 
      this.configService.get('APP_URL') || 
      'http://localhost:5000';
    
    this.callbackUrl = `${backendUrl}/api/v1/onlyoffice/callback`;
  }

  /**
   * Generate JWT token for OnlyOffice
   */
  private generateToken(payload: any): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT',
    };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Get document editor configuration
   */
  async getEditorConfig(
    documentId: string,
    userId: string,
    userRole: string,
    mode: 'edit' | 'view' = 'edit',
  ) {
    // Get document
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: {
        company: {
          include: {
            shares: {
              where: {
                sharedWithUserId: userId,
                status: 'ACTIVE',
              },
            },
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('المستند غير موجود');
    }

    // Check permissions
    const canEdit = this.checkEditPermission(document, userId, userRole);
    if (mode === 'edit' && !canEdit) {
      throw new BadRequestException('ليس لديك صلاحية لتعديل هذا المستند');
    }

    // Get file URL - OnlyOffice needs a direct download URL
    // We'll use the download token system for security
    const downloadToken = await this.prisma.downloadToken.create({
      data: {
        documentId: document.id,
        userId: userId,
        purpose: 'PREVIEW',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        used: false,
      },
    });

    const backendUrl = 
      this.configService.get('BACKEND_URL') || 
      this.configService.get('APP_URL') || 
      'http://localhost:5000';
    
    const fileUrl = `${backendUrl}/api/v1/documents/download/${downloadToken.id}`;
    
    // Generate document key (unique identifier for OnlyOffice)
    const documentKey = `${documentId}_${document.updatedAt.getTime()}`;

    // Determine editor mode
    const editorMode = mode === 'edit' && canEdit ? 'edit' : 'view';

    // Build config
    const config = {
      document: {
        fileType: this.getFileExtension(document.mimeType),
        key: documentKey,
        title: document.name,
        url: fileUrl,
        permissions: {
          comment: canEdit,
          copy: true,
          download: true,
          edit: canEdit,
          fillForms: canEdit,
          modifyContentControl: canEdit,
          modifyFilter: canEdit,
          print: true,
          review: canEdit,
        },
      },
      documentType: this.getDocumentType(document.mimeType),
      editorConfig: {
        mode: editorMode,
        lang: 'ar',
        callbackUrl: this.callbackUrl,
        customization: {
          autosave: true,
          chat: true,
          comments: true,
          compactHeader: false,
          compactToolbar: false,
          compatibleFeatures: false,
          customer: {
            name: 'نظام إدارة الشركات',
            mail: 'support@companydocs.com',
          },
          feedback: {
            visible: true,
            url: '',
          },
          forcesave: true,
          goback: {
            blank: false,
            requestClose: false,
            text: 'إغلاق المحرر',
            url: '',
          },
          hideRightMenu: false,
          hideRulers: false,
          macros: false,
          macrosMode: 'disabled',
          plugins: {
            autostart: [],
            pluginsData: [],
          },
          review: {
            hideReviewDisplay: false,
            reviewDisplay: 'original',
            showReviewChanges: true,
          },
          spellcheck: {
            mode: true,
          },
          tooltip: true,
          unit: 'cm',
          zoom: 100,
        },
        user: {
          id: userId,
          name: await this.getUserName(userId),
        },
      },
      token: this.generateToken({
        documentId,
        userId,
        mode: editorMode,
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
      }),
    };

    return config;
  }

  /**
   * Handle callback from OnlyOffice
   */
  async handleCallback(body: any) {
    this.logger.log(`OnlyOffice callback received: ${JSON.stringify(body)}`);

    const { status, key, url } = body;

    if (status === 1 || status === 2) {
      // Document is being edited
      this.logger.log(`Document ${key} is being edited`);
      return { error: 0 };
    }

    if (status === 3) {
      // Document is ready for saving
      if (!url) {
        this.logger.error('No URL provided in callback');
        return { error: 0 };
      }

      try {
        // Extract document ID from key (format: documentId_timestamp)
        const documentId = key.split('_')[0];
        
        // Download the edited file
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to download file: ${response.statusText}`);
        }

        const fileBuffer = Buffer.from(await response.arrayBuffer());
        
        // Get document info
        const document = await this.prisma.document.findUnique({
          where: { id: documentId },
        });

        if (!document) {
          this.logger.error(`Document ${documentId} not found`);
          return { error: 0 };
        }

        // Replace file in storage - upload new version directly to same path
        try {
          // Get MinIO client from storage service
          const storageServiceAny = this.storageService as any;
          const minioClient = storageServiceAny.minioClient;
          const bucketName = storageServiceAny.bucketName;
          
          if (!minioClient || !bucketName) {
            throw new Error('MinIO client not available');
          }
          
          // Upload new file directly to MinIO using the same path
          await minioClient.putObject(
            bucketName,
            document.filePath,
            fileBuffer,
            fileBuffer.length,
            {
              'Content-Type': document.mimeType,
              'X-Original-Name': Buffer.from(document.originalName).toString('base64'),
            },
          );
          
          this.logger.log(`Document ${documentId} saved successfully to ${document.filePath}`);
        } catch (e) {
          this.logger.error(`Error saving document: ${e.message}`, e.stack);
          // Don't throw - return error code to OnlyOffice
          return { error: 1 };
        }

        // Update document
        await this.prisma.document.update({
          where: { id: documentId },
          data: {
            updatedAt: new Date(),
          },
        });

        this.logger.log(`Document ${documentId} saved successfully`);
        return { error: 0 };
      } catch (error) {
        this.logger.error(`Error saving document: ${error.message}`, error.stack);
        return { error: 1 };
      }
    }

    if (status === 4 || status === 6) {
      // Document saving error or force save required
      this.logger.warn(`Document ${key} save error or force save required`);
      return { error: 0 };
    }

    if (status === 7) {
      // Document is being edited but no changes
      this.logger.log(`Document ${key} is being edited but no changes`);
      return { error: 0 };
    }

    return { error: 0 };
  }

  /**
   * Check if user can edit document
   */
  private checkEditPermission(document: any, userId: string, userRole: string): boolean {
    // Admin and Supervisor can always edit
    if (userRole === 'ADMIN' || userRole === 'SUPERVISOR') {
      return true;
    }

    // Owner can edit
    if (document.company.ownerId === userId) {
      return true;
    }

    // Uploader can edit
    if (document.uploadedById === userId) {
      return true;
    }

    // Check if user has EDIT or MANAGE permission through share
    const share = document.company.shares.find(
      (s: any) => s.sharedWithUserId === userId && s.status === 'ACTIVE',
    );

    if (share && (share.permissionLevel === 'EDIT' || share.permissionLevel === 'MANAGE')) {
      return true;
    }

    return false;
  }

  /**
   * Get file extension from MIME type
   */
  private getFileExtension(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
      'application/vnd.ms-powerpoint': 'ppt',
      'application/pdf': 'pdf',
      'text/plain': 'txt',
      'text/csv': 'csv',
    };

    return mimeToExt[mimeType] || 'docx';
  }

  /**
   * Get document type for OnlyOffice
   */
  private getDocumentType(mimeType: string): 'text' | 'spreadsheet' | 'presentation' {
    if (
      mimeType.includes('word') ||
      mimeType === 'application/pdf' ||
      mimeType === 'text/plain' ||
      mimeType === 'text/csv'
    ) {
      return 'text';
    }

    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
      return 'spreadsheet';
    }

    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
      return 'presentation';
    }

    return 'text';
  }

  /**
   * Get user name
   */
  private async getUserName(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, email: true },
    });

    if (!user) {
      return 'مستخدم غير معروف';
    }

    return `${user.firstName} ${user.lastName}`.trim() || user.email;
  }

  /**
   * Check if file type is supported by OnlyOffice
   */
  isSupportedFileType(mimeType: string): boolean {
    const supportedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'application/vnd.ms-powerpoint', // .ppt
      'application/pdf', // .pdf
      'text/plain', // .txt
      'text/csv', // .csv
    ];

    return supportedTypes.includes(mimeType);
  }
}

