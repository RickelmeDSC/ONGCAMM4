import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getMetrics() {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);
    const seteDiasAtras = new Date(hoje);
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 6);
    const seisMesesAtras = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1);
    const quatorzeDiasAtras = new Date(hoje);
    quatorzeDiasAtras.setDate(quatorzeDiasAtras.getDate() - 14);

    // --- Todas as queries em paralelo ---
    const [
      criancas_ativas,
      criancas_total,
      frequenciaHoje,
      doacoesMes,
      voluntarios_ativos,
      frequenciaSemana,
      doacoesPeriodo,
      logsRecentes,
      criancasAtivas,
      criancasComFreqRecente,
    ] = await Promise.all([
      this.prisma.crianca.count({ where: { ativo: true } }),
      this.prisma.crianca.count(),
      this.prisma.frequencia.findMany({
        where: { data_registro: { gte: hoje, lt: amanha } },
        select: { status: true },
      }),
      this.prisma.doacao.findMany({
        where: { data_doacao: { gte: inicioMes, lt: fimMes }, ativo: true },
        select: { valor: true },
      }),
      this.prisma.usuario.count({ where: { ativo: true } }),
      this.prisma.frequencia.findMany({
        where: { data_registro: { gte: seteDiasAtras, lt: amanha } },
        select: { data_registro: true, status: true },
      }),
      this.prisma.doacao.findMany({
        where: { data_doacao: { gte: seisMesesAtras, lt: fimMes }, ativo: true },
        select: { data_doacao: true, valor: true },
      }),
      this.prisma.logSistema.findMany({
        take: 10,
        orderBy: { data_hora: 'desc' },
        include: { usuario: { select: { nome: true } } },
      }),
      this.prisma.crianca.findMany({
        where: { ativo: true },
        select: { id_matricula: true, nome: true, data_nascimento: true },
      }),
      this.prisma.frequencia.findMany({
        where: { data_registro: { gte: quatorzeDiasAtras } },
        distinct: ['id_matricula'],
        select: { id_matricula: true },
      }),
    ]);

    // --- Frequencia hoje ---
    const presentesHoje = frequenciaHoje.filter(
      (f) => f.status.toLowerCase() === 'presente',
    ).length;
    const totalHoje = frequenciaHoje.length;
    const percentualHoje =
      totalHoje > 0
        ? Math.round((presentesHoje / totalHoje) * 10000) / 100
        : 0;

    // --- Doacoes do mes ---
    const valorDoacoesMes = doacoesMes.reduce(
      (acc, d) => acc + (d.valor ? Number(d.valor) : 0),
      0,
    );

    // --- Frequencia semanal ---
    const freqPorDia = new Map<string, { presentes: number; ausentes: number }>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(seteDiasAtras);
      d.setDate(d.getDate() + i);
      freqPorDia.set(d.toISOString().slice(0, 10), { presentes: 0, ausentes: 0 });
    }
    for (const f of frequenciaSemana) {
      const dia = new Date(f.data_registro).toISOString().slice(0, 10);
      const entry = freqPorDia.get(dia);
      if (entry) {
        if (f.status.toLowerCase() === 'presente') entry.presentes++;
        else entry.ausentes++;
      }
    }
    const frequencia_semanal = Array.from(freqPorDia.entries()).map(
      ([dia, v]) => ({ dia, presentes: v.presentes, ausentes: v.ausentes }),
    );

    // --- Doacoes mensais ---
    const doacPorMes = new Map<string, { valor: number; quantidade: number }>();
    for (let i = 0; i < 6; i++) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - 5 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      doacPorMes.set(key, { valor: 0, quantidade: 0 });
    }
    for (const d of doacoesPeriodo) {
      const dt = new Date(d.data_doacao);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      const entry = doacPorMes.get(key);
      if (entry) {
        entry.valor += d.valor ? Number(d.valor) : 0;
        entry.quantidade++;
      }
    }
    const doacoes_mensais = Array.from(doacPorMes.entries()).map(
      ([mes, v]) => ({ mes, valor: Math.round(v.valor * 100) / 100, quantidade: v.quantidade }),
    );

    // --- Logs recentes ---
    const logs_recentes = logsRecentes.map((l) => ({
      acao: l.acao,
      entidade: l.entidade ?? '',
      data_hora: l.data_hora.toISOString(),
      usuario_nome: l.usuario.nome,
    }));

    // --- Aniversariantes da semana ---
    const aniversariantes_semana: { nome: string; data_nascimento: string; id_matricula: number }[] = [];
    for (const c of criancasAtivas) {
      const nasc = new Date(c.data_nascimento);
      for (let i = 0; i < 7; i++) {
        const dia = new Date(hoje);
        dia.setDate(dia.getDate() + i);
        if (nasc.getMonth() === dia.getMonth() && nasc.getDate() === dia.getDate()) {
          aniversariantes_semana.push({
            nome: c.nome,
            data_nascimento: nasc.toISOString().slice(0, 10),
            id_matricula: c.id_matricula,
          });
          break;
        }
      }
    }

    // --- Criancas sem frequencia (14 dias) — query unica em vez de N+1 ---
    const idsComFreq = new Set(criancasComFreqRecente.map((f) => f.id_matricula));
    const criancasSemFreqList = criancasAtivas.filter((c) => !idsComFreq.has(c.id_matricula));
    const idsSemFreq = criancasSemFreqList.map((c) => c.id_matricula);

    let ultimosRegistros: { id_matricula: number; data_registro: Date }[] = [];
    if (idsSemFreq.length > 0) {
      ultimosRegistros = await this.prisma.$queryRawUnsafe<
        { id_matricula: number; data_registro: Date }[]
      >(
        `SELECT f.id_matricula, f.data_registro
         FROM frequencia f
         INNER JOIN (
           SELECT id_matricula, MAX(data_registro) as max_data
           FROM frequencia
           WHERE id_matricula = ANY($1::int[])
           GROUP BY id_matricula
         ) sub ON f.id_matricula = sub.id_matricula AND f.data_registro = sub.max_data`,
        idsSemFreq,
      );
    }
    const ultimoMap = new Map(
      ultimosRegistros.map((r) => [r.id_matricula, r.data_registro]),
    );
    const criancas_sem_frequencia = criancasSemFreqList.map((c) => {
      const ultimo = ultimoMap.get(c.id_matricula);
      return {
        nome: c.nome,
        id_matricula: c.id_matricula,
        ultimo_registro: ultimo ? new Date(ultimo).toISOString().slice(0, 10) : null,
      };
    });

    return {
      criancas_ativas,
      criancas_total,
      frequencia_hoje: {
        presentes: presentesHoje,
        total: totalHoje,
        percentual: percentualHoje,
      },
      doacoes_mes: {
        total: doacoesMes.length,
        valor: Math.round(valorDoacoesMes * 100) / 100,
        quantidade: doacoesMes.length,
      },
      voluntarios_ativos,
      frequencia_semanal,
      doacoes_mensais,
      logs_recentes,
      aniversariantes_semana,
      criancas_sem_frequencia,
    };
  }
}
