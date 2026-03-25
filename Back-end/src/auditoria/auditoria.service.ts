import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditoriaService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.logSistema.findMany({
      include: { usuario: { select: { id_usuario: true, nome: true, email: true, nivel_acesso: true } } },
      orderBy: { data_hora: 'desc' },
    });
  }

  findByUsuario(id_usuario: number) {
    return this.prisma.logSistema.findMany({
      where: { id_usuario },
      include: { usuario: { select: { id_usuario: true, nome: true, email: true, nivel_acesso: true } } },
      orderBy: { data_hora: 'desc' },
    });
  }

  findByPeriodo(inicio: string, fim: string) {
    return this.prisma.logSistema.findMany({
      where: {
        data_hora: {
          gte: new Date(inicio),
          lte: new Date(fim),
        },
      },
      include: { usuario: { select: { id_usuario: true, nome: true, email: true, nivel_acesso: true } } },
      orderBy: { data_hora: 'desc' },
    });
  }
}
