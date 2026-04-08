import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class UpdateUsuarioDto {
  @ApiPropertyOptional({ example: 'João Silva' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  nome?: string;

  @ApiPropertyOptional({ example: 'joao@ong.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @ApiPropertyOptional({ example: 'novaSenha123', minLength: 8 })
  @IsOptional()
  @IsString()
  @MinLength(8)
  senha?: string;

  @ApiPropertyOptional({ example: 2, minimum: 1, maximum: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  nivel_acesso?: number;
}
