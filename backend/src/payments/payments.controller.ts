import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post()
  create(@Body() dto: CreatePaymentDto, @CurrentUser() user: any) {
    return this.payments.create(dto, user);
  }

  @Get()
  list(@CurrentUser() user: any) {
    return this.payments.list(user);
  }

  @Roles(Role.CLIENT)
  @Get('my')
  my(@CurrentUser() user: any) {
    return this.payments.listForClient(user.id, user.companyId);
  }

  @Roles(Role.CLIENT)
  @Get('my/summary')
  mySummary(@CurrentUser() user: any) {
    return this.payments.debtSummary(user.id, user.companyId);
  }

  @Get('summary/:clientId')
  summary(@Param('clientId') clientId: string, @CurrentUser() user: any) {
    return this.payments.debtSummaryForUser(clientId, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.payments.remove(id, user);
  }
}
