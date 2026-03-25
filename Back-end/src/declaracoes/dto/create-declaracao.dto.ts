import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

export class CreateDeclaracaoDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  id_matricula: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  id_usuario_autorizador: number;

  @ApiProperty({ example: 'Ana Oliveira' })
  @IsString()
  nome_parente: string;

  @ApiProperty({ example: 'Tia' })
  @IsString()
  parentesco: string;
}
