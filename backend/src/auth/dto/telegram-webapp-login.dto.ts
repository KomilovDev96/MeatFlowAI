import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class TelegramWebAppLoginDto {
  @ApiProperty({ description: "Raw window.Telegram.WebApp.initData string" })
  @IsString()
  initData: string;
}
