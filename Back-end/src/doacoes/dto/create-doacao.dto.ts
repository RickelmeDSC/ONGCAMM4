import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateDoacaoDto {
  @ApiProperty({ example: 'João Benfeitor' })
  @IsString()
  doador: string;

  @ApiProperty({ example: 'Dinheiro' })
  @IsString()
  tipo: string;

  @ApiProperty({ example: 150.00 })
  @IsNumber()
  @Min(0)
  valor: number;

  @ApiPropertyOptional({ example: '2026-03-25' })
  @IsOptional()
  @IsDateString()
  data_doacao?: string;
}
