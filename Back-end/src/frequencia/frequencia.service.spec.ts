import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { FrequenciaService } from './frequencia.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock, MockPrisma } from '../test-utils/prisma-mock';

describe('FrequenciaService', () => {
  let service: FrequenciaService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = createPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FrequenciaService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<FrequenciaService>(FrequenciaService);
  });

  describe('findAll', () => {
    it('should include crianca relation', async () => {
      prisma.frequencia.findMany.mockResolvedValue([]);
      await service.findAll();
      expect(prisma.frequencia.findMany).toHaveBeenCalledWith({
        include: { crianca: true },
      });
    });
  });

  describe('findByCrianca', () => {
    it('should filter by matricula and order desc', async () => {
      prisma.frequencia.findMany.mockResolvedValue([]);
      await service.findByCrianca(1234);
      expect(prisma.frequencia.findMany).toHaveBeenCalledWith({
        where: { id_matricula: 1234 },
        include: { crianca: true },
        orderBy: { data_registro: 'desc' },
      });
    });
  });

  describe('findByData', () => {
    it('should query range [inicio, fim=inicio+1d)', async () => {
      prisma.frequencia.findMany.mockResolvedValue([]);
      await service.findByData('2026-04-12');
      const call = prisma.frequencia.findMany.mock.calls[0][0];
      const { gte, lt } = call.where.data_registro;
      expect(gte).toBeInstanceOf(Date);
      expect(lt.getTime() - gte.getTime()).toBe(24 * 60 * 60 * 1000);
    });
  });

  describe('create', () => {
    it('should persist status, turno and observacao', async () => {
      prisma.frequencia.create.mockResolvedValue({ id_frequencia: 1 });
      await service.create({
        id_matricula: 1234,
        status: 'Presente',
        turno: 'Manhã',
        observacao: 'Chegou tarde',
      } as any);
      const call = prisma.frequencia.create.mock.calls[0][0];
      expect(call.data.status).toBe('Presente');
      expect(call.data.turno).toBe('Manhã');
      expect(call.data.observacao).toBe('Chegou tarde');
    });

    it('should not send turno/observacao when absent', async () => {
      prisma.frequencia.create.mockResolvedValue({ id_frequencia: 1 });
      await service.create({ id_matricula: 1, status: 'Ausente' } as any);
      const call = prisma.frequencia.create.mock.calls[0][0];
      expect(call.data.turno).toBeUndefined();
      expect(call.data.observacao).toBeUndefined();
    });

    it('should convert data_registro string to Date when provided', async () => {
      prisma.frequencia.create.mockResolvedValue({ id_frequencia: 1 });
      await service.create({
        id_matricula: 1,
        status: 'Presente',
        data_registro: '2026-04-12',
      } as any);
      const call = prisma.frequencia.create.mock.calls[0][0];
      expect(call.data.data_registro).toBeInstanceOf(Date);
    });
  });

  describe('update', () => {
    it('should update only status', async () => {
      prisma.frequencia.findUnique.mockResolvedValue({ id_frequencia: 1 });
      prisma.frequencia.update.mockResolvedValue({});
      await service.update(1, 'Ausente');
      expect(prisma.frequencia.update).toHaveBeenCalledWith({
        where: { id_frequencia: 1 },
        data: { status: 'Ausente' },
      });
    });

    it('should throw NotFound when id does not exist', async () => {
      prisma.frequencia.findUnique.mockResolvedValue(null);
      await expect(service.update(9, 'x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should hard delete', async () => {
      prisma.frequencia.findUnique.mockResolvedValue({ id_frequencia: 1 });
      prisma.frequencia.delete.mockResolvedValue({});
      await service.remove(1);
      expect(prisma.frequencia.delete).toHaveBeenCalledWith({
        where: { id_frequencia: 1 },
      });
    });

    it('should throw NotFound when missing', async () => {
      prisma.frequencia.findUnique.mockResolvedValue(null);
      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });
  });
});
