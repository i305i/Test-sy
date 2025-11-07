import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
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
import { SharesService } from './shares.service';
import { CreateShareDto } from './dto/create-share.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('shares')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class SharesController {
  constructor(private readonly sharesService: SharesService) {}

  @Post('companies/:companyId/shares')
  @ApiOperation({ summary: 'مشاركة الشركة مع مستخدم' })
  async create(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Body() createShareDto: CreateShareDto,
    @CurrentUser() user,
  ) {
    return {
      success: true,
      data: {
        share: await this.sharesService.create(companyId, createShareDto, user.id),
      },
      message: 'تم مشاركة الشركة بنجاح',
    };
  }

  @Get('companies/:companyId/shares')
  @ApiOperation({ summary: 'الحصول على قائمة مشاركات الشركة' })
  async findAll(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @CurrentUser() user,
  ) {
    return {
      success: true,
      data: await this.sharesService.findAll(companyId, user.id, user.role),
    };
  }

  @Patch('shares/:id')
  @ApiOperation({ summary: 'تحديث صلاحيات المشاركة' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { permissionLevel: string },
    @CurrentUser() user,
  ) {
    return {
      success: true,
      data: {
        share: await this.sharesService.update(id, body.permissionLevel, user.id),
      },
      message: 'تم تحديث الصلاحيات بنجاح',
    };
  }

  @Delete('shares/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'إلغاء المشاركة' })
  async revoke(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user,
  ) {
    await this.sharesService.revoke(id, user.id);
    return {
      success: true,
      message: 'تم إلغاء المشاركة بنجاح',
    };
  }

  @Get('shares/my-shares')
  @ApiOperation({ summary: 'الحصول على الشركات المشاركة معي' })
  async getMyShares(@CurrentUser() user) {
    return {
      success: true,
      data: {
        shares: await this.sharesService.getMyShares(user.id),
      },
    };
  }
}

