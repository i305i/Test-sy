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
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Res,
  Req,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { ShareDocumentDto } from './dto/share-document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  // ============================================================================
  // CRUD Operations (companies/:companyId/documents)
  // ============================================================================

  @Post('companies/:companyId/documents')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'رفع وثيقة جديدة' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        name: { type: 'string' },
        category: { type: 'string' },
        documentType: { type: 'string' },
        description: { type: 'string' },
        issueDate: { type: 'string', format: 'date' },
        expiryDate: { type: 'string', format: 'date' },
        tags: { type: 'array', items: { type: 'string' } },
        parentDocumentId: { type: 'string' },
        folderId: { type: 'string' },
      },
    },
  })
  async upload(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadDocumentDto,
    @CurrentUser() user,
  ) {
    return {
      success: true,
      data: {
        document: await this.documentsService.upload(
          companyId,
          file,
          uploadDto,
          user.id,
        ),
      },
    };
  }

  @Post('companies/:companyId/documents/bulk')
  @UseInterceptors(
    FilesInterceptor('files', 50, {
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB per file
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'رفع ملفات متعددة' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
        category: { type: 'string' },
        folderId: { type: 'string' },
      },
    },
  })
  async uploadMultiple(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: { category?: string; folderId?: string },
    @CurrentUser() user,
  ) {
    return {
      success: true,
      data: {
        documents: await this.documentsService.uploadMultiple(
          companyId,
          files,
          { category: body.category || 'OTHER', folderId: body.folderId },
          user.id,
        ),
      },
    };
  }

  @Post('companies/:companyId/documents/:id/replace')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'استبدال ملف موجود' })
  async replaceFile(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user,
  ) {
    return {
      success: true,
      data: {
        document: await this.documentsService.replaceFile(
          companyId,
          id,
          file,
          user.id,
        ),
      },
    };
  }

  @Get('companies/:companyId/documents/download-all')
  @ApiOperation({ summary: 'تحميل جميع ملفات الشركة كـ ZIP' })
  async downloadAll(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Res() res,
    @CurrentUser() user,
  ) {
    const { stream, fileName } = await this.documentsService.downloadAllAsZip(
      companyId,
      user.id,
      user.role,
    );

    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    });

    stream.pipe(res);
  }

  @Get('documents')
  @ApiOperation({ summary: 'الحصول على جميع الوثائق (لجميع الشركات)' })
  async findAllDocuments(
    @Query() query: any,
    @CurrentUser() user,
  ) {
    return {
      success: true,
      data: await this.documentsService.findAllDocuments(
        query,
        user.id,
        user.role,
      ),
    };
  }

  @Get('companies/:companyId/documents')
  @ApiOperation({ summary: 'الحصول على قائمة الوثائق' })
  async findAll(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Query() query: any,
    @CurrentUser() user,
  ) {
    return {
      success: true,
      data: await this.documentsService.findAll(
        companyId,
        query,
        user.id,
        user.role,
      ),
    };
  }

  @Get('companies/:companyId/documents/:id')
  @ApiOperation({ summary: 'الحصول على تفاصيل وثيقة' })
  async findOne(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user,
  ) {
    return {
      success: true,
      data: await this.documentsService.findOne(id, user.id, user.role),
    };
  }

  @Patch('companies/:companyId/documents/:id')
  @ApiOperation({ summary: 'تحديث الوثيقة' })
  async update(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateDocumentDto,
    @CurrentUser() user,
  ) {
    return {
      success: true,
      data: await this.documentsService.update(id, updateDto, user.id, user.role),
    };
  }

  @Post('companies/:companyId/documents/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'الموافقة على الوثيقة' })
  async approve(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user,
  ) {
    return {
      success: true,
      data: await this.documentsService.approve(id, user.id),
      message: 'تمت الموافقة على الوثيقة',
    };
  }

  @Post('companies/:companyId/documents/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'رفض الوثيقة' })
  async reject(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { reason: string },
    @CurrentUser() user,
  ) {
    return {
      success: true,
      data: await this.documentsService.reject(id, body.reason, user.id),
      message: 'تم رفض الوثيقة',
    };
  }

  @Get('companies/:companyId/documents/:id/download')
  @ApiOperation({ summary: 'تحميل الوثيقة مباشرة' })
  async download(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user,
    @Res() res,
  ) {
    const { stream, mimeType, fileName } = await this.documentsService.download(
      id,
      user.id,
      user.role,
    );

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    });

    stream.pipe(res);
  }

  @Delete('companies/:companyId/documents/:id')
  @ApiOperation({ summary: 'حذف الوثيقة' })
  async remove(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user,
  ) {
    await this.documentsService.remove(id, user.id, user.role);
    return {
      success: true,
      message: 'تم حذف الوثيقة بنجاح',
    };
  }

  // ============================================================================
  // Secure Token Operations (documents/*)
  // ============================================================================

  @Post('documents/:id/generate-token')
  @ApiOperation({ summary: 'إنشاء token آمن للمعاينة أو التحميل' })
  async generateToken(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { purpose: 'PREVIEW' | 'DOWNLOAD' },
    @CurrentUser() user,
    @Req() req,
  ) {
    return {
      success: true,
      data: await this.documentsService.generateDownloadToken(
        id,
        user.id,
        user.role,
        body.purpose,
        req.ip,
        req.headers['user-agent'],
      ),
    };
  }

  @Get('documents/stream/:token')
  @Public() // No JWT required - token itself is the auth
  @ApiOperation({ summary: 'معاينة الملف عبر Proxy (One-Time Token)' })
  async streamWithToken(
    @Param('token') token: string,
    @Res() res,
    @Req() req,
  ) {
    const { stream, mimeType, fileName } = await this.documentsService.streamWithToken(
      token,
      req.ip,
      req.headers['user-agent'],
    );

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(fileName)}"`,
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
    });

    stream.pipe(res);
  }

  @Get('documents/download/:token')
  @Public() // No JWT required - token itself is the auth
  @ApiOperation({ summary: 'تحميل الملف عبر Proxy (One-Time Token)' })
  async downloadWithToken(
    @Param('token') token: string,
    @Res() res,
    @Req() req,
  ) {
    const { stream, mimeType, fileName } = await this.documentsService.downloadWithToken(
      token,
      req.ip,
      req.headers['user-agent'],
    );

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Content-Type-Options': 'nosniff',
    });

    stream.pipe(res);
  }

  // ============================================================================
  // Document Sharing Endpoints
  // ============================================================================

  @Post('companies/:companyId/documents/:id/share')
  @ApiOperation({ summary: 'مشاركة المستند مع مستخدم' })
  async shareDocument(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() shareDto: ShareDocumentDto,
    @CurrentUser() user,
  ) {
    return {
      success: true,
      data: {
        share: await this.documentsService.shareDocument(
          id,
          companyId,
          shareDto,
          user.id,
          user.role,
        ),
      },
      message: 'تم مشاركة المستند بنجاح',
    };
  }

  @Get('companies/:companyId/documents/:id/shares')
  @ApiOperation({ summary: 'الحصول على قائمة مشاركات المستند' })
  async getDocumentShares(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user,
  ) {
    return {
      success: true,
      data: await this.documentsService.getDocumentShares(id, user.id, user.role),
    };
  }

  @Get('documents/shared-by-me')
  @ApiOperation({ summary: 'الحصول على المستندات التي شاركها المستخدم' })
  async getDocumentsSharedByMe(
    @Query('companyId') companyId: string | undefined,
    @CurrentUser() user,
  ) {
    return {
      success: true,
      data: await this.documentsService.getDocumentsSharedByUser(user.id, companyId),
    };
  }

  @Patch('documents/shares/:id/permission')
  @ApiOperation({ summary: 'تحديث صلاحيات مشاركة المستند' })
  async updateDocumentShare(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { permissionLevel: string },
    @CurrentUser() user,
  ) {
    return {
      success: true,
      data: {
        share: await this.documentsService.updateDocumentShare(
          id,
          body.permissionLevel,
          user.id,
          user.role,
        ),
      },
      message: 'تم تحديث الصلاحيات بنجاح',
    };
  }

  @Delete('documents/shares/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'إلغاء مشاركة المستند' })
  async revokeDocumentShare(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user,
  ) {
    await this.documentsService.revokeDocumentShare(id, user.id, user.role);
    return {
      success: true,
      message: 'تم إلغاء المشاركة بنجاح',
    };
  }
}

