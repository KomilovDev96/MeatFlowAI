import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateReceiptDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'Quantity received, in the product unit (kg or pieces)' })
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @ApiProperty({ description: 'Purchase price per unit' })
  @IsNumber()
  @Min(0)
  unitCost: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supplier?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  receivedAt?: string;
}
