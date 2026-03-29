import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCriancaDto {
  @ApiProperty({ example: 'Lucas Oliveira' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  nome: string;

  @ApiProperty({ example: '2015-06-15' })
  @IsDateString()
  data_nascimento: string;

  @ApiProperty({ example: '111.222.333-44' })
  @IsString()
  @MinLength(11)
  @MaxLength(14)
  cpf: string;

  @ApiPropertyOptional({ example: 'Masculino', enum: ['Masculino', 'Feminino'] })
  @IsOptional()
  @IsString()
  genero?: string;

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
