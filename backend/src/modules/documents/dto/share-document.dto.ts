import { IsUUID, IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ShareDocumentDto {
  @ApiProperty({ description: 'معرف المستخدم المراد المشاركة معه' })
  @IsUUID()
  sharedWithUserId: string;

  @ApiProperty({
    enum: ['VIEW', 'EDIT', 'MANAGE'],
    description: 'مستوى الصلاحية',
    example: 'VIEW',
  })
  @IsEnum(['VIEW', 'EDIT', 'MANAGE'])
  permissionLevel: string;

  @ApiPropertyOptional({ description: 'ملاحظة' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ description: 'تاريخ انتهاء الصلاحية' })
  @IsOptional()
  @IsDateString()
  validUntil?: string;
}

