import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  gerarRelatorioFrequencia,
  gerarRelatorioDoacoes,
  gerarRelatorioAtividades,
  gerarRelatorioAuditoria,
} from './relatorio.generator';
import { createReadStream } from 'fs';

@Injectable()
export class RelatoriosService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.relatorioAuditoria.findMany({ orderBy: { data_geracao: 'desc' } });
  }

  async gerarFrequencia() {
    const dados = await this.prisma.frequencia.findMany({ include: { crianca: true } });
    const path = await gerarRelatorioFrequencia(dados);
    return this.salvar('frequencia', path);
  }

  async gerarDoacoes() {
    const dados = await this.prisma.doacao.findMany();
    const path = await gerarRelatorioDoacoes(dados);
    return this.salvar('doacoes', path);
  }

  async gerarAtividades() {
    const dados = await this.prisma.atividade.findMany({ include: { responsavel: true } });
    const path = await gerarRelatorioAtividades(dados);
    return this.salvar('atividades', path);
  }

  async gerarAuditoria() {
    const dados = await this.prisma.logSistema.findMany({
      include: { usuario: { select: { id_usuario: true, nome: true, email: true, nivel_acesso: true } } },
      orderBy: { data_hora: 'desc' },
    });
    const path = await gerarRelatorioAuditoria(dados);
    return this.salvar('auditoria', path);
  }

  async download(id: number) {
    const relatorio = await this.prisma.relatorioAuditoria.findUnique({ where: { id_relatorio: id } });
    if (!relatorio) throw new Error(`Relatório ${id} não encontrado`);
    return { path: relatorio.path_arquivo, stream: createReadStream(relatorio.path_arquivo) };
  }

  private salvar(tipo: string, path: string) {
    return this.prisma.relatorioAuditoria.create({
      data: { tipo_periodo: tipo, path_arquivo: path },
    });
  }
}
