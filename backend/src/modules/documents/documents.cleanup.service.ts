import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DocumentsCleanupService {
  private readonly logger = new Logger(DocumentsCleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async cleanupExpiredTokens() {
    try {
      const result = await this.prisma.downloadToken.deleteMany({
        where: {
          OR: [
            // Token منتهي الصلاحية
            { expiresAt: { lt: new Date() } },
            // Token مستخدم وأقدم من 24 ساعة
            {
              used: true,
              usedAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            },
          ],
        },
      });

      if (result.count > 0) {
        this.logger.log(`🧹 Cleaned up ${result.count} expired/used download tokens`);
      }
    } catch (error) {
      this.logger.error('Failed to cleanup expired tokens:', error);
    }
  }
}

