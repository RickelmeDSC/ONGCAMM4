import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @Throttle({ default: { ttl: 60000, limit: 5 } }) // 5 tentativas por minuto
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autenticar usuário e obter access_token + refresh_token' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @Throttle({ default: { ttl: 60000, limit: 10 } }) // 10 por minuto
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar access_token usando refresh_token' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refresh_token);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invalidar refresh_token (logout)' })
  logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refresh_token);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retornar dados do usuário autenticado' })
  me(@CurrentUser() user: any) {
    return this.authService.me(user.id_usuario);
  }
}
