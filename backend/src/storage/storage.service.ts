import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import * as Minio from 'minio';
import { UploadUrlDto } from './dto/upload-url.dto';

const UPLOAD_URL_EXPIRY_SECONDS = 15 * 60;

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: Minio.Client;
  private readonly bucket: string;
  private readonly endpoint: string;
  private readonly port: number;
  private readonly useSSL: boolean;

  constructor(private readonly config: ConfigService) {
    this.endpoint = this.config.get('MINIO_ENDPOINT', 'localhost');
    this.port = Number(this.config.get('MINIO_PORT', 9000));
    this.bucket = this.config.get('MINIO_BUCKET', 'meatflow');
    this.useSSL = this.config.get('MINIO_USE_SSL', 'false') === 'true';
    this.client = new Minio.Client({
      endPoint: this.endpoint,
      port: this.port,
      useSSL: this.useSSL,
      accessKey: this.config.getOrThrow('MINIO_ACCESS_KEY'),
      secretKey: this.config.getOrThrow('MINIO_SECRET_KEY'),
    });
  }

  async onModuleInit() {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) await this.client.makeBucket(this.bucket);
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${this.bucket}/*`],
          },
        ],
      };
      await this.client.setBucketPolicy(this.bucket, JSON.stringify(policy));
    } catch (error) {
      this.logger.warn(`MinIO bucket setup skipped: ${(error as Error).message}`);
    }
  }

  getConfig() {
    return { endpoint: this.endpoint, port: this.port, bucket: this.bucket };
  }

  async getUploadUrl(dto: UploadUrlDto) {
    const folder = dto.folder ?? 'avatars';
    const extension = dto.filename.match(/\.([a-zA-Z0-9]+)$/)?.[1];
    const key = `${folder}/${randomUUID()}${extension ? `.${extension}` : ''}`;
    const uploadUrl = await this.client.presignedPutObject(this.bucket, key, UPLOAD_URL_EXPIRY_SECONDS);
    const publicUrl = `${this.useSSL ? 'https' : 'http'}://${this.endpoint}:${this.port}/${this.bucket}/${key}`;
    return { uploadUrl, publicUrl, key };
  }
}
