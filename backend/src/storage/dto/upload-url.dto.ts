import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export const UPLOAD_FOLDERS = ['avatars', 'logos', 'products'] as const;
export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

export class UploadUrlDto {
  @ApiProperty()
  @IsString()
  filename: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contentType?: string;

  @ApiPropertyOptional({ enum: UPLOAD_FOLDERS })
  @IsOptional()
  @IsIn(UPLOAD_FOLDERS)
  folder?: UploadFolder;
}
