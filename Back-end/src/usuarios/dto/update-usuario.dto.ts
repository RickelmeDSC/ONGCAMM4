import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class UpdateUsuarioDto {
  @ApiPropertyOptional({ example: 'João Silva' })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({ example: 'joao@ong.com' })
  @IsOptional()
  @IsEmail()
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
