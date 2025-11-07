import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentsCleanupService } from './documents.cleanup.service';
import { CompaniesModule } from '../companies/companies.module';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [CompaniesModule, DatabaseModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentsCleanupService],
  exports: [DocumentsService],
})
export class DocumentsModule {}

