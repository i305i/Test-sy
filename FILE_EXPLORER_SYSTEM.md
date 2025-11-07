# 📂 نظام File Explorer للمستندات - مثل مستكشف الملفات

## 🎯 **المميزات**

### **1. واجهة مستخدم شبيهة بـ File Explorer:**
- ✅ عرض المجلدات والملفات في Grid/List View
- ✅ Sidebar للتنقل السريع
- ✅ Breadcrumbs للمسار الحالي
- ✅ Tree View للمجلدات
- ✅ أيقونات حسب نوع الملف
- ✅ معلومات تفصيلية (الحجم، التاريخ، المالك)
- ✅ Context Menu (قائمة النقر اليمين)
- ✅ Drag & Drop لرفع الملفات
- ✅ Search داخل المجلد الحالي

### **2. العمليات:**
- ✅ إنشاء مجلد جديد
- ✅ رفع ملفات
- ✅ إعادة تسمية
- ✅ نقل/نسخ
- ✅ حذف
- ✅ تحميل
- ✅ معاينة (Preview)
- ✅ مشاركة

---

## 🗄️ **1. Database Schema - إضافة Folders**

### **Prisma Schema Update:**

```prisma
// في backend/prisma/schema.prisma

model Folder {
  id          String    @id @default(uuid())
  name        String
  path        String    // المسار الكامل مثل: /commercial-registration/2024
  
  // العلاقات
  companyId   String
  company     Company   @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  parentId    String?
  parent      Folder?   @relation("FolderHierarchy", fields: [parentId], references: [id], onDelete: Cascade)
  children    Folder[]  @relation("FolderHierarchy")
  
  documents   Document[]
  
  // Metadata
  createdById String
  createdBy   User      @relation(fields: [createdById], references: [id])
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  @@unique([companyId, parentId, name]) // لا يمكن مجلدين بنفس الاسم في نفس المستوى
  @@index([companyId])
  @@index([parentId])
  @@index([path])
}

// تحديث Document model
model Document {
  // ... existing fields ...
  
  // إضافة علاقة بالمجلد
  folderId    String?
  folder      Folder?   @relation(fields: [folderId], references: [id], onDelete: SetNull)
  
  // ... rest of fields ...
}
```

---

## 🔧 **2. Backend Implementation**

### **A. Folders Service (`backend/src/modules/folders/folders.service.ts`)**

```typescript
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class FoldersService {
  constructor(private prisma: PrismaService) {}

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
    const existing = await this.prisma.folder.findUnique({
      where: {
        companyId_parentId_name: {
          companyId,
          parentId,
          name,
        },
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
    folderId: string | null, // null = root
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
        createdAt: 'desc',
      },
    });

    // الحصول على معلومات المجلد الحالي (إذا لم يكن root)
    let currentFolder = null;
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
      documents,
      breadcrumbs,
    };
  }

  /**
   * بناء Breadcrumbs (المسار)
   */
  private async buildBreadcrumbs(folderId: string | null) {
    const breadcrumbs = [
      { id: null, name: 'الجذر', path: '/' },
    ];

    if (!folderId) return breadcrumbs;

    let currentFolder = await this.prisma.folder.findUnique({
      where: { id: folderId },
      include: { parent: true },
    });

    const path = [];
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
  async renameFolder(folderId: string, newName: string, userId: string) {
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
      include: { parent: true },
    });

    if (!folder) {
      throw new NotFoundException('المجلد غير موجود');
    }

    // بناء المسار الجديد
    let newPath = '/';
    if (folder.parentId) {
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
    userId: string,
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
      newPath = `${newParent.path}${folder.name}/`;
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
  async deleteFolder(folderId: string, userId: string) {
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

    // حذف جميع الملفات من MinIO
    // TODO: استدعاء StorageService لحذف الملفات

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
          { title: { contains: query, mode: 'insensitive' } },
          { originalFileName: { contains: query, mode: 'insensitive' } },
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

    return {
      folders,
      documents,
    };
  }
}
```

---

### **B. Folders Controller**

```typescript
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FoldersService } from './folders.service';

@Controller('folders')
@UseGuards(JwtAuthGuard)
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Post()
  async createFolder(
    @Body() body: { companyId: string; name: string; parentId?: string },
    @CurrentUser() user: any,
  ) {
    return this.foldersService.createFolder(
      body.companyId,
      body.name,
      body.parentId || null,
      user.id,
    );
  }

  @Get('company/:companyId')
  async getFolderContents(
    @Param('companyId') companyId: string,
    @Query('folderId') folderId?: string,
  ) {
    return this.foldersService.getFolderContents(companyId, folderId || null);
  }

  @Get('company/:companyId/tree')
  async getFolderTree(@Param('companyId') companyId: string) {
    return this.foldersService.getFolderTree(companyId);
  }

  @Patch(':id/rename')
  async renameFolder(
    @Param('id') id: string,
    @Body() body: { name: string },
    @CurrentUser() user: any,
  ) {
    return this.foldersService.renameFolder(id, body.name, user.id);
  }

  @Patch(':id/move')
  async moveFolder(
    @Param('id') id: string,
    @Body() body: { parentId: string | null },
    @CurrentUser() user: any,
  ) {
    return this.foldersService.moveFolder(id, body.parentId, user.id);
  }

  @Delete(':id')
  async deleteFolder(@Param('id') id: string, @CurrentUser() user: any) {
    return this.foldersService.deleteFolder(id, user.id);
  }

  @Get('company/:companyId/search')
  async search(
    @Param('companyId') companyId: string,
    @Query('q') query: string,
  ) {
    return this.foldersService.search(companyId, query);
  }
}
```

---

## 💻 **3. Frontend - File Explorer Component**

### **تابع في الملف التالي...**

