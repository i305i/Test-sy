import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { v4 as uuid } from 'uuid';
import * as path from 'path';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private minioClient: Minio.Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    this.minioClient = new Minio.Client({
      endPoint: this.configService.get('MINIO_ENDPOINT') || 'localhost',
      port: parseInt(this.configService.get('MINIO_PORT') || '9000'),
      useSSL: this.configService.get('MINIO_USE_SSL') === 'true',
      accessKey: this.configService.get('MINIO_ACCESS_KEY') || 'minioadmin',
      secretKey: this.configService.get('MINIO_SECRET_KEY') || 'minioadmin',
    });

    this.bucketName = this.configService.get('MINIO_BUCKET') || 'company-docs';
  }

  async onModuleInit() {
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      
      if (!exists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        this.logger.log(`✅ Created bucket: ${this.bucketName}`);
      } else {
        this.logger.log(`✅ Connected to MinIO bucket: ${this.bucketName}`);
      }
    } catch (error) {
      this.logger.error('❌ Failed to connect to MinIO:', error.message);
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'documents',
  ): Promise<{ key: string; url: string }> {
    const ext = path.extname(file.originalname);
    const filename = `${uuid()}${ext}`;
    const key = `${folder}/${filename}`;

    try {
      await this.minioClient.putObject(
        this.bucketName,
        key,
        file.buffer,
        file.size,
        {
          'Content-Type': file.mimetype,
          'X-Original-Name': Buffer.from(file.originalname).toString('base64'),
        },
      );

      this.logger.log(`Uploaded file: ${key}`);

      return {
        key,
        url: await this.getFileUrl(key),
      };
    } catch (error) {
      this.logger.error('Failed to upload file:', error);
      throw error;
    }
  }

  async getFileUrl(key: string, expirySeconds: number = 3600): Promise<string> {
    try {
      return await this.minioClient.presignedGetObject(
        this.bucketName,
        key,
        expirySeconds,
      );
    } catch (error) {
      this.logger.error('Failed to generate presigned URL:', error);
      throw error;
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      await this.minioClient.removeObject(this.bucketName, key);
      this.logger.log(`Deleted file: ${key}`);
    } catch (error) {
      this.logger.error('Failed to delete file:', error);
      throw error;
    }
  }

  async getFileStream(key: string) {
    try {
      return await this.minioClient.getObject(this.bucketName, key);
    } catch (error) {
      this.logger.error('Failed to get file stream:', error);
      throw error;
    }
  }
}

