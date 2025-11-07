import { IsEnum } from 'class-validator';

export enum TokenPurpose {
  PREVIEW = 'PREVIEW',
  DOWNLOAD = 'DOWNLOAD',
}

export class CreateDownloadTokenDto {
  @IsEnum(TokenPurpose)
  purpose: TokenPurpose;
}

