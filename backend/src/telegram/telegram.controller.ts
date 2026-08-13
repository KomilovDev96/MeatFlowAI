import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TelegramService } from './telegram.service';

class ConnectTelegramDto {
  @IsString()
  telegramId: string;

  @IsOptional()
  @IsString()
  telegramUsername?: string;
}

@ApiTags('Telegram')
@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegram: TelegramService) {}

  @Get('status')
  status() {
    return this.telegram.status();
  }

  @Post('start')
  start(@Body() dto: ConnectTelegramDto) {
    return this.telegram.findByTelegramId(dto.telegramId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('connect/me')
  connectMe(@Body() dto: ConnectTelegramDto, @CurrentUser() user: any) {
    return this.telegram.connectUser(user.id, dto.telegramId, dto.telegramUsername);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('connect/clients/:clientId')
  connectClient(@Param('clientId') clientId: string, @Body() dto: ConnectTelegramDto, @CurrentUser() user: any) {
    return this.telegram.connectClient(clientId, dto.telegramId, dto.telegramUsername, user);
  }
}
