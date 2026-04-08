import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateUsuarioDto {
  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  nome: string;

  @ApiProperty({ example: 'joao@ong.com' })
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({ example: 'senha123', minLength: 8 })
  @IsString()
  @MinLength(8)
  senha: string;

  @ApiProperty({ example: 1, minimum: 1, maximum: 3 })
  @IsInt()
  @Min(1)
  @Max(3)
  nivel_acesso: number;
}
