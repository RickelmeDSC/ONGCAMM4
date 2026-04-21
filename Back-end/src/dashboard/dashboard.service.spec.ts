import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock, MockPrisma } from '../test-utils/prisma-mock';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = createPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<DashboardService>(DashboardService);
  });

  // Helper: configura todos os mocks para um dashboard "vazio"
  function setupEmpty() {
    prisma.crianca.count.mockResolvedValue(0);
    prisma.frequencia.findMany.mockResolvedValue([]);
    prisma.doacao.findMany.mockResolvedValue([]);
    prisma.usuario.count.mockResolvedValue(0);
    prisma.logSistema.findMany.mockResolvedValue([]);
    prisma.crianca.findMany.mockResolvedValue([]);
    prisma.$queryRawUnsafe.mockResolvedValue([]);
  }

  describe('getMetrics — zero-state', () => {
    it('should return all-zeros structure when DB is empty', async () => {
      setupEmpty();
      const out = await service.getMetrics();
      expect(out.criancas_ativas).toBe(0);
      expect(out.frequencia_hoje).toEqual({ presentes: 0, total: 0, percentual: 0 });
      expect(out.doacoes_mes.valor).toBe(0);
      expect(out.voluntarios_ativos).toBe(0);
      expect(out.logs_recentes).toEqual([]);
      expect(out.aniversariantes_semana).toEqual([]);
      expect(out.criancas_sem_frequencia).toEqual([]);
      expect(out.frequencia_semanal).toHaveLength(7);
      expect(out.doacoes_mensais).toHaveLength(6);
    });
  });

  describe('getMetrics — frequencia hoje', () => {
    it('should compute presentes, total, percentual', async () => {
      setupEmpty();
      prisma.frequencia.findMany.mockImplementation(async (args: any) => {
        // "Hoje": select apenas status (sem data_registro), sem distinct
        if (args.select?.status && !args.select?.data_registro && !args.distinct) {
          return [
            { status: 'Presente' }, { status: 'Presente' },
            { status: 'Presente' }, { status: 'Ausente' },
          ];
        }
        return [];
      });
      const out = await service.getMetrics();
      expect(out.frequencia_hoje.presentes).toBe(3);
      expect(out.frequencia_hoje.total).toBe(4);
      expect(out.frequencia_hoje.percentual).toBe(75);
    });
  });

  describe('getMetrics — aniversariantes', () => {
    it('should include child whose birthday is today', async () => {
      setupEmpty();
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      prisma.crianca.findMany.mockResolvedValue([
        { id_matricula: 1234, nome: 'Ana', data_nascimento: hoje },
      ]);
      const out = await service.getMetrics();
      expect(out.aniversariantes_semana).toHaveLength(1);
      expect(out.aniversariantes_semana[0].nome).toBe('Ana');
    });

    it('should not include child whose birthday is 8+ days away', async () => {
      setupEmpty();
      const futuro = new Date();
      futuro.setDate(futuro.getDate() + 30);
      prisma.crianca.findMany.mockResolvedValue([
        { id_matricula: 1, nome: 'X', data_nascimento: futuro },
      ]);
      const out = await service.getMetrics();
      expect(out.aniversariantes_semana).toHaveLength(0);
    });
  });

  describe('getMetrics — doacoes do mes', () => {
    it('should sum valor of current month', async () => {
      setupEmpty();
      prisma.doacao.findMany.mockImplementation(async (args: any) => {
        // 1a chamada: doacoesMes (range do mes)
        if (args.select?.valor && !args.select?.data_doacao) {
          return [{ valor: 100.5 }, { valor: 200 }, { valor: null }];
        }
        return [];
      });
      const out = await service.getMetrics();
      expect(out.doacoes_mes.valor).toBe(300.5);
      expect(out.doacoes_mes.quantidade).toBe(3);
    });
  });
});
