import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateEventoDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  nome_evento?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
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
