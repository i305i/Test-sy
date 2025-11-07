import { PartialType } from '@nestjs/swagger';
import { CreateCompanyDto } from './create-company.dto';
import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {
  @ApiPropertyOptional({ enum: ['READY', 'IN_PROGRESS', 'ON_HOLD', 'ARCHIVED'] })
  @IsOptional()
  @IsEnum(['READY', 'IN_PROGRESS', 'ON_HOLD', 'ARCHIVED'])
  status?: string;
}

