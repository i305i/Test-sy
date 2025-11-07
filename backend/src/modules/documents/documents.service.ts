import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { ShareDocumentDto } from './dto/share-document.dto';
import * as crypto from 'crypto';
import archiver from 'archiver';
import { Readable } from 'stream';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  async upload(
    companyId: string,
    file: Express.Multer.File,
    uploadDto: UploadDocumentDto,
    userId: string,
  ) {
    // Check company exists and user has access
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        shares: {
          where: {
            sharedWithUserId: userId,
            status: 'ACTIVE',
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException('الشركة غير موجودة');
    }

    // Check permission
    const hasAccess = 
      company.ownerId === userId ||
      company.shares.some(s => s.permissionLevel !== 'VIEW');

    if (!hasAccess) {
      throw new ForbiddenException('ليس لديك صلاحية لرفع ملفات لهذه الشركة');
    }

    // Upload to MinIO - استخدم مسار آمن (folderId بدلاً من المسار النصي)
    let storagePath = `companies/${companyId}`;
    
    if (uploadDto.folderId) {
      // استخدم folderId بدلاً من المسار النصي لتجنب مشاكل الأحرف الخاصة
      storagePath = `${storagePath}/folders/${uploadDto.folderId}`;
    } else {
      // إذا لم يكن هناك مجلد، ضعه في مجلد documents
      storagePath = `${storagePath}/documents`;
    }
    
    const { key, url } = await this.storageService.uploadFile(
      file,
      storagePath,
    );

    // Calculate checksum
    const checksum = crypto
      .createHash('sha256')
      .update(file.buffer)
      .digest('hex');

    // Check if updating existing document
    let version = 1;
    let parentDocumentId: string | null = null;

    if (uploadDto.parentDocumentId) {
      const parentDoc = await this.prisma.document.findUnique({
        where: { id: uploadDto.parentDocumentId },
      });

      if (parentDoc) {
        version = parentDoc.version + 1;
        parentDocumentId = parentDoc.id;

        // Mark previous version as not latest
        await this.prisma.document.update({
          where: { id: parentDoc.id },
          data: { isLatestVersion: false },
        });
      }
    }

    // Create document record
    const document = await this.prisma.document.create({
      data: {
        companyId,
        folderId: uploadDto.folderId || null,
        name: uploadDto.name || file.originalname,
        originalName: file.originalname,
        filePath: key,
        fileSize: BigInt(file.size),
        mimeType: file.mimetype,
        extension: file.originalname.split('.').pop(),
        category: uploadDto.category as any,
        documentType: uploadDto.documentType,
        version,
        parentDocumentId,
        isLatestVersion: true,
        status: 'PENDING',
        description: uploadDto.description,
        tags: uploadDto.tags || [],
        checksum,
        storageProvider: 'minio',
        storageBucket: 'company-docs',
        storageKey: key,
        uploadedById: userId,
        issueDate: uploadDto.issueDate,
        expiryDate: uploadDto.expiryDate,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return {
      ...document,
      fileSize: Number(document.fileSize),
      downloadUrl: url,
    };
  }

  async findAll(companyId: string, query: any, userId: string, userRole: string) {
    // Check company access
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        shares: {
          where: {
            sharedWithUserId: userId,
            status: 'ACTIVE',
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException('الشركة غير موجودة');
    }

    if (userRole === 'EMPLOYEE') {
      const hasAccess = 
        company.ownerId === userId ||
        company.shares.length > 0;

      if (!hasAccess) {
        throw new ForbiddenException('ليس لديك صلاحية للوصول لوثائق هذه الشركة');
      }
    }

    const { page = 1, limit = 20, category, status, search, latestOnly = true } = query;
    const skip = (page - 1) * limit;

    const where: any = { companyId };

    if (latestOnly) {
      where.isLatestVersion = true;
    }

    if (category) {
      where.category = category;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { documentType: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [documents, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy: { uploadedAt: 'desc' },
        include: {
          uploadedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          approvedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.document.count({ where }),
    ]);

    // Generate download URLs
    const documentsWithUrls = await Promise.all(
      documents.map(async (doc) => ({
        ...doc,
        fileSize: Number(doc.fileSize),
        downloadUrl: await this.storageService.getFileUrl(doc.filePath),
      })),
    );

    return {
      documents: documentsWithUrls,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string, userRole: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
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
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        versions: {
          orderBy: { version: 'desc' },
          take: 5,
        },
      },
    });

    if (!document) {
      throw new NotFoundException('الوثيقة غير موجودة');
    }

    // Check access
    if (userRole === 'EMPLOYEE') {
      const hasAccess = 
        document.company.ownerId === userId ||
        document.company.shares.length > 0;

      if (!hasAccess) {
        throw new ForbiddenException('ليس لديك صلاحية للوصول لهذه الوثيقة');
      }
    }

    const downloadUrl = await this.storageService.getFileUrl(document.filePath);

    return {
      ...document,
      fileSize: Number(document.fileSize),
      downloadUrl,
    };
  }

  async findAllDocuments(query: any, userId: string, userRole: string) {
    const { page = 1, limit = 20, category, status, search, companyId } = query;
    const skip = (page - 1) * limit;

    // Build where clause based on user role
    const where: any = {
      isLatestVersion: true,
    };

    // Filter by company if specified
    if (companyId) {
      where.companyId = companyId;
    } else if (userRole === 'EMPLOYEE') {
      // For employees, only show documents from companies they own or have access to
      const userCompanies = await this.prisma.company.findMany({
        where: {
          OR: [
            { ownerId: userId },
            {
              shares: {
                some: {
                  sharedWithUserId: userId,
                  status: 'ACTIVE',
                },
              },
            },
          ],
        },
        select: { id: true },
      });
      where.companyId = { in: userCompanies.map(c => c.id) };
    }

    if (category) {
      where.category = category;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { originalName: { contains: search, mode: 'insensitive' } },
        { company: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [documents, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        skip,
        take: limit,
        include: {
          company: {
            select: {
              id: true,
              name: true,
            },
          },
          uploadedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          approvedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          uploadedAt: 'desc',
        },
      }),
      this.prisma.document.count({ where }),
    ]);

    // Generate download URLs
    const documentsWithUrls = await Promise.all(
      documents.map(async (doc) => ({
        ...doc,
        fileSize: Number(doc.fileSize),
        downloadUrl: await this.storageService.getFileUrl(doc.filePath),
        fileName: doc.name,
        createdAt: doc.uploadedAt,
      })),
    );

    return {
      documents: documentsWithUrls,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, updateDto: UpdateDocumentDto, userId: string, userRole: string) {
    const document = await this.findOne(id, userId, userRole);

    // Check permission
    if (userRole === 'EMPLOYEE' && document.company.ownerId !== userId) {
      const share = document.company.shares.find(s => s.sharedWithUserId === userId);
      if (!share || share.permissionLevel === 'VIEW') {
        throw new ForbiddenException('ليس لديك صلاحية لتعديل هذه الوثيقة');
      }
    }

    const updateData: any = { ...updateDto };
    delete updateData.parentDocumentId; // Can't update parent after creation
    
    return this.prisma.document.update({
      where: { id },
      data: updateData,
    });
  }

  async approve(id: string, userId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      throw new NotFoundException('الوثيقة غير موجودة');
    }

    if (document.status === 'APPROVED') {
      throw new BadRequestException('الوثيقة معتمدة مسبقاً');
    }

    return this.prisma.document.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: userId,
        approvedAt: new Date(),
      },
    });
  }

  async reject(id: string, reason: string, userId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      throw new NotFoundException('الوثيقة غير موجودة');
    }

    return this.prisma.document.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        approvedById: userId,
        approvedAt: new Date(),
      },
    });
  }

  async remove(id: string, userId: string, userRole: string) {
    const document = await this.findOne(id, userId, userRole);

    // Check permission
    if (userRole === 'EMPLOYEE' && document.company.ownerId !== userId) {
      throw new ForbiddenException('ليس لديك صلاحية لحذف هذه الوثيقة');
    }

    // Delete from storage
    await this.storageService.deleteFile(document.filePath);

    // Delete from database
    return this.prisma.document.delete({
      where: { id },
    });
  }

  async download(id: string, userId: string, userRole: string) {
    const document = await this.findOne(id, userId, userRole);
    
    // Get file stream from storage
    const stream = await this.storageService.getFileStream(document.filePath);

    return {
      stream,
      fileName: document.originalName,
      mimeType: document.mimeType,
    };
  }

  async generateDownloadToken(
    documentId: string,
    userId: string,
    userRole: string,
    purpose: 'PREVIEW' | 'DOWNLOAD',
    ipAddress?: string,
    userAgent?: string,
  ) {
    // التحقق من الصلاحيات
    await this.findOne(documentId, userId, userRole);

    // إنشاء token عشوائي آمن
    const token = crypto.randomBytes(32).toString('hex');

    // تحديد مدة الصلاحية (5 دقائق للمعاينة، 2 دقيقة للتحميل)
    const expiryMinutes = purpose === 'PREVIEW' ? 5 : 2;
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);

    // حفظ Token في قاعدة البيانات
    await this.prisma.downloadToken.create({
      data: {
        token,
        documentId,
        userId,
        purpose,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    // إنشاء URL للمعاينة أو التحميل
    const baseUrl = process.env.BACKEND_URL;
    const endpoint = purpose === 'PREVIEW' ? 'stream' : 'download';
    const url = `${baseUrl}/api/v1/documents/${endpoint}/${token}`;

    return {
      token,
      url,
      expiresAt,
      purpose,
      expiresIn: `${expiryMinutes} minutes`,
    };
  }

  async streamWithToken(token: string, ipAddress?: string, userAgent?: string) {
    // البحث عن Token
    const downloadToken = await this.prisma.downloadToken.findUnique({
      where: { token },
      include: {
        document: true,
        user: true,
      },
    });

    // التحقق من وجود Token
    if (!downloadToken) {
      throw new NotFoundException('رابط المعاينة غير صالح');
    }

    // التحقق من عدم استخدامه مسبقاً
    if (downloadToken.used) {
      throw new BadRequestException('تم استخدام هذا الرابط مسبقاً - لأسباب أمنية، الرابط لا يعمل إلا مرة واحدة');
    }

    // التحقق من عدم انتهاء الصلاحية
    if (new Date() > downloadToken.expiresAt) {
      throw new BadRequestException('انتهت صلاحية هذا الرابط');
    }

    // التحقق من Purpose (PREVIEW فقط)
    if (downloadToken.purpose !== 'PREVIEW') {
      throw new BadRequestException('هذا الرابط مخصص للتحميل فقط');
    }

    // تحديث Token كـ "مستخدم" (One-Time Use)
    await this.prisma.downloadToken.update({
      where: { id: downloadToken.id },
      data: {
        used: true,
        usedAt: new Date(),
      },
    });

    // تسجيل في Audit Log
    await this.prisma.auditLog.create({
      data: {
        userId: downloadToken.userId,
        action: 'DOCUMENT_PREVIEWED',
        resourceType: 'DOCUMENT',
        resourceId: downloadToken.documentId,
        status: 'SUCCESS',
        ipAddress,
        userAgent,
        details: {
          token: token.substring(0, 8) + '...',
          fileName: downloadToken.document.name,
        },
      },
    });

    // الحصول على stream من MinIO
    const stream = await this.storageService.getFileStream(downloadToken.document.filePath);

    return {
      stream,
      mimeType: downloadToken.document.mimeType,
      fileName: downloadToken.document.name,
    };
  }

  async downloadWithToken(token: string, ipAddress?: string, userAgent?: string) {
    // البحث عن Token
    const downloadToken = await this.prisma.downloadToken.findUnique({
      where: { token },
      include: {
        document: true,
        user: true,
      },
    });

    // التحقق من وجود Token
    if (!downloadToken) {
      throw new NotFoundException('رابط التحميل غير صالح');
    }

    // التحقق من عدم استخدامه مسبقاً
    if (downloadToken.used) {
      throw new BadRequestException('تم استخدام هذا الرابط مسبقاً - لأسباب أمنية، الرابط لا يعمل إلا مرة واحدة');
    }

    // التحقق من عدم انتهاء الصلاحية
    if (new Date() > downloadToken.expiresAt) {
      throw new BadRequestException('انتهت صلاحية هذا الرابط');
    }

    // التحقق من Purpose (DOWNLOAD فقط)
    if (downloadToken.purpose !== 'DOWNLOAD') {
      throw new BadRequestException('هذا الرابط مخصص للمعاينة فقط');
    }

    // تحديث Token كـ "مستخدم" (One-Time Use)
    await this.prisma.downloadToken.update({
      where: { id: downloadToken.id },
      data: {
        used: true,
        usedAt: new Date(),
      },
    });

    // تسجيل في Audit Log
    await this.prisma.auditLog.create({
      data: {
        userId: downloadToken.userId,
        action: 'DOCUMENT_DOWNLOADED',
        resourceType: 'DOCUMENT',
        resourceId: downloadToken.documentId,
        status: 'SUCCESS',
        ipAddress,
        userAgent,
        details: {
          token: token.substring(0, 8) + '...',
          fileName: downloadToken.document.name,
        },
      },
    });

    // الحصول على stream من MinIO
    const stream = await this.storageService.getFileStream(downloadToken.document.filePath);

    return {
      stream,
      mimeType: downloadToken.document.mimeType,
      fileName: downloadToken.document.originalName,
    };
  }

  async uploadMultiple(
    companyId: string,
    files: Express.Multer.File[],
    options: { category: string; folderId?: string },
    userId: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('لم يتم اختيار أي ملفات');
    }

    // Check company exists and user has access
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        shares: {
          where: {
            sharedWithUserId: userId,
            status: 'ACTIVE',
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException('الشركة غير موجودة');
    }

    // Check permission
    const hasAccess = 
      company.ownerId === userId ||
      company.shares.some(s => s.permissionLevel !== 'VIEW');

    if (!hasAccess) {
      throw new ForbiddenException('ليس لديك صلاحية لرفع ملفات لهذه الشركة');
    }

    const uploadedDocuments: any[] = [];

    for (const file of files) {
      try {
        const uploadDto: UploadDocumentDto = {
          name: file.originalname,
          category: options.category,
          folderId: options.folderId,
        };

        const document = await this.upload(companyId, file, uploadDto, userId);
        uploadedDocuments.push(document);
      } catch (error) {
        console.error(`Error uploading file ${file.originalname}:`, error);
        // Continue with other files even if one fails
      }
    }

    return uploadedDocuments;
  }

  async replaceFile(
    companyId: string,
    documentId: string,
    file: Express.Multer.File,
    userId: string,
  ) {
    // Check document exists and user has access
    const document = await this.findOne(documentId, userId, 'EMPLOYEE');

    if (document.companyId !== companyId) {
      throw new BadRequestException('الملف لا ينتمي لهذه الشركة');
    }

    // Check permission
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        shares: {
          where: {
            sharedWithUserId: userId,
            status: 'ACTIVE',
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException('الشركة غير موجودة');
    }

    const hasAccess = 
      company.ownerId === userId ||
      company.shares.some(s => s.permissionLevel !== 'VIEW');

    if (!hasAccess) {
      throw new ForbiddenException('ليس لديك صلاحية لاستبدال هذا الملف');
    }

    // Upload new file
    let storagePath = `companies/${companyId}`;
    if (document.folderId) {
      storagePath = `${storagePath}/folders/${document.folderId}`;
    } else {
      storagePath = `${storagePath}/documents`;
    }

    const { key, url } = await this.storageService.uploadFile(file, storagePath);

    // Calculate checksum
    const checksum = crypto
      .createHash('sha256')
      .update(file.buffer)
      .digest('hex');

    // Mark old version as not latest
    await this.prisma.document.update({
      where: { id: documentId },
      data: { isLatestVersion: false },
    });

    // Create new version
    const newVersion = await this.prisma.document.create({
      data: {
        companyId,
        folderId: document.folderId,
        name: document.name, // Keep same name
        originalName: file.originalname,
        filePath: key,
        fileSize: BigInt(file.size),
        mimeType: file.mimetype,
        extension: file.originalname.split('.').pop(),
        checksum,
        category: document.category,
        version: document.version + 1,
        parentDocumentId: documentId,
        isLatestVersion: true,
        uploadedById: userId,
        status: 'PENDING',
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return {
      ...newVersion,
      fileSize: Number(newVersion.fileSize),
      downloadUrl: url,
    };
  }

  async downloadAllAsZip(
    companyId: string,
    userId: string,
    userRole: string,
  ): Promise<{ stream: Readable; fileName: string }> {
    // Check company access
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        shares: {
          where: {
            sharedWithUserId: userId,
            status: 'ACTIVE',
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException('الشركة غير موجودة');
    }

    // Check permission
    if (userRole === 'EMPLOYEE') {
      const hasAccess = 
        company.ownerId === userId ||
        company.shares.length > 0;

      if (!hasAccess) {
        throw new ForbiddenException('ليس لديك صلاحية للوصول لهذه الشركة');
      }
    }

    // Get all documents for this company (latest versions only)
    const documents = await this.prisma.document.findMany({
      where: {
        companyId,
        isLatestVersion: true,
      },
      include: {
        folder: {
          select: {
            name: true,
            parentId: true,
          },
        },
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    });

    if (documents.length === 0) {
      throw new NotFoundException('لا توجد ملفات للتحميل');
    }

    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 }, // Maximum compression
    });

    // Build folder structure
    const folderMap = new Map<string, { name: string; path: string }>();
    
    // Get all folders
    const folders = await this.prisma.folder.findMany({
      where: { companyId },
    });

    // Build folder paths
    const getFolderPath = (folderId: string | null): string => {
      if (!folderId) return '';
      
      const folder = folders.find(f => f.id === folderId);
      if (!folder) return '';
      
      if (folder.parentId) {
        const parentPath = getFolderPath(folder.parentId);
        return parentPath ? `${parentPath}/${folder.name}` : folder.name;
      }
      return folder.name;
    };

    // Add files to archive
    for (const doc of documents) {
      try {
        const fileStream = await this.storageService.getFileStream(doc.filePath);
        const folderPath = doc.folderId ? getFolderPath(doc.folderId) : '';
        const archivePath = folderPath 
          ? `${folderPath}/${doc.originalName}` 
          : doc.originalName;
        
        archive.append(fileStream, { name: archivePath });
      } catch (error) {
        console.error(`Error adding file ${doc.name} to archive:`, error);
        // Continue with other files
      }
    }

    // Finalize archive
    archive.finalize();

    const fileName = `${company.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.zip`;

    return {
      stream: archive as any,
      fileName,
    };
  }

  // ============================================================================
  // Document Sharing
  // ============================================================================

  async shareDocument(
    documentId: string,
    companyId: string,
    shareDto: ShareDocumentDto,
    userId: string,
    userRole: string,
  ) {
    // Check document exists
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: {
        company: true,
      },
    });

    if (!document) {
      throw new NotFoundException('المستند غير موجود');
    }

    if (document.companyId !== companyId) {
      throw new BadRequestException('المستند لا ينتمي لهذه الشركة');
    }

    // Check permission: Only owner, admin, or supervisor can share
    const canShare =
      userRole === 'ADMIN' ||
      userRole === 'SUPERVISOR' ||
      document.company.ownerId === userId ||
      document.uploadedById === userId;

    if (!canShare) {
      throw new ForbiddenException('فقط مالك المستند أو المدير أو المشرف يمكنهم مشاركة المستند');
    }

    // Check if user exists
    const userToShare = await this.prisma.user.findUnique({
      where: { id: shareDto.sharedWithUserId },
    });

    if (!userToShare) {
      throw new NotFoundException('المستخدم المراد المشاركة معه غير موجود');
    }

    // Check if already shared
    const existingShare = await (this.prisma as any).documentShare.findUnique({
      where: {
        documentId_sharedWithUserId: {
          documentId,
          sharedWithUserId: shareDto.sharedWithUserId,
        },
      },
    });

    if (existingShare && existingShare.status === 'ACTIVE') {
      throw new BadRequestException('المستند مشارك مسبقاً مع هذا المستخدم');
    }

    // Create or reactivate share
    if (existingShare) {
      return (this.prisma as any).documentShare.update({
        where: { id: existingShare.id },
        data: {
          status: 'ACTIVE',
          permissionLevel: shareDto.permissionLevel as any,
          note: shareDto.note,
          validUntil: shareDto.validUntil ? new Date(shareDto.validUntil) : null,
          revokedAt: null,
        },
        include: {
          sharedWithUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          sharedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });
    }

    return (this.prisma as any).documentShare.create({
      data: {
        documentId,
        sharedWithUserId: shareDto.sharedWithUserId,
        sharedByUserId: userId,
        permissionLevel: shareDto.permissionLevel as any,
        note: shareDto.note,
        validUntil: shareDto.validUntil ? new Date(shareDto.validUntil) : null,
      },
      include: {
        sharedWithUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        sharedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async getDocumentShares(documentId: string, userId: string, userRole: string) {
    // Check document exists
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: {
        company: true,
      },
    });

    if (!document) {
      throw new NotFoundException('المستند غير موجود');
    }

    // Check access: owner, admin, supervisor, or has active share
    const hasAccess =
      userRole === 'ADMIN' ||
      userRole === 'SUPERVISOR' ||
      document.company.ownerId === userId ||
      document.uploadedById === userId ||
      (await (this.prisma as any).documentShare.findFirst({
        where: {
          documentId,
          sharedWithUserId: userId,
          status: 'ACTIVE',
        },
      }));

    if (!hasAccess) {
      throw new ForbiddenException('ليس لديك صلاحية لعرض مشاركات هذا المستند');
    }

    return (this.prisma as any).documentShare.findMany({
      where: {
        documentId,
        status: 'ACTIVE',
      },
      include: {
        sharedWithUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
        sharedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateDocumentShare(
    shareId: string,
    permissionLevel: string,
    userId: string,
    userRole: string,
  ) {
    const share = await (this.prisma as any).documentShare.findUnique({
      where: { id: shareId },
      include: {
        document: {
          include: {
            company: true,
          },
        },
      },
    });

    if (!share) {
      throw new NotFoundException('المشاركة غير موجودة');
    }

    // Check permission: Only admin, supervisor, or document owner can update
    const canUpdate =
      userRole === 'ADMIN' ||
      userRole === 'SUPERVISOR' ||
      share.document.company.ownerId === userId ||
      share.document.uploadedById === userId;

    if (!canUpdate) {
      throw new ForbiddenException('فقط مالك المستند أو المدير أو المشرف يمكنهم تعديل الصلاحيات');
    }

    return (this.prisma as any).documentShare.update({
      where: { id: shareId },
      data: {
        permissionLevel: permissionLevel as any,
      },
      include: {
        sharedWithUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        sharedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async revokeDocumentShare(shareId: string, userId: string, userRole: string) {
    const share = await (this.prisma as any).documentShare.findUnique({
      where: { id: shareId },
      include: {
        document: {
          include: {
            company: true,
          },
        },
      },
    });

    if (!share) {
      throw new NotFoundException('المشاركة غير موجودة');
    }

    // Check permission: Only admin, supervisor, or document owner can revoke
    const canRevoke =
      userRole === 'ADMIN' ||
      userRole === 'SUPERVISOR' ||
      share.document.company.ownerId === userId ||
      share.document.uploadedById === userId;

    if (!canRevoke) {
      throw new ForbiddenException('فقط مالك المستند أو المدير أو المشرف يمكنهم إلغاء المشاركة');
    }

    return (this.prisma as any).documentShare.update({
      where: { id: shareId },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
      },
    });
  }

  async getDocumentsSharedByUser(userId: string, companyId?: string) {
    const where: any = {
      sharedByUserId: userId,
      status: 'ACTIVE',
    };

    const shares = await (this.prisma as any).documentShare.findMany({
      where,
      include: {
        document: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
              },
            },
            uploadedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            folder: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        sharedWithUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Filter by company if provided
    let filteredShares = shares;
    if (companyId) {
      filteredShares = shares.filter((share: any) => share.document.companyId === companyId);
    }

    return filteredShares.map((share: any) => ({
      shareId: share.id,
      document: {
        ...share.document,
        fileSize: Number(share.document.fileSize),
      },
      sharedWith: share.sharedWithUser,
      permissionLevel: share.permissionLevel,
      createdAt: share.createdAt,
    }));
  }
}

