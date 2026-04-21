import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EventosService } from './eventos.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock, MockPrisma } from '../test-utils/prisma-mock';

describe('EventosService', () => {
  let service: EventosService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = createPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventosService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<EventosService>(EventosService);
  });

  describe('findOne', () => {
    it('should throw NotFound when missing', async () => {
      prisma.evento.findUnique.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should convert data_realizacao to Date', async () => {
      prisma.evento.create.mockResolvedValue({});
      await service.create({
        nome_evento: 'Festa',
        local: 'Sede',
        data_realizacao: '2026-12-01',
        id_usuario_resp: 1,
      } as any);
      const call = prisma.evento.create.mock.calls[0][0];
      expect(call.data.data_realizacao).toBeInstanceOf(Date);
    });
  });

  describe('update', () => {
    it('should convert data_realizacao when provided', async () => {
      prisma.evento.findUnique.mockResolvedValue({ id_evento: 1 });
      prisma.evento.update.mockResolvedValue({});
      await service.update(1, { data_realizacao: '2027-01-01' } as any);
      const call = prisma.evento.update.mock.calls[0][0];
      expect(call.data.data_realizacao).toBeInstanceOf(Date);
    });
  });

  describe('remove', () => {
    it('should delete', async () => {
      prisma.evento.findUnique.mockResolvedValue({ id_evento: 1 });
      prisma.evento.delete.mockResolvedValue({});
      await service.remove(1);
      expect(prisma.evento.delete).toHaveBeenCalledWith({ where: { id_evento: 1 } });
    });
  });
});
