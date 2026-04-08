import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateEventoDto {
  @ApiProperty({ example: 'Festa Junina' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  nome_evento: string;

  @ApiProperty({ example: 'Sede da ONG' })
  @IsString()
  @MaxLength(500)
  local: string;

  @ApiProperty({ example: '2026-06-20' })
  @IsDateString()
  data_realizacao: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  id_usuario_resp: number;
}
