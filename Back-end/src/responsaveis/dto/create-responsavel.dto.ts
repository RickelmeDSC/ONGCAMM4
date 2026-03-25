import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateResponsavelDto {
  @ApiProperty({ example: 'Maria Silva' })
  @IsString()
  nome: string;

  @ApiProperty({ example: '123.456.789-00' })
  @IsString()
  cpf: string;

  @ApiProperty({ example: '(11) 99999-9999' })
  @IsString()
  contato: string;

  @ApiProperty({ example: 'Rua das Flores, 123' })
  @IsString()
  endereco: string;
}
