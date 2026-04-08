import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateAtividadeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
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
