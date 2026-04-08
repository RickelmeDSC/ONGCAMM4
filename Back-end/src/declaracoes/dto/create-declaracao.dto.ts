import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateDeclaracaoDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  id_matricula: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  id_usuario_autorizador: number;

  @ApiProperty({ example: 'Ana Oliveira' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  nome_parente: string;

  @ApiProperty({ example: 'Tia' })
  @IsString()
  @MaxLength(50)
  parentesco: string;
}
