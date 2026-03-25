import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateCriancaDto {
  @ApiProperty({ example: 'Lucas Oliveira' })
  @IsString()
  nome: string;

  @ApiProperty({ example: '2015-06-15' })
  @IsDateString()
  data_nascimento: string;

  @ApiProperty({ example: '111.222.333-44' })
  @IsString()
  cpf: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  id_responsavel: number;

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
