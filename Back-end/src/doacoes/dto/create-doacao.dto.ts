import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateDoacaoDto {
  @ApiProperty({ example: 'João Benfeitor' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  doador: string;

  @ApiProperty({ example: 'Dinheiro' })
  @IsString()
  @MaxLength(100)
  tipo: string;

  @ApiPropertyOptional({ example: 150.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  valor?: number;

  @ApiPropertyOptional({ example: '2026-03-25' })
  @IsOptional()
  @IsDateString()
  data_doacao?: string;
}
