import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsString } from 'class-validator';

export class CreateEventoDto {
  @ApiProperty({ example: 'Festa Junina' })
  @IsString()
  nome_evento: string;

  @ApiProperty({ example: 'Sede da ONG' })
  @IsString()
  local: string;

  @ApiProperty({ example: '2026-06-20' })
  @IsDateString()
  data_realizacao: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  id_usuario_resp: number;
}
