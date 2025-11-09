import { Module, forwardRef } from '@nestjs/common';
import { OnlyOfficeController } from './onlyoffice.controller';
import { OnlyOfficeService } from './onlyoffice.service';
import { StorageModule } from '../storage/storage.module';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [
    StorageModule,
    forwardRef(() => DocumentsModule),
  ],
  controllers: [OnlyOfficeController],
  providers: [OnlyOfficeService],
  exports: [OnlyOfficeService],
})
export class OnlyOfficeModule {}

