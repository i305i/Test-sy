import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsArray,
  IsUUID,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UploadDocumentDto {
  @ApiPropertyOptional({ description: 'اسم الوثيقة' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    enum: ['LEGAL', 'FINANCIAL', 'HR', 'GOVERNMENT', 'CONTRACT', 'REPORT', 'OTHER'],
  })
  @IsOptional()
  @IsEnum(['LEGAL', 'FINANCIAL', 'HR', 'GOVERNMENT', 'CONTRACT', 'REPORT', 'OTHER'])
  category?: string;

  @ApiPropertyOptional({ description: 'نوع الوثيقة' })
  @IsOptional()
  @IsString()
  documentType?: string;

  @ApiPropertyOptional({ description: 'وصف الوثيقة' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'تاريخ الإصدار' })
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @ApiPropertyOptional({ description: 'تاريخ الانتهاء' })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional({ description: 'الوسوم', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'معرف الوثيقة الأصلية (للإصدارات)' })
  @IsOptional()
  @IsUUID()
  parentDocumentId?: string;

  @ApiPropertyOptional({ description: 'معرف المجلد' })
  @IsOptional()
  @IsUUID()
  folderId?: string;
}

