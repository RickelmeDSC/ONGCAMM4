import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ResetSenhaDto {
  @ApiProperty({ example: 'novaSenha123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  nova_senha: string;
}
