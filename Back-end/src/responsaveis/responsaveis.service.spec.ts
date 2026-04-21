import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ResponsaveisService } from './responsaveis.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock, MockPrisma } from '../test-utils/prisma-mock';

describe('ResponsaveisService', () => {
  let service: ResponsaveisService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = createPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResponsaveisService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<ResponsaveisService>(ResponsaveisService);
  });

  describe('findAll', () => {
    it('should include criancas relation', async () => {
      prisma.responsavel.findMany.mockResolvedValue([]);
      await service.findAll();
      expect(prisma.responsavel.findMany).toHaveBeenCalledWith({
        include: { criancas: true },
      });
    });
  });

  describe('findOne', () => {
    it('should return with criancas relation', async () => {
      prisma.responsavel.findUnique.mockResolvedValue({ id_responsavel: 1 });
      await expect(service.findOne(1)).resolves.toBeDefined();
    });

    it('should throw NotFound when missing', async () => {
      prisma.responsavel.findUnique.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const dto: any = { nome: 'Rick', cpf: '123', contato: 'a', endereco: 'b' };

    it('should throw Conflict when CPF already exists', async () => {
      prisma.responsavel.findUnique.mockResolvedValue({ id_responsavel: 1 });
      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('should create when CPF is unique', async () => {
      prisma.responsavel.findUnique.mockResolvedValue(null);
      prisma.responsavel.create.mockResolvedValue({ id_responsavel: 2 });
      await expect(service.create(dto)).resolves.toBeDefined();
    });
  });

  describe('update', () => {
    it('should throw Conflict when new CPF belongs to another record', async () => {
      prisma.responsavel.findUnique.mockResolvedValue({ id_responsavel: 1 });
      prisma.responsavel.findFirst.mockResolvedValue({ id_responsavel: 2 });
      await expect(
        service.update(1, { cpf: 'dup' } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow update when CPF unchanged', async () => {
      prisma.responsavel.findUnique.mockResolvedValue({ id_responsavel: 1 });
      prisma.responsavel.findFirst.mockResolvedValue(null);
      prisma.responsavel.update.mockResolvedValue({ id_responsavel: 1 });
      await expect(service.update(1, { nome: 'Novo' } as any)).resolves.toBeDefined();
    });
  });

  describe('remove', () => {
    it('should hard delete', async () => {
      prisma.responsavel.findUnique.mockResolvedValue({ id_responsavel: 1 });
      prisma.responsavel.delete.mockResolvedValue({});
      await service.remove(1);
      expect(prisma.responsavel.delete).toHaveBeenCalledWith({
        where: { id_responsavel: 1 },
      });
    });
  });
});
