import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateShareDto } from './dto/create-share.dto';

@Injectable()
export class SharesService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, createShareDto: CreateShareDto, userId: string) {
    // Check if company exists and user is owner
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('الشركة غير موجودة');
    }

    if (company.ownerId !== userId) {
      throw new ForbiddenException('فقط مالك الشركة يمكنه مشاركتها');
    }

    // Check if user exists
    const userToShare = await this.prisma.user.findUnique({
      where: { id: createShareDto.sharedWithUserId },
    });

    if (!userToShare) {
      throw new NotFoundException('المستخدم المراد المشاركة معه غير موجود');
    }

    // Check if already shared
    const existingShare = await this.prisma.companyShare.findUnique({
      where: {
        companyId_sharedWithUserId: {
          companyId,
          sharedWithUserId: createShareDto.sharedWithUserId,
        },
      },
    });

    if (existingShare && existingShare.status === 'ACTIVE') {
      throw new BadRequestException('الشركة مشاركة مسبقاً مع هذا المستخدم');
    }

    // Create or reactivate share
    if (existingShare) {
      return this.prisma.companyShare.update({
        where: { id: existingShare.id },
        data: {
          status: 'ACTIVE',
          permissionLevel: createShareDto.permissionLevel as any,
          note: createShareDto.note,
          validUntil: createShareDto.validUntil,
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
        },
      });
    }

    return this.prisma.companyShare.create({
      data: {
        companyId,
        sharedWithUserId: createShareDto.sharedWithUserId,
        sharedByUserId: userId,
        permissionLevel: createShareDto.permissionLevel as any,
        note: createShareDto.note,
        validUntil: createShareDto.validUntil,
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
          },
        },
      },
    });
  }

  async findAll(companyId: string, userId: string) {
    // Check company access
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('الشركة غير موجودة');
    }

    if (company.ownerId !== userId) {
      throw new ForbiddenException('فقط مالك الشركة يمكنه رؤية المشاركات');
    }

    return this.prisma.companyShare.findMany({
      where: {
        companyId,
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
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(shareId: string, permissionLevel: string, userId: string) {
    const share = await this.prisma.companyShare.findUnique({
      where: { id: shareId },
      include: { company: true },
    });

    if (!share) {
      throw new NotFoundException('المشاركة غير موجودة');
    }

    if (share.company.ownerId !== userId) {
      throw new ForbiddenException('فقط مالك الشركة يمكنه تعديل المشاركة');
    }

    return this.prisma.companyShare.update({
      where: { id: shareId },
      data: { permissionLevel: permissionLevel as any },
    });
  }

  async revoke(shareId: string, userId: string) {
    const share = await this.prisma.companyShare.findUnique({
      where: { id: shareId },
      include: { company: true },
    });

    if (!share) {
      throw new NotFoundException('المشاركة غير موجودة');
    }

    if (share.company.ownerId !== userId) {
      throw new ForbiddenException('فقط مالك الشركة يمكنه إلغاء المشاركة');
    }

    return this.prisma.companyShare.update({
      where: { id: shareId },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
      },
    });
  }

  async getMyShares(userId: string) {
    return this.prisma.companyShare.findMany({
      where: {
        sharedWithUserId: userId,
        status: 'ACTIVE',
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            nameArabic: true,
            status: true,
            completionPercentage: true,
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        sharedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

