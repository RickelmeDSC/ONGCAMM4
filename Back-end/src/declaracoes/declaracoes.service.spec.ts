import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DeclaracoesService } from './declaracoes.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock, MockPrisma } from '../test-utils/prisma-mock';

describe('DeclaracoesService', () => {
  let service: DeclaracoesService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = createPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeclaracoesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<DeclaracoesService>(DeclaracoesService);
  });

  describe('findAll', () => {
    it('should include crianca+responsavel and autorizador without senha_hash', async () => {
      prisma.declaracao.findMany.mockResolvedValue([]);
      await service.findAll();
      const call = prisma.declaracao.findMany.mock.calls[0][0];
      expect(call.include.crianca.include.responsavel).toBe(true);
      expect(call.include.autorizador.select).not.toHaveProperty('senha_hash');
      expect(call.orderBy).toEqual({ data_emissao: 'desc' });
    });
  });

  describe('findOne', () => {
    it('should throw NotFound when missing', async () => {
      prisma.declaracao.findUnique.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('gerarPdf', () => {
    it('should return a Buffer with PDF magic bytes', async () => {
      prisma.declaracao.findUnique.mockResolvedValue({
        id_declaracao: 1,
        nome_parente: 'Ana Silva',
        parentesco: 'Tia',
        data_emissao: new Date('2026-04-12'),
        crianca: {
          id_matricula: 1234,
          nome: 'Maria',
          data_nascimento: new Date('2015-06-15'),
          responsavel: { nome: 'Pai', cpf: '1' },
        },
        autorizador: { id_usuario: 1, nome: 'Diretor', nivel_acesso: 3 },
      });

      const buf = await service.gerarPdf(1);
      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(buf.slice(0, 4).toString()).toBe('%PDF');
    });

    it('should throw NotFound when declaracao does not exist', async () => {
      prisma.declaracao.findUnique.mockResolvedValue(null);
      await expect(service.gerarPdf(99)).rejects.toThrow(NotFoundException);
    });
  });
});
