import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentsCleanupService } from './documents.cleanup.service';
import { DatabaseModule } from '../../database/database.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [DatabaseModule, StorageModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentsCleanupService],
  exports: [DocumentsService],
})
export class DocumentsModule {}

