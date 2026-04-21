import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CriancasService } from './criancas.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock, MockPrisma } from '../test-utils/prisma-mock';

describe('CriancasService', () => {
  let service: CriancasService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = createPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CriancasService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<CriancasService>(CriancasService);
  });

  // ── findAll ────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should include responsavel relation', async () => {
      prisma.crianca.findMany.mockResolvedValue([{ id_matricula: 1234, nome: 'X' }]);
      const out = await service.findAll();
      expect(prisma.crianca.findMany).toHaveBeenCalledWith({
        include: { responsavel: true },
      });
      expect(out).toHaveLength(1);
    });
  });

  // ── findOne ────────────────────────────────────────────────────────────
  describe('findOne', () => {
    it('should return crianca with responsavel', async () => {
      prisma.crianca.findUnique.mockResolvedValue({ id_matricula: 1234 });
      const out = await service.findOne(1234);
      expect(out.id_matricula).toBe(1234);
    });

    it('should throw NotFound when not found', async () => {
      prisma.crianca.findUnique.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ── search ─────────────────────────────────────────────────────────────
  describe('search', () => {
    it('should search by nome (insensitive)', async () => {
      prisma.crianca.findMany.mockResolvedValue([]);
      await service.search('maria');
      expect(prisma.crianca.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            nome: { contains: 'maria', mode: 'insensitive' },
          }),
        }),
      );
    });

    it('should search by matricula', async () => {
      prisma.crianca.findMany.mockResolvedValue([]);
      await service.search(undefined, 1234);
      expect(prisma.crianca.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id_matricula: 1234 }),
        }),
      );
    });
  });

  // ── create ─────────────────────────────────────────────────────────────
  describe('create', () => {
    const dto: any = {
      nome: 'Maria',
      data_nascimento: '2015-06-15',
      cpf: '111',
      id_responsavel: 1,
    };

    it('should generate a random 4-digit matricula and create', async () => {
      prisma.crianca.findUnique.mockResolvedValue(null); // matricula disponivel
      prisma.crianca.create.mockResolvedValue({ id_matricula: 5000, nome: 'Maria' });

      const out = await service.create(dto);
      const call = prisma.crianca.create.mock.calls[0][0];
      expect(call.data.id_matricula).toBeGreaterThanOrEqual(1000);
      expect(call.data.id_matricula).toBeLessThanOrEqual(9999);
      expect(call.data.data_nascimento).toBeInstanceOf(Date);
      expect(out).toBeDefined();
    });

    it('should retry when matricula collides and succeed', async () => {
      // Simula: primeira tentativa acha existente, segunda acha livre
      prisma.crianca.findUnique
        .mockResolvedValueOnce({ id_matricula: 1234 })
        .mockResolvedValue(null);
      prisma.crianca.create.mockResolvedValue({ id_matricula: 5678 });

      await service.create(dto);
      expect(prisma.crianca.findUnique).toHaveBeenCalledTimes(2);
    });

    it('should throw Conflict after 50 matricula collision attempts', async () => {
      prisma.crianca.findUnique.mockResolvedValue({ id_matricula: 1234 });
      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      expect(prisma.crianca.findUnique).toHaveBeenCalledTimes(50);
    });

    it('should convert P2002 (CPF duplicado) to ConflictException', async () => {
      prisma.crianca.findUnique.mockResolvedValue(null);
      prisma.crianca.create.mockRejectedValue({ code: 'P2002' });
      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('should convert P2003 (FK responsavel) to NotFoundException', async () => {
      prisma.crianca.findUnique.mockResolvedValue(null);
      prisma.crianca.create.mockRejectedValue({ code: 'P2003' });
      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('should rethrow unknown errors', async () => {
      prisma.crianca.findUnique.mockResolvedValue(null);
      prisma.crianca.create.mockRejectedValue(new Error('boom'));
      await expect(service.create(dto)).rejects.toThrow('boom');
    });
  });

  // ── update ─────────────────────────────────────────────────────────────
  describe('update', () => {
    it('should throw Conflict when CPF is duplicated on another record', async () => {
      prisma.crianca.findUnique.mockResolvedValue({ id_matricula: 1234 });
      prisma.crianca.findFirst.mockResolvedValue({ id_matricula: 9999 });
      await expect(
        service.update(1234, { cpf: 'dup' } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('should convert data_nascimento string to Date', async () => {
      prisma.crianca.findUnique.mockResolvedValue({ id_matricula: 1234 });
      prisma.crianca.findFirst.mockResolvedValue(null);
      prisma.crianca.update.mockResolvedValue({ id_matricula: 1234 });
      await service.update(1234, { data_nascimento: '2010-01-01' } as any);
      const call = prisma.crianca.update.mock.calls[0][0];
      expect(call.data.data_nascimento).toBeInstanceOf(Date);
    });
  });

  // ── remove ─────────────────────────────────────────────────────────────
  describe('remove', () => {
    it('should hard delete', async () => {
      prisma.crianca.findUnique.mockResolvedValue({ id_matricula: 1234 });
      prisma.crianca.delete.mockResolvedValue({ id_matricula: 1234 });
      await service.remove(1234);
      expect(prisma.crianca.delete).toHaveBeenCalledWith({
        where: { id_matricula: 1234 },
      });
    });

    it('should throw NotFound when missing', async () => {
      prisma.crianca.findUnique.mockResolvedValue(null);
      await expect(service.remove(9999)).rejects.toThrow(NotFoundException);
    });
  });
});
