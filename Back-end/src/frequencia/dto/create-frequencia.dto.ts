import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsDateString, IsString } from 'class-validator';

export class CreateFrequenciaDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  id_matricula: number;

  @ApiProperty({ example: 'Presente', enum: ['Presente', 'Ausente'] })
  @IsIn(['Presente', 'Ausente'])
  status: string;

  @ApiPropertyOptional({ example: '2026-03-25' })
  @IsOptional()
  @IsDateString()
  data_registro?: string;

  @ApiPropertyOptional({ example: 'Manhã', enum: ['Manhã', 'Tarde', 'Integral'] })
  @IsOptional()
  @IsString()
  turno?: string;

  @ApiPropertyOptional({ example: 'Consulta médica' })
  @IsOptional()
  @IsString()
  observacao?: string;
}
