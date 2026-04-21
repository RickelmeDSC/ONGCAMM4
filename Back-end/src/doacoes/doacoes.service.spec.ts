import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DoacoesService } from './doacoes.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock, MockPrisma } from '../test-utils/prisma-mock';

describe('DoacoesService', () => {
  let service: DoacoesService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = createPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoacoesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<DoacoesService>(DoacoesService);
  });

  describe('findAll', () => {
    it('should order by data_doacao desc', async () => {
      prisma.doacao.findMany.mockResolvedValue([]);
      await service.findAll();
      expect(prisma.doacao.findMany).toHaveBeenCalledWith({
        orderBy: { data_doacao: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return when found', async () => {
      prisma.doacao.findUnique.mockResolvedValue({ id_doacao: 1 });
      await expect(service.findOne(1)).resolves.toBeDefined();
    });

    it('should throw NotFound', async () => {
      prisma.doacao.findUnique.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create with data_doacao when provided', async () => {
      prisma.doacao.create.mockResolvedValue({});
      await service.create({
        doador: 'X',
        tipo: 'financeira',
        valor: 100,
        data_doacao: '2026-04-12',
      } as any);
      const call = prisma.doacao.create.mock.calls[0][0];
      expect(call.data.data_doacao).toBeInstanceOf(Date);
    });

    it('should omit data_doacao when not provided (uses DB default)', async () => {
      prisma.doacao.create.mockResolvedValue({});
      await service.create({ doador: 'X', tipo: 'alimentos' } as any);
      const call = prisma.doacao.create.mock.calls[0][0];
      expect(call.data.data_doacao).toBeUndefined();
    });
  });

  describe('update', () => {
    it('should convert data_doacao to Date when provided', async () => {
      prisma.doacao.findUnique.mockResolvedValue({ id_doacao: 1 });
      prisma.doacao.update.mockResolvedValue({});
      await service.update(1, { data_doacao: '2026-04-12' } as any);
      const call = prisma.doacao.update.mock.calls[0][0];
      expect(call.data.data_doacao).toBeInstanceOf(Date);
    });

    it('should throw NotFound when id missing', async () => {
      prisma.doacao.findUnique.mockResolvedValue(null);
      await expect(service.update(99, { doador: 'x' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should hard delete', async () => {
      prisma.doacao.findUnique.mockResolvedValue({ id_doacao: 1 });
      prisma.doacao.delete.mockResolvedValue({});
      await service.remove(1);
      expect(prisma.doacao.delete).toHaveBeenCalledWith({ where: { id_doacao: 1 } });
    });
  });
});
