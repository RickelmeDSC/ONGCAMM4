import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateEventoDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nome_evento?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  local?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  data_realizacao?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  id_usuario_resp?: number;
}
