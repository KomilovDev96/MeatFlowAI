import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
  constructor(private readonly config: ConfigService) {}

  getConfig() {
    return {
      endpoint: this.config.get('MINIO_ENDPOINT', 'localhost'),
      port: Number(this.config.get('MINIO_PORT', 9000)),
      bucket: this.config.get('MINIO_BUCKET', 'meatflow'),
    };
  }
}
