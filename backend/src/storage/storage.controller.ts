import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UploadUrlDto } from './dto/upload-url.dto';
import { StorageService } from './storage.service';

@ApiTags('Storage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('storage')
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @Get('config')
  config() {
    return this.storage.getConfig();
  }

  @Post('upload-url')
  uploadUrl(@Body() dto: UploadUrlDto) {
    return this.storage.getUploadUrl(dto);
  }
}
