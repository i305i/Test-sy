import { Injectable } from '@nestjs/common';
import { PrismaService } from './database/prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  async getHealth() {
    try {
      // Check database connection
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        success: true,
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        database: 'connected',
      };
    } catch (error) {
      return {
        success: false,
        status: 'error',
        database: 'disconnected',
        error: error.message,
      };
    }
  }
}
