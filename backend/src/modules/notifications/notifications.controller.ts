import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'الحصول على قائمة الإشعارات' })
  async findAll(@Query() query: any, @CurrentUser() user) {
    return {
      success: true,
      data: await this.notificationsService.findAll(user.id, query),
    };
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تحديد الإشعار كمقروء' })
  async markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user,
  ) {
    return {
      success: true,
      data: {
        notification: await this.notificationsService.markAsRead(id, user.id),
      },
    };
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تحديد جميع الإشعارات كمقروءة' })
  async markAllAsRead(@CurrentUser() user) {
    await this.notificationsService.markAllAsRead(user.id);
    return {
      success: true,
      message: 'تم تحديد جميع الإشعارات كمقروءة',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف إشعار' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user,
  ) {
    await this.notificationsService.delete(id, user.id);
    return {
      success: true,
      message: 'تم حذف الإشعار بنجاح',
    };
  }

  @Delete()
  @ApiOperation({ summary: 'حذف جميع الإشعارات' })
  async deleteAll(@CurrentUser() user) {
    await this.notificationsService.deleteAll(user.id);
    return {
      success: true,
      message: 'تم حذف جميع الإشعارات',
    };
  }
}

