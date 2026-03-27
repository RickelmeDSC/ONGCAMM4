import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  // Refresh token dura 8 horas (1 expediente)
  private readonly REFRESH_EXPIRATION_HOURS = 8;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    // Validar Turnstile CAPTCHA em produção
    if (process.env.TURNSTILE_SECRET && dto.turnstile_token) {
      const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${process.env.TURNSTILE_SECRET}&response=${dto.turnstile_token}`,
      });
      const result = await res.json();
      if (!result.success) throw new UnauthorizedException('Verificação CAPTCHA falhou');
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });

    if (!usuario) throw new UnauthorizedException('Credenciais inválidas');

    const senhaValida = await bcrypt.compare(dto.senha, usuario.senha_hash);
    if (!senhaValida) throw new UnauthorizedException('Credenciais inválidas');

    const tokens = await this.generateTokens(usuario);

    return {
      ...tokens,
      usuario: {
        id: usuario.id_usuario,
        nome: usuario.nome,
        email: usuario.email,
        nivel_acesso: usuario.nivel_acesso,
      },
    };
  }

  async refresh(refreshToken: string) {
    // Busca o refresh token no banco
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { usuario: true },
    });

    if (!stored) throw new UnauthorizedException('Refresh token inválido');
    if (stored.expires_at < new Date()) {
      // Token expirado — remove do banco
      await this.prisma.refreshToken.delete({ where: { id: stored.id } });
      throw new UnauthorizedException('Refresh token expirado. Faça login novamente.');
    }

    // Remove o refresh token usado (rotação)
    await this.prisma.refreshToken.delete({ where: { id: stored.id } });

    // Gera novos tokens
    const tokens = await this.generateTokens(stored.usuario);

    return {
      ...tokens,
      usuario: {
        id: stored.usuario.id_usuario,
        nome: stored.usuario.nome,
        email: stored.usuario.email,
        nivel_acesso: stored.usuario.nivel_acesso,
      },
    };
  }

  async logout(refreshToken: string) {
    // Remove o refresh token do banco (se existir)
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
    return { message: 'Logout realizado com sucesso' };
  }

  async me(userId: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id_usuario: userId },
      select: {
        id_usuario: true,
        nome: true,
        email: true,
        nivel_acesso: true,
      },
    });
    if (!usuario) throw new UnauthorizedException();
    return usuario;
  }

  // ── Helpers internos ──────────────────────────────

  private async generateTokens(usuario: { id_usuario: number; nome: string; nivel_acesso: number }) {
    const payload = {
      sub: usuario.id_usuario,
      nome: usuario.nome,
      nivel_acesso: usuario.nivel_acesso,
    };

    // Access token — curta duração (1 hora)
    const access_token = this.jwtService.sign(payload);

    // Refresh token — duração de 1 expediente (8 horas)
    const refresh_token = crypto.randomBytes(64).toString('hex');
    const expires_at = new Date();
    expires_at.setHours(expires_at.getHours() + this.REFRESH_EXPIRATION_HOURS);

    // Salva no banco
    await this.prisma.refreshToken.create({
      data: {
        token: refresh_token,
        id_usuario: usuario.id_usuario,
        expires_at,
      },
    });

    // Limpa tokens antigos expirados deste usuário
    await this.prisma.refreshToken.deleteMany({
      where: {
        id_usuario: usuario.id_usuario,
        expires_at: { lt: new Date() },
      },
    });

    return {
      access_token,
      refresh_token,
      expires_in: 3600, // 1 hora em segundos
    };
  }
}
