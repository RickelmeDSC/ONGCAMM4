import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AtividadesService } from './atividades.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock, MockPrisma } from '../test-utils/prisma-mock';

describe('AtividadesService', () => {
  let service: AtividadesService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = createPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AtividadesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<AtividadesService>(AtividadesService);
  });

  describe('findOne', () => {
    it('should throw NotFound when missing', async () => {
      prisma.atividade.findUnique.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should convert data_realizacao to Date', async () => {
      prisma.atividade.create.mockResolvedValue({});
      await service.create({
        titulo: 'Oficina',
        data_realizacao: '2026-04-20',
        id_usuario_resp: 1,
      } as any);
      const call = prisma.atividade.create.mock.calls[0][0];
      expect(call.data.data_realizacao).toBeInstanceOf(Date);
    });
  });

  describe('update', () => {
    it('should convert data_realizacao when provided', async () => {
      prisma.atividade.findUnique.mockResolvedValue({ id_atividade: 1 });
      prisma.atividade.update.mockResolvedValue({});
      await service.update(1, { data_realizacao: '2026-05-01' } as any);
      const call = prisma.atividade.update.mock.calls[0][0];
      expect(call.data.data_realizacao).toBeInstanceOf(Date);
    });

    it('should not set data_realizacao when not provided', async () => {
      prisma.atividade.findUnique.mockResolvedValue({ id_atividade: 1 });
      prisma.atividade.update.mockResolvedValue({});
      await service.update(1, { titulo: 'Novo' } as any);
      const call = prisma.atividade.update.mock.calls[0][0];
      expect(call.data.data_realizacao).toBeUndefined();
    });
  });

  describe('remove', () => {
    it('should delete', async () => {
      prisma.atividade.findUnique.mockResolvedValue({ id_atividade: 1 });
      prisma.atividade.delete.mockResolvedValue({});
      await service.remove(1);
      expect(prisma.atividade.delete).toHaveBeenCalledWith({ where: { id_atividade: 1 } });
    });
  });
});
