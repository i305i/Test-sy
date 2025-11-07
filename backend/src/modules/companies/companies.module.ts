import { Module } from '@nestjs/common';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { FoldersModule } from '../folders/folders.module';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [FoldersModule, DocumentsModule],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}

