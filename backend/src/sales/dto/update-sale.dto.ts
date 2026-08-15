import { ApiPropertyOptional } from '@nestjs/swagger';
import { SaleType } from '@prisma/client';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsBoolean, IsDateString, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { CreateSaleItemDto } from './create-sale.dto';

export class UpdateSaleDto {
  @ApiPropertyOptional({ type: [CreateSaleItemDto], description: 'Полная замена списка позиций заказа' })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  @ArrayMinSize(1)
  items?: CreateSaleItemDto[];

  @ApiPropertyOptional({ enum: SaleType })
  @IsOptional()
  @IsEnum(SaleType)
  type?: SaleType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  soldAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ description: 'Отметить заказ оплаченным/неоплаченным' })
  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;
}
