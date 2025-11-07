import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'الحصول على إحصائيات عامة' })
  async getStats(@CurrentUser() user) {
    return {
      success: true,
      data: await this.dashboardService.getStats(user.id, user.role),
    };
  }

  @Get('charts/companies')
  @ApiOperation({ summary: 'الحصول على بيانات رسم بياني للشركات' })
  async getCompaniesChart(@CurrentUser() user) {
    return {
      success: true,
      data: await this.dashboardService.getCompaniesChart(user.id, user.role),
    };
  }

  @Get('employees')
  @ApiOperation({ summary: 'الحصول على قائمة الموظفين مع شركاتهم وأنشطتهم' })
  async getEmployeesWithCompanies(@CurrentUser() user) {
    return {
      success: true,
      data: await this.dashboardService.getEmployeesWithCompanies(user.id, user.role),
    };
  }
}

