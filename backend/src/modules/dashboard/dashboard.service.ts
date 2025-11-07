import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(userId: string, userRole: string) {
    const where: any = {};

    // Filter by user role
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

    const [
      totalCompanies,
      readyCompanies,
      inProgressCompanies,
      onHoldCompanies,
      totalDocuments,
      pendingDocuments,
      approvedDocuments,
      rejectedDocuments,
      expiringDocuments,
      totalUsers,
      activeUsers,
      recentActivities,
    ] = await Promise.all([
      // Companies stats
      this.prisma.company.count({ where }),
      this.prisma.company.count({ where: { ...where, status: 'READY' } }),
      this.prisma.company.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      this.prisma.company.count({ where: { ...where, status: 'ON_HOLD' } }),

      // Documents stats
      this.prisma.document.count({
        where: {
          company: where,
        },
      }),
      this.prisma.document.count({
        where: {
          company: where,
          status: 'PENDING',
        },
      }),
      this.prisma.document.count({
        where: {
          company: where,
          status: 'APPROVED',
        },
      }),
      this.prisma.document.count({
        where: {
          company: where,
          status: 'REJECTED',
        },
      }),

      // Expiring documents (next 30 days)
      this.prisma.document.count({
        where: {
          company: where,
          expiryDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Users stats (admin only)
      userRole !== 'EMPLOYEE'
        ? this.prisma.user.count()
        : 0,
      userRole !== 'EMPLOYEE'
        ? this.prisma.user.count({ where: { status: 'ACTIVE' } })
        : 0,

      // Recent activities (audit logs)
      this.prisma.auditLog.findMany({
        where: userRole === 'EMPLOYEE' ? { userId } : undefined,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
    ]);

    return {
      companies: {
        total: totalCompanies,
        ready: readyCompanies,
        inProgress: inProgressCompanies,
        onHold: onHoldCompanies,
      },
      documents: {
        total: totalDocuments,
        pending: pendingDocuments,
        approved: approvedDocuments,
        rejected: rejectedDocuments,
        expiringSoon: expiringDocuments,
      },
      users: {
        total: totalUsers,
        active: activeUsers,
      },
      recentActivities,
    };
  }

  async getCompaniesChart(userId: string, userRole: string) {
    const where: any = {};

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

    // Get companies created in last 12 months
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 11);
    startDate.setDate(1);

    const companies = await this.prisma.company.findMany({
      where: {
        ...where,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
        status: true,
      },
    });

    // Group by month and status
    const monthlyData: any[] = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);
      
      const monthCompanies = companies.filter(
        (c) => 
          c.createdAt.getMonth() === date.getMonth() &&
          c.createdAt.getFullYear() === date.getFullYear(),
      );

      monthlyData.push({
        month: date.toLocaleDateString('ar-SA', { month: 'short', year: 'numeric' }),
        total: monthCompanies.length,
        ready: monthCompanies.filter(c => c.status === 'READY').length,
        inProgress: monthCompanies.filter(c => c.status === 'IN_PROGRESS').length,
      });
    }

    return monthlyData;
  }

  async getEmployeesWithCompanies(userId: string, userRole: string) {
    // Only admins and supervisors can see all employees
    if (userRole === 'EMPLOYEE') {
      throw new Error('ليس لديك صلاحية لعرض الموظفين');
    }

    const employees = await this.prisma.user.findMany({
      where: {
        role: 'EMPLOYEE',
        status: 'ACTIVE',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get companies and activities for each employee
    const employeesWithData = await Promise.all(
      employees.map(async (employee) => {
        // Get companies owned by this employee
        const companies = await this.prisma.company.findMany({
          where: {
            ownerId: employee.id,
          },
          select: {
            id: true,
            name: true,
            status: true,
            createdAt: true,
            _count: {
              select: {
                documents: true,
                folders: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        // Get recent activities for this employee
        const activities = await this.prisma.auditLog.findMany({
          where: {
            userId: employee.id,
          },
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            action: true,
            resourceType: true,
            resourceId: true,
            createdAt: true,
            details: true,
          },
        });

        return {
          ...employee,
          companies,
          activities,
          totalCompanies: companies.length,
          totalDocuments: companies.reduce((sum, c) => sum + c._count.documents, 0),
        };
      }),
    );

    return employeesWithData;
  }
}

