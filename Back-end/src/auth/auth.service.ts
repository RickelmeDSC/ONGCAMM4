import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });

    if (!usuario) throw new UnauthorizedException('Credenciais inválidas');

    const senhaValida = await bcrypt.compare(dto.senha, usuario.senha_hash);
    if (!senhaValida) throw new UnauthorizedException('Credenciais inválidas');

    const payload = {
      sub: usuario.id_usuario,
      nome: usuario.nome,
      nivel_acesso: usuario.nivel_acesso,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      expires_in: Number(process.env.JWT_EXPIRATION ?? 86400),
      usuario: {
        id: usuario.id_usuario,
        nome: usuario.nome,
        email: usuario.email,
        nivel_acesso: usuario.nivel_acesso,
      },
    };
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
}
