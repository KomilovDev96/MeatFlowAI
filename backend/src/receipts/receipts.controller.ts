import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateReceiptDto } from './dto/create-receipt.dto';
import { ReceiptsService } from './receipts.service';

@ApiTags('Receipts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('receipts')
export class ReceiptsController {
  constructor(private readonly receipts: ReceiptsService) {}

  @Post()
  create(@Body() dto: CreateReceiptDto, @CurrentUser() user: any) {
    return this.receipts.create(dto, user);
  }

  @Get()
  list(@CurrentUser() user: any, @Query('productId') productId?: string) {
    return this.receipts.list(user, productId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.receipts.remove(id, user);
  }
}
