import { Test, TestingModule } from '@nestjs/testing';
import { RelatoriosService } from './relatorios.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock, MockPrisma } from '../test-utils/prisma-mock';

describe('RelatoriosService', () => {
  let service: RelatoriosService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = createPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RelatoriosService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<RelatoriosService>(RelatoriosService);
  });

  describe('gerarCriancasBuffer', () => {
    it('should return a PDF Buffer ordered by nome asc', async () => {
      prisma.crianca.findMany.mockResolvedValue([
        { id_matricula: 1234, nome: 'Ana', data_nascimento: new Date(), responsavel: { nome: 'Pai', contato: '9' } },
      ]);
      const buf = await service.gerarCriancasBuffer();
      expect(buf.slice(0, 4).toString()).toBe('%PDF');
      const call = prisma.crianca.findMany.mock.calls[0][0];
      expect(call.orderBy).toEqual({ nome: 'asc' });
    });
  });

  describe('gerarFrequenciaBuffer', () => {
    it('should build range filter when data is provided', async () => {
      prisma.frequencia.findMany.mockResolvedValue([]);
      await service.gerarFrequenciaBuffer('2026-04-12');
      const call = prisma.frequencia.findMany.mock.calls[0][0];
      const { gte, lte } = call.where.data_registro;
      expect(gte).toBeInstanceOf(Date);
      expect(lte).toBeInstanceOf(Date);
      expect(gte.getTime()).toBeLessThan(lte.getTime());
    });

    it('should add turno filter when provided', async () => {
      prisma.frequencia.findMany.mockResolvedValue([]);
      await service.gerarFrequenciaBuffer(undefined, 'Manhã');
      const call = prisma.frequencia.findMany.mock.calls[0][0];
      expect(call.where.turno).toBe('Manhã');
    });

    it('should build empty where when no filters', async () => {
      prisma.frequencia.findMany.mockResolvedValue([]);
      await service.gerarFrequenciaBuffer();
      const call = prisma.frequencia.findMany.mock.calls[0][0];
      expect(call.where).toEqual({});
    });
  });

  describe('gerarDoacoesBuffer', () => {
    it('should order desc', async () => {
      prisma.doacao.findMany.mockResolvedValue([]);
      await service.gerarDoacoesBuffer();
      const call = prisma.doacao.findMany.mock.calls[0][0];
      expect(call.orderBy).toEqual({ data_doacao: 'desc' });
    });
  });
});
