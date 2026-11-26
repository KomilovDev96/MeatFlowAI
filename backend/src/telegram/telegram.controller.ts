import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsOptional, IsString } from 'class-validator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { TelegramService } from './telegram.service';

class BotTokenDto {
  @IsString()
  token: string;
}

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

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Get('bot')
  botConfig() {
    return this.telegram.botConfig();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Put('bot')
  setToken(@Body() dto: BotTokenDto, @CurrentUser() user: any) {
    return this.telegram.setToken(dto.token, user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Delete('bot')
  removeToken(@CurrentUser() user: any) {
    return this.telegram.removeToken(user.id);
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
