import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Roles(Role.SUPER_ADMIN)
  @Get('platform')
  platform() {
    return this.analytics.platform();
  }

  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Get('companies/:companyId')
  company(@Param('companyId') companyId: string, @CurrentUser() user: any) {
    return this.analytics.company(companyId, user);
  }
}
