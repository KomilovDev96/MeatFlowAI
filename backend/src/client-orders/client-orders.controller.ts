import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OrderStatus, Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ClientOrdersService } from './client-orders.service';

@ApiTags('Client orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('client-orders')
export class ClientOrdersController {
  constructor(private readonly orders: ClientOrdersService) {}

  @Get()
  list(@CurrentUser() user: any, @Query('status') status?: OrderStatus) {
    return this.orders.list(user, status);
  }

  @Post(':id/confirm')
  confirm(@Param('id') id: string, @CurrentUser() user: any) {
    return this.orders.confirm(id, user);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string, @CurrentUser() user: any) {
    return this.orders.reject(id, user);
  }
}
