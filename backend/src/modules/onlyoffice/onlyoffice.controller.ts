import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { OnlyOfficeService } from './onlyoffice.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('onlyoffice')
@Controller('onlyoffice')
export class OnlyOfficeController {
  constructor(private readonly onlyOfficeService: OnlyOfficeService) {}

  @Get('config/:documentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'الحصول على إعدادات محرر OnlyOffice' })
  async getEditorConfig(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Query('mode') mode: 'edit' | 'view' = 'edit',
    @CurrentUser() user: any,
  ) {
    return {
      success: true,
      data: await this.onlyOfficeService.getEditorConfig(
        documentId,
        user.id,
        user.role,
        mode,
      ),
    };
  }

  @Post('callback')
  @Public()
  @ApiOperation({ summary: 'Callback من OnlyOffice Document Server' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        key: { type: 'string' },
        status: { type: 'number' },
        url: { type: 'string' },
        changesurl: { type: 'string' },
        history: { type: 'object' },
        users: { type: 'array' },
        actions: { type: 'array' },
        forcesavetype: { type: 'number' },
      },
    },
  })
  async handleCallback(@Body() body: any) {
    const result = await this.onlyOfficeService.handleCallback(body);
    return result;
  }
}

