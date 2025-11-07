import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import * as crypto from 'crypto';

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
    
    // Generate long-lived presigned URL for download
    const downloadUrl = await this.storageService.getFileUrl(document.filePath, 3600);

    return {
      url: downloadUrl,
      filename: document.originalName,
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
}

