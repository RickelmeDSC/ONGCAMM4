import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateAtividadeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titulo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  data_realizacao?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  id_usuario_resp?: number;
}
