import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateResponsavelDto {
  @ApiProperty({ example: 'Maria Silva' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  nome: string;

  @ApiProperty({ example: '123.456.789-00' })
  @IsString()
  @MinLength(11)
  @MaxLength(14)
  cpf: string;

  @ApiProperty({ example: '(11) 99999-9999' })
  @IsString()
  @MaxLength(20)
  contato: string;

  @ApiProperty({ example: 'Rua das Flores, 123' })
  @IsString()
  @MaxLength(500)
  endereco: string;
}
