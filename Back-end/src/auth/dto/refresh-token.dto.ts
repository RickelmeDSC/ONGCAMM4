import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ example: 'a1b2c3d4...' })
  @IsString()
  @IsNotEmpty()
  refresh_token: string;
}
