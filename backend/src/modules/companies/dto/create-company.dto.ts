import {
  IsString,
  IsOptional,
  IsEnum,
  IsEmail,
  IsDateString,
  IsArray,
  IsObject,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCompanyDto {
  @ApiProperty({ description: 'اسم الشركة', example: 'شركة النجاح للتجارة' })
  @IsString()
  @MinLength(3, { message: 'اسم الشركة يجب أن يكون 3 أحرف على الأقل' })
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'اسم الشركة بالعربية' })
  @IsOptional()
  @IsString()
  nameArabic?: string;

  @ApiPropertyOptional({ description: 'وصف الشركة' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ enum: ['INDIVIDUAL', 'PARTNERSHIP', 'LLC', 'PUBLIC_COMPANY', 'PRIVATE_COMPANY', 'NON_PROFIT'] })
  @IsOptional()
  @IsEnum(['INDIVIDUAL', 'PARTNERSHIP', 'LLC', 'PUBLIC_COMPANY', 'PRIVATE_COMPANY', 'NON_PROFIT'])
  companyType?: string;

  @ApiPropertyOptional({ description: 'رقم السجل التجاري (10 أرقام)' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{10}$/, { message: 'رقم السجل التجاري يجب أن يكون 10 أرقام' })
  commercialRegistration?: string;

  @ApiPropertyOptional({ description: 'الرقم الضريبي (15 رقم)' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{15}$/, { message: 'الرقم الضريبي يجب أن يكون 15 رقم' })
  taxNumber?: string;

  @ApiPropertyOptional({ description: 'تاريخ التأسيس' })
  @IsOptional()
  @IsDateString()
  establishmentDate?: string;

  @ApiPropertyOptional({ description: 'البلد' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'المدينة' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'الحي' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ description: 'الشارع' })
  @IsOptional()
  @IsString()
  street?: string;

  @ApiPropertyOptional({ description: 'رقم المبنى' })
  @IsOptional()
  @IsString()
  buildingNumber?: string;

  @ApiPropertyOptional({ description: 'الرمز البريدي' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ description: 'البريد الإلكتروني' })
  @IsOptional()
  @IsEmail()
  primaryEmail?: string;

  @ApiPropertyOptional({ description: 'رقم الهاتف' })
  @IsOptional()
  @IsString()
  primaryPhone?: string;

  @ApiPropertyOptional({ description: 'رقم هاتف ثانوي' })
  @IsOptional()
  @IsString()
  secondaryPhone?: string;

  @ApiPropertyOptional({ description: 'الموقع الإلكتروني' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({ description: 'ملاحظات' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'الوسوم', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'حقول مخصصة' })
  @IsOptional()
  @IsObject()
  customFields?: Record<string, any>;
}

