import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateCriancaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  data_nascimento?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cpf?: string;

  @ApiPropertyOptional({ example: 'Masculino', enum: ['Masculino', 'Feminino'] })
  @IsOptional()
  @IsString()
  genero?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  id_responsavel?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  foto_path?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  certidao_nasc?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cartao_vacina?: string;
}
