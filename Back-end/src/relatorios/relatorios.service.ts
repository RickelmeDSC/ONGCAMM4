import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  gerarRelatorioFrequencia,
  gerarRelatorioDoacoes,
  gerarRelatorioAtividades,
  gerarRelatorioAuditoria,
  gerarRelatorioCriancas,
} from './relatorio.generator';

@Injectable()
export class RelatoriosService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.relatorioAuditoria.findMany({ orderBy: { data_geracao: 'desc' } });
  }

  async gerarCriancasBuffer(): Promise<Buffer> {
    const dados = await this.prisma.crianca.findMany({
      include: { responsavel: true },
      orderBy: { nome: 'asc' },
    });
    return Buffer.from(await gerarRelatorioCriancas(dados));
  }

  async gerarFrequenciaBuffer(data?: string, turno?: string): Promise<Buffer> {
    const where: any = {};

    // Filtrar por data especifica (YYYY-MM-DD)
    if (data) {
      const inicio = new Date(data + 'T00:00:00.000Z');
      const fim = new Date(data + 'T23:59:59.999Z');
      where.data_registro = { gte: inicio, lte: fim };
    }

    // Filtrar por turno
    if (turno) {
      where.turno = turno;
    }

    const dados = await this.prisma.frequencia.findMany({
      where,
      include: { crianca: true },
      orderBy: { data_registro: 'desc' },
    });
    return Buffer.from(await gerarRelatorioFrequencia(dados));
  }

  async gerarDoacoesBuffer(): Promise<Buffer> {
    const dados = await this.prisma.doacao.findMany({ orderBy: { data_doacao: 'desc' } });
    return Buffer.from(await gerarRelatorioDoacoes(dados));
  }

  async gerarAtividadesBuffer(): Promise<Buffer> {
    const dados = await this.prisma.atividade.findMany({ include: { responsavel: true } });
    return Buffer.from(await gerarRelatorioAtividades(dados));
  }

  async gerarAuditoriaBuffer(): Promise<Buffer> {
    const dados = await this.prisma.logSistema.findMany({
      include: { usuario: { select: { id_usuario: true, nome: true, email: true, nivel_acesso: true } } },
      orderBy: { data_hora: 'desc' },
    });
    return Buffer.from(await gerarRelatorioAuditoria(dados));
  }
}
