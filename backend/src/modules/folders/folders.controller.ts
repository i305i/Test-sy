import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FoldersService } from './folders.service';

@Controller('folders')
@UseGuards(JwtAuthGuard)
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Post()
  async createFolder(
    @Body() body: { companyId: string; name: string; parentId?: string },
    @CurrentUser() user: any,
  ) {
    return {
      success: true,
      data: await this.foldersService.createFolder(
        body.companyId,
        body.name,
        body.parentId || null,
        user.id,
      ),
    };
  }

  @Get('company/:companyId')
  async getFolderContents(
    @Param('companyId') companyId: string,
    @Query('folderId') folderId?: string,
  ) {
    return {
      success: true,
      data: await this.foldersService.getFolderContents(companyId, folderId || null),
    };
  }

  @Get('company/:companyId/tree')
  async getFolderTree(@Param('companyId') companyId: string) {
    return {
      success: true,
      data: await this.foldersService.getFolderTree(companyId),
    };
  }

  @Patch(':id/rename')
  async renameFolder(
    @Param('id') id: string,
    @Body() body: { name: string },
  ) {
    return {
      success: true,
      data: await this.foldersService.renameFolder(id, body.name),
    };
  }

  @Patch(':id/move')
  async moveFolder(
    @Param('id') id: string,
    @Body() body: { parentId: string | null },
  ) {
    return {
      success: true,
      data: await this.foldersService.moveFolder(id, body.parentId),
    };
  }

  @Delete(':id')
  async deleteFolder(@Param('id') id: string) {
    await this.foldersService.deleteFolder(id);
    return {
      success: true,
      message: 'تم حذف المجلد بنجاح',
    };
  }

  @Get('company/:companyId/search')
  async search(
    @Param('companyId') companyId: string,
    @Query('q') query: string,
  ) {
    return {
      success: true,
      data: await this.foldersService.search(companyId, query),
    };
  }
}

