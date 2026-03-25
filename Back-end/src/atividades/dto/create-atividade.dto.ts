import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsString } from 'class-validator';

export class CreateAtividadeDto {
  @ApiProperty({ example: 'Oficina de Arte' })
  @IsString()
  titulo: string;

  @ApiProperty({ example: '2026-04-10' })
  @IsDateString()
  data_realizacao: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  id_usuario_resp: number;
}
