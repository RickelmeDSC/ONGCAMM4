import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'usuario@ong.com' })
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({ example: 'senha123' })
  @IsString()
  @MinLength(6)
  senha: string;

  @ApiPropertyOptional({ description: 'Cloudflare Turnstile token' })
  @IsOptional()
  @IsString()
  turnstile_token?: string;
}
