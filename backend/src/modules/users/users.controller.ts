import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'الحصول على قائمة المستخدمين' })
  async findAll(@Query() query: any) {
    return {
      success: true,
      data: await this.usersService.findAll(query),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'الحصول على مستخدم محدد' })
  async findOne(@Param('id') id: string) {
    return {
      success: true,
      data: {
        user: await this.usersService.findById(id),
      },
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'تحديث بيانات المستخدم' })
  async update(@Param('id') id: string, @Body() updateData: any) {
    return {
      success: true,
      data: {
        user: await this.usersService.update(id, updateData),
      },
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف المستخدم' })
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
    return {
      success: true,
      message: 'تم حذف المستخدم بنجاح',
    };
  }
}

