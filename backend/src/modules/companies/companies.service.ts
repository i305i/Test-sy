import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async create(createCompanyDto: CreateCompanyDto, userId: string) {
    // إنشاء الشركة في قاعدة البيانات
    const company = await this.prisma.company.create({
      data: {
        ...createCompanyDto,
        companyType: createCompanyDto.companyType as any,
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

    // إنشاء مجلد الشركة في MinIO تلقائياً
    try {
      const folderPath = `companies/${company.id}/`;
      console.log(`✅ Company folder ready: ${folderPath}`);
      // MinIO سينشئ المجلد تلقائياً عند رفع أول ملف
    } catch (error) {
      console.error('⚠️ Error preparing company folder:', error);
    }

    return company;
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

