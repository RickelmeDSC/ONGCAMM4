import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateResponsavelDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cpf?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contato?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endereco?: string;
}
