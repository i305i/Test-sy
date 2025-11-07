import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class FoldersService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  /**
   * إنشاء مجلد جديد
   */
  async createFolder(
    companyId: string,
    name: string,
    parentId: string | null,
    userId: string,
  ) {
    // التحقق من أن الاسم لا يحتوي على أحرف ممنوعة
    if (!/^[a-zA-Z0-9\u0600-\u06FF\s_-]+$/.test(name)) {
      throw new BadRequestException('اسم المجلد يحتوي على أحرف غير صالحة');
    }

    // التحقق من عدم وجود مجلد بنفس الاسم
    const existing = await this.prisma.folder.findFirst({
      where: {
        companyId,
        parentId,
        name,
      },
    });

    if (existing) {
      throw new BadRequestException('يوجد مجلد بنفس الاسم في هذا الموقع');
    }

    // بناء المسار
    let path = '/';
    if (parentId) {
      const parent = await this.prisma.folder.findUnique({
        where: { id: parentId },
      });
      if (!parent) {
        throw new NotFoundException('المجلد الأب غير موجود');
      }
      path = `${parent.path}${name}/`;
    } else {
      path = `/${name}/`;
    }

    // إنشاء المجلد
    return this.prisma.folder.create({
      data: {
        name,
        path,
        companyId,
        parentId,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            children: true,
            documents: true,
          },
        },
      },
    });
  }

  /**
   * الحصول على محتويات مجلد
   */
  async getFolderContents(
    companyId: string,
    folderId: string | null,
  ) {
    // الحصول على المجلدات الفرعية
    const folders = await this.prisma.folder.findMany({
      where: {
        companyId,
        parentId: folderId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            children: true,
            documents: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // الحصول على الملفات
    const documents = await this.prisma.document.findMany({
      where: {
        companyId,
        folderId,
      },
      include: {
        uploadedBy: {
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
    });

    // تحويل BigInt إلى String (لا نرسل URLs مباشرة - سيتم إنشاء tokens عند الحاجة)
    const serializedDocuments = documents.map(doc => ({
      ...doc,
      fileSize: doc.fileSize.toString(),
      // لا نرسل presigned URLs - سيتم إنشاء One-Time Tokens عند الطلب
    }));

    // الحصول على معلومات المجلد الحالي (إذا لم يكن root)
    let currentFolder: any = null;
    if (folderId) {
      currentFolder = await this.prisma.folder.findUnique({
        where: { id: folderId },
        include: {
          parent: true,
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    }

    // بناء Breadcrumbs
    const breadcrumbs = await this.buildBreadcrumbs(folderId);

    return {
      currentFolder,
      folders,
      documents: serializedDocuments,
      breadcrumbs,
    };
  }

  /**
   * بناء Breadcrumbs (المسار)
   */
  private async buildBreadcrumbs(folderId: string | null) {
    const breadcrumbs: any[] = [
      { id: null, name: 'الجذر', path: '/' },
    ];

    if (!folderId) return breadcrumbs;

    let currentFolder: any = await this.prisma.folder.findUnique({
      where: { id: folderId },
      include: { parent: true },
    });

    const path: any[] = [];
    while (currentFolder) {
      path.unshift({
        id: currentFolder.id,
        name: currentFolder.name,
        path: currentFolder.path,
      });

      if (currentFolder.parentId) {
        currentFolder = await this.prisma.folder.findUnique({
          where: { id: currentFolder.parentId },
          include: { parent: true },
        });
      } else {
        currentFolder = null;
      }
    }

    return [...breadcrumbs, ...path];
  }

  /**
   * الحصول على شجرة المجلدات
   */
  async getFolderTree(companyId: string) {
    const folders = await this.prisma.folder.findMany({
      where: { companyId },
      include: {
        _count: {
          select: {
            children: true,
            documents: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // بناء الشجرة
    return this.buildTree(folders, null);
  }

  private buildTree(folders: any[], parentId: string | null): any[] {
    return folders
      .filter((f) => f.parentId === parentId)
      .map((folder) => ({
        ...folder,
        children: this.buildTree(folders, folder.id),
      }));
  }

  /**
   * إعادة تسمية مجلد
   */
  async renameFolder(folderId: string, newName: string) {
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
      include: { parent: true },
    });

    if (!folder) {
      throw new NotFoundException('المجلد غير موجود');
    }

    // بناء المسار الجديد
    let newPath = '/';
    if (folder.parentId && folder.parent) {
      newPath = `${folder.parent.path}${newName}/`;
    } else {
      newPath = `/${newName}/`;
    }

    // تحديث المجلد وجميع المجلدات الفرعية
    await this.updateFolderPaths(folder.id, folder.path, newPath);

    return this.prisma.folder.update({
      where: { id: folderId },
      data: {
        name: newName,
        path: newPath,
      },
    });
  }

  private async updateFolderPaths(
    folderId: string,
    oldPath: string,
    newPath: string,
  ) {
    // الحصول على جميع المجلدات الفرعية
    const children = await this.prisma.folder.findMany({
      where: {
        path: {
          startsWith: oldPath,
        },
      },
    });

    // تحديث المسارات
    for (const child of children) {
      const updatedPath = child.path.replace(oldPath, newPath);
      await this.prisma.folder.update({
        where: { id: child.id },
        data: { path: updatedPath },
      });
    }
  }

  /**
   * نقل مجلد
   */
  async moveFolder(
    folderId: string,
    newParentId: string | null,
  ) {
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder) {
      throw new NotFoundException('المجلد غير موجود');
    }

    // التحقق من عدم نقل المجلد إلى نفسه أو إلى مجلد فرعي منه
    if (newParentId) {
      const newParent = await this.prisma.folder.findUnique({
        where: { id: newParentId },
      });

      if (!newParent) {
        throw new NotFoundException('المجلد الوجهة غير موجود');
      }

      if (newParent.path.startsWith(folder.path)) {
        throw new BadRequestException('لا يمكن نقل المجلد إلى مجلد فرعي منه');
      }
    }

    // بناء المسار الجديد
    let newPath = '/';
    if (newParentId) {
      const newParent = await this.prisma.folder.findUnique({
        where: { id: newParentId },
      });
      if (newParent) {
        newPath = `${newParent.path}${folder.name}/`;
      }
    } else {
      newPath = `/${folder.name}/`;
    }

    // تحديث المسارات
    await this.updateFolderPaths(folder.id, folder.path, newPath);

    // نقل المجلد
    return this.prisma.folder.update({
      where: { id: folderId },
      data: {
        parentId: newParentId,
        path: newPath,
      },
    });
  }

  /**
   * حذف مجلد (وجميع محتوياته)
   */
  async deleteFolder(folderId: string) {
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
      include: {
        children: true,
        documents: true,
      },
    });

    if (!folder) {
      throw new NotFoundException('المجلد غير موجود');
    }

    // حذف المجلد (سيحذف تلقائياً المجلدات الفرعية بسبب onDelete: Cascade)
    return this.prisma.folder.delete({
      where: { id: folderId },
    });
  }

  /**
   * البحث في المجلدات والملفات
   */
  async search(companyId: string, query: string) {
    const folders = await this.prisma.folder.findMany({
      where: {
        companyId,
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      include: {
        parent: true,
        _count: {
          select: {
            children: true,
            documents: true,
          },
        },
      },
      take: 20,
    });

    const documents = await this.prisma.document.findMany({
      where: {
        companyId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { originalName: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        folder: true,
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      take: 50,
    });

    // تحويل BigInt إلى String (لا نرسل URLs مباشرة - سيتم إنشاء tokens عند الحاجة)
    const serializedDocuments = documents.map(doc => ({
      ...doc,
      fileSize: doc.fileSize.toString(),
      // لا نرسل presigned URLs - سيتم إنشاء One-Time Tokens عند الطلب
    }));

    return {
      folders,
      documents: serializedDocuments,
    };
  }
}

