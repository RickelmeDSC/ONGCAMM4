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

  async gerarFrequenciaBuffer(): Promise<Buffer> {
    const dados = await this.prisma.frequencia.findMany({
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
