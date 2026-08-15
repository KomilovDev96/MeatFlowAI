import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SaleType } from '@prisma/client';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';

export class CreateSaleItemDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'Количество в штуках' })
  @IsNumber()
  @Min(0)
  quantityPieces: number;

  @ApiProperty({ description: 'Количество в килограммах' })
  @IsNumber()
  @Min(0.001)
  quantityKg: number;

  @ApiPropertyOptional({ description: 'Цена за 1 кг. По умолчанию — цена продажи товара' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerKg?: number;
}

export class CreateSaleDto {
  @ApiProperty()
  @IsUUID()
  clientId: string;

  @ApiProperty({ type: [CreateSaleItemDto] })
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  @ArrayMinSize(1)
  items: CreateSaleItemDto[];

  @ApiPropertyOptional({ enum: SaleType, description: 'CASH (наличка) или CONSIGNMENT (реализация), по умолчанию CASH' })
  @IsOptional()
  @IsEnum(SaleType)
  type?: SaleType;

  @ApiPropertyOptional({ description: 'Дата, когда товар выдан клиенту. По умолчанию — сейчас' })
  @IsOptional()
  @IsDateString()
  soldAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
