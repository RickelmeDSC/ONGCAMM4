import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'usuario@ong.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'senha123' })
  @IsString()
  @MinLength(6)
  senha: string;
}
