import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('companies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @ApiOperation({ summary: 'إنشاء شركة جديدة' })
  @ApiResponse({ status: 201, description: 'تم إنشاء الشركة بنجاح' })
  async create(
    @Body() createCompanyDto: CreateCompanyDto,
    @CurrentUser() user,
  ) {
    return {
      success: true,
      data: {
        company: await this.companiesService.create(createCompanyDto, user.id),
      },
    };
  }

  @Get()
  @ApiOperation({ summary: 'الحصول على قائمة الشركات' })
  async findAll(@Query() query: any, @CurrentUser() user) {
    return {
      success: true,
      data: await this.companiesService.findAll(query, user.id, user.role),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'الحصول على شركة محددة' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user) {
    return {
      success: true,
      data: {
        company: await this.companiesService.findOne(id, user.id, user.role),
      },
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'تحديث بيانات الشركة' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
    @CurrentUser() user,
  ) {
    return {
      success: true,
      data: {
        company: await this.companiesService.update(id, updateCompanyDto, user.id, user.role),
      },
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف الشركة' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user) {
    await this.companiesService.remove(id, user.id, user.role);
    return {
      success: true,
      message: 'تم حذف الشركة بنجاح',
    };
  }

  @Post(':id/calculate-completion')
  @ApiOperation({ summary: 'حساب نسبة اكتمال الوثائق' })
  async calculateCompletion(@Param('id', ParseUUIDPipe) id: string) {
    return {
      success: true,
      data: {
        completion: await this.companiesService.calculateCompletion(id),
      },
    };
  }
}

