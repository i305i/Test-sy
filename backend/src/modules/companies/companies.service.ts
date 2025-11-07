import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { FoldersService } from '../folders/folders.service';
import { DocumentsService } from '../documents/documents.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CompaniesService {
  constructor(
    private prisma: PrismaService,
    private foldersService: FoldersService,
    private documentsService: DocumentsService,
  ) {}

  async create(createCompanyDto: CreateCompanyDto, userId: string) {
    // معالجة السجل التجاري - إذا كان فارغاً، ضع "لا يوجد"
    const commercialRegistration = createCompanyDto.commercialRegistration?.trim() || 'لا يوجد';

    // إنشاء الشركة في قاعدة البيانات
    const company = await this.prisma.company.create({
      data: {
        name: createCompanyDto.name,
        companyType: createCompanyDto.companyType as any,
        commercialRegistration: commercialRegistration === 'لا يوجد' ? null : commercialRegistration,
        ownerId: userId,
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // إنشاء المجلدات الأساسية تلقائياً
    try {
      const defaultFolders = [
        '0- عام',
        '1- الخطابات',
        '2- القوائم المالية',
        '3- ملف المراجعة',
        'WP',
        'متطلبات',
      ];

      const createdFolders: Record<string, any> = {};

      for (const folderName of defaultFolders) {
        try {
          const folder = await this.foldersService.createFolder(
            company.id,
            folderName,
            null, // parentId = null يعني مجلد رئيسي
            userId,
          );
          createdFolders[folderName] = folder;
        } catch (error) {
          // تجاهل الأخطاء إذا كان المجلد موجوداً بالفعل
          console.log(`⚠️ Folder ${folderName} already exists or error:`, error.message);
        }
      }

      // إنشاء المجلدات الفرعية داخل "3- ملف المراجعة"
      if (createdFolders['3- ملف المراجعة']) {
        const auditSubFolders = [
          '1- الاصول الثابتة',
          '2- مخزون',
          '3- ذمم مدينة',
          '4- ارصدة مدينة اخرى',
          '5- النقدية ومافي حكمها',
          '6- اطراف ذات علاقة',
          '7- منافع الموظفين',
          '8- القروض والتسهيلات البنكية',
          '10- التزامات التاجير التمويلي',
          '11-الذمم الدائنة',
          '12- ارصدة دائنة اخرى',
          '13- الايرادات',
          '14- التكاليف',
          '15- مصاريف ادارية وعمومية',
          '16- مصاريف تسويقية',
          '17- ايرادات اخرى',
          'عشوائي',
        ];

        for (const subFolderName of auditSubFolders) {
          try {
            const subFolder = await this.foldersService.createFolder(
              company.id,
              subFolderName,
              createdFolders['3- ملف المراجعة'].id,
              userId,
            );
            createdFolders[`3- ملف المراجعة/${subFolderName}`] = subFolder;
          } catch (error) {
            console.log(`⚠️ Sub-folder ${subFolderName} error:`, error.message);
          }
        }
      }

      // إنشاء المجلدات الفرعية داخل "1- الخطابات"
      if (createdFolders['1- الخطابات']) {
        const lettersSubFolders = ['خطابات عربي', 'خطابات انقليزي'];
        for (const subFolderName of lettersSubFolders) {
          try {
            const subFolder = await this.foldersService.createFolder(
              company.id,
              subFolderName,
              createdFolders['1- الخطابات'].id,
              userId,
            );
            createdFolders[`1- الخطابات/${subFolderName}`] = subFolder;
          } catch (error) {
            console.log(`⚠️ Sub-folder ${subFolderName} error:`, error.message);
          }
        }
      }

      // إنشاء المجلدات الفرعية داخل "2- القوائم المالية"
      if (createdFolders['2- القوائم المالية']) {
        const financialSubFolders = ['مسودات عربية', 'مسودات انقليزية'];
        for (const subFolderName of financialSubFolders) {
          try {
            const subFolder = await this.foldersService.createFolder(
              company.id,
              subFolderName,
              createdFolders['2- القوائم المالية'].id,
              userId,
            );
            createdFolders[`2- القوائم المالية/${subFolderName}`] = subFolder;
          } catch (error) {
            console.log(`⚠️ Sub-folder ${subFolderName} error:`, error.message);
          }
        }
      }

      console.log(`✅ Created company with default folders: ${company.name}`);

      // نسخ جميع الملفات من المجلدات النموذجية بشكل كامل
      await this.copyTemplateFiles(company.id, createdFolders, defaultFolders, userId);
    } catch (error) {
      console.error('⚠️ Error creating default folders:', error);
    }

    return company;
  }

  /**
   * نسخ الملفات من المجلدات النموذجية إلى الشركة الجديدة
   */
  private async copyTemplateFiles(
    companyId: string,
    folders: Record<string, any>,
    defaultFolders: string[],
    userId: string,
  ) {
    // process.cwd() في NestJS يكون مجلد backend، لذا نرجع مستوى واحد للأعلى
    const backendPath = process.cwd();
    const rootPath = path.resolve(backendPath, '..');
    const templateBasePath = path.join(rootPath, 'نموذج لخالد');
    
    console.log(`🔍 Looking for template folder at: ${templateBasePath}`);
    console.log(`📁 Current working directory: ${process.cwd()}`);
    console.log(`📁 Root path: ${rootPath}`);
    
    if (!fs.existsSync(templateBasePath)) {
      console.log(`⚠️ Template folder not found at: ${templateBasePath}`);
      console.log(`💡 Please make sure the folder "نموذج لخالد" exists in the project root`);
      return;
    }

    console.log(`✅ Found template folder: ${templateBasePath}`);

    try {
      // نسخ جميع الملفات بشكل كامل من كل مجلد رئيسي
      for (const folderName of defaultFolders) {
        if (folders[folderName]) {
          const folderPath = path.join(templateBasePath, folderName);
          if (fs.existsSync(folderPath)) {
            console.log(`📂 Copying files from: ${folderPath}`);
            await this.copyFolderRecursively(
              companyId,
              templateBasePath,
              folderName,
              folders,
              userId,
            );
          } else {
            console.log(`⚠️ Folder not found: ${folderPath}`);
          }
        }
      }

      console.log(`✅ Copied all template files for company: ${companyId}`);
    } catch (error) {
      console.error('⚠️ Error copying template files:', error);
    }
  }

  /**
   * نسخ مجلد بشكل متكرر مع جميع محتوياته
   */
  private async copyFolderRecursively(
    companyId: string,
    templateBasePath: string,
    relativePath: string,
    folders: Record<string, any>,
    userId: string,
  ) {
    const currentPath = path.join(templateBasePath, relativePath);
    
    if (!fs.existsSync(currentPath)) {
      return;
    }

    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const itemPath = path.join(currentPath, item);
      const stats = fs.statSync(itemPath);

      // تخطي الملفات المؤقتة والملفات المخفية
      if (item.startsWith('~$') || item.startsWith('.')) {
        continue;
      }

      if (stats.isDirectory()) {
        // بناء مفتاح المجلد للبحث
        const folderKey = relativePath ? `${relativePath}/${item}` : item;
        
        // البحث عن المجلد في القائمة
        let folderId = folders[folderKey]?.id;

        if (!folderId) {
          // البحث عن المجلد الأب
          const parentPath = path.dirname(relativePath || item);
          const parentKey = parentPath === '.' || parentPath === item ? '' : parentPath;
          const parentFolder = folders[parentKey] || (parentKey ? null : null);
          const parentId = parentFolder?.id || null;

          try {
            const newFolder = await this.foldersService.createFolder(
              companyId,
              item,
              parentId,
              userId,
            );
            folders[folderKey] = newFolder;
            folderId = newFolder.id;
            console.log(`✅ Created folder: ${folderKey}`);
          } catch (error) {
            console.log(`⚠️ Error creating folder ${item}:`, error.message);
            // محاولة البحث عن المجلد الموجود
            const existingFolders = await this.prisma.folder.findMany({
              where: {
                companyId,
                parentId: parentId,
                name: item,
              },
            });
            if (existingFolders.length > 0) {
              folders[folderKey] = existingFolders[0];
              folderId = existingFolders[0].id;
            } else {
              continue;
            }
          }
        }

        // نسخ محتويات المجلد بشكل متكرر
        await this.copyFolderRecursively(
          companyId,
          templateBasePath,
          folderKey,
          folders,
          userId,
        );
      } else if (stats.isFile()) {
        // رفع الملف
        const parentPath = relativePath || '';
        const parentFolder = folders[parentPath];
        const folderId = parentFolder?.id || null;

        try {
          console.log(`📄 Uploading file: ${item} to folder: ${parentPath || 'root'}`);
          await this.uploadTemplateFile(
            companyId,
            itemPath,
            item,
            folderId,
            userId,
          );
          console.log(`✅ Successfully uploaded: ${item}`);
        } catch (error) {
          console.log(`⚠️ Error uploading file ${item}:`, error.message);
        }
      }
    }
  }

  /**
   * رفع ملف من المجلد النموذجي إلى النظام
   */
  private async uploadTemplateFile(
    companyId: string,
    filePath: string,
    fileName: string,
    folderId: string | null,
    userId: string,
  ) {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const stats = fs.statSync(filePath);
      const ext = path.extname(fileName);
      const mimeType = this.getMimeType(ext);

      // إنشاء ملف Express.Multer.File
      const file: Express.Multer.File = {
        fieldname: 'file',
        originalname: fileName,
        encoding: '7bit',
        mimetype: mimeType,
        size: stats.size,
        buffer: fileBuffer,
        destination: '',
        filename: fileName,
        path: filePath,
        stream: null as any,
      };

      // رفع الملف
      await this.documentsService.upload(
        companyId,
        file,
        {
          name: fileName,
          folderId: folderId || undefined,
          category: 'OTHER',
        },
        userId,
      );
    } catch (error) {
      console.error(`⚠️ Error uploading template file ${fileName}:`, error.message);
    }
  }

  /**
   * تحديد نوع الملف من الامتداد
   */
  private getMimeType(ext: string): string {
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.txt': 'text/plain',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
    };
    return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
  }

  async findAll(query: any, userId: string, userRole: string) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const { status, search, sort = 'createdAt', order = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Role-based filtering
    if (userRole === 'EMPLOYEE') {
      where.OR = [
        { ownerId: userId },
        {
          shares: {
            some: {
              sharedWithUserId: userId,
              status: 'ACTIVE',
            },
          },
        },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameArabic: { contains: search, mode: 'insensitive' } },
        { commercialRegistration: { contains: search } },
        { taxNumber: { contains: search } },
      ];
    }

    const [companies, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sort]: order },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              documents: true,
              shares: true,
              folders: true,
            },
          },
        },
      }),
      this.prisma.company.count({ where }),
    ]);

    return {
      companies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async findOne(id: string, userId: string, userRole: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        shares: {
          where: { status: 'ACTIVE' },
          include: {
            sharedWithUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
          _count: {
            select: {
              documents: true,
              shares: true,
            },
          },
      },
    });

    if (!company) {
      throw new NotFoundException('الشركة غير موجودة');
    }

    // Check access permissions
    if (userRole === 'EMPLOYEE') {
      const hasAccess = 
        company.ownerId === userId ||
        company.shares.some(share => share.sharedWithUserId === userId);

      if (!hasAccess) {
        throw new ForbiddenException('ليس لديك صلاحية للوصول لهذه الشركة');
      }
    }

    return company;
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto, userId: string, userRole: string) {
    const company = await this.findOne(id, userId, userRole);

    // Check if user has edit permission
    if (userRole === 'EMPLOYEE' && company.ownerId !== userId) {
      const share = company.shares.find(s => s.sharedWithUserId === userId);
      if (!share || share.permissionLevel === 'VIEW') {
        throw new ForbiddenException('ليس لديك صلاحية لتعديل هذه الشركة');
      }
    }

    return this.prisma.company.update({
      where: { id },
      data: {
        ...updateCompanyDto,
        companyType: updateCompanyDto.companyType as any,
        status: updateCompanyDto.status as any,
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: string, userRole: string) {
    const company = await this.findOne(id, userId, userRole);

    // Only owner or admin can delete
    if (userRole === 'EMPLOYEE' && company.ownerId !== userId) {
      throw new ForbiddenException('ليس لديك صلاحية لحذف هذه الشركة');
    }

    return this.prisma.company.delete({
      where: { id },
    });
  }

  async calculateCompletion(id: string): Promise<number> {
    const documentsCount = await this.prisma.document.count({
      where: {
        companyId: id,
        status: 'APPROVED',
        isLatestVersion: true,
      },
    });

    // Assuming 10 documents are required
    const requiredDocuments = 10;
    const completion = Math.round((documentsCount / requiredDocuments) * 100);

    await this.prisma.company.update({
      where: { id },
      data: { completionPercentage: Math.min(completion, 100) },
    });

    return completion;
  }
}

