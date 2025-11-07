import {
  IsString,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCompanyDto {
  @ApiProperty({ description: 'اسم الشركة', example: 'شركة النجاح للتجارة' })
  @IsString()
  @MinLength(3, { message: 'اسم الشركة يجب أن يكون 3 أحرف على الأقل' })
  @MaxLength(255)
  name: string;

  @ApiProperty({ 
    description: 'نوع الشركة', 
    enum: ['INDIVIDUAL', 'PARTNERSHIP', 'LLC', 'PUBLIC_COMPANY', 'PRIVATE_COMPANY', 'NON_PROFIT'],
    example: 'LLC'
  })
  @IsEnum(['INDIVIDUAL', 'PARTNERSHIP', 'LLC', 'PUBLIC_COMPANY', 'PRIVATE_COMPANY', 'NON_PROFIT'])
  companyType: string;

  @ApiPropertyOptional({ description: 'رقم السجل التجاري' })
  @IsOptional()
  @IsString()
  commercialRegistration?: string;
}
