import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsuariosService } from './usuarios.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock, MockPrisma } from '../test-utils/prisma-mock';

describe('UsuariosService', () => {
  let service: UsuariosService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = createPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuariosService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<UsuariosService>(UsuariosService);
  });

  // ── findAll ────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should return all users without senha_hash', async () => {
      prisma.usuario.findMany.mockResolvedValue([
        { id_usuario: 1, nome: 'A', email: 'a@b.com', nivel_acesso: 2 },
      ]);
      const out = await service.findAll();
      expect(out).toHaveLength(1);
      expect(prisma.usuario.findMany).toHaveBeenCalledWith({
        select: { id_usuario: true, nome: true, email: true, nivel_acesso: true },
      });
    });
  });

  // ── findOne ────────────────────────────────────────────────────────────
  describe('findOne', () => {
    it('should return user when found', async () => {
      prisma.usuario.findUnique.mockResolvedValue({ id_usuario: 1, nome: 'A' });
      const out = await service.findOne(1);
      expect(out.nome).toBe('A');
    });

    it('should throw NotFound when missing', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  // ── create ─────────────────────────────────────────────────────────────
  describe('create', () => {
    const dto: any = { nome: 'A', email: 'a@b.com', senha: 'plain', nivel_acesso: 1 };

    it('should hash password with bcrypt (rounds=12) before creating', async () => {
      const hashSpy = jest.spyOn(bcrypt, 'hash').mockImplementation(async () => 'hashed');
      prisma.usuario.create.mockResolvedValue({ id_usuario: 1 });

      await service.create(dto);

      expect(hashSpy).toHaveBeenCalledWith('plain', 12);
      expect(prisma.usuario.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ senha_hash: 'hashed' }),
        }),
      );
    });

    it('should convert P2002 to ConflictException', async () => {
      jest.spyOn(bcrypt, 'hash').mockImplementation(async () => 'hashed');
      prisma.usuario.create.mockRejectedValue({ code: 'P2002' });
      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('should rethrow unknown errors', async () => {
      jest.spyOn(bcrypt, 'hash').mockImplementation(async () => 'hashed');
      prisma.usuario.create.mockRejectedValue(new Error('boom'));
      await expect(service.create(dto)).rejects.toThrow('boom');
    });
  });

  // ── update ─────────────────────────────────────────────────────────────
  describe('update', () => {
    it('should hash password when dto.senha is provided', async () => {
      prisma.usuario.findUnique.mockResolvedValue({ id_usuario: 1 });
      prisma.usuario.findFirst.mockResolvedValue(null);
      const hashSpy = jest.spyOn(bcrypt, 'hash').mockImplementation(async () => 'new-hash');
      prisma.usuario.update.mockResolvedValue({ id_usuario: 1 });

      await service.update(1, { senha: 'novaSenha' } as any);

      expect(hashSpy).toHaveBeenCalledWith('novaSenha', 12);
      expect(prisma.usuario.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ senha_hash: 'new-hash' }),
        }),
      );
    });

    it('should throw Conflict when another user already has the email', async () => {
      prisma.usuario.findUnique.mockResolvedValue({ id_usuario: 1 });
      prisma.usuario.findFirst.mockResolvedValue({ id_usuario: 2 });
      await expect(
        service.update(1, { email: 'dup@x.com' } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow updating to same email on own record', async () => {
      prisma.usuario.findUnique.mockResolvedValue({ id_usuario: 1 });
      prisma.usuario.findFirst.mockResolvedValue(null);
      prisma.usuario.update.mockResolvedValue({ id_usuario: 1 });
      await expect(
        service.update(1, { email: 'a@b.com' } as any),
      ).resolves.toBeDefined();
    });
  });

  // ── resetSenha ─────────────────────────────────────────────────────────
  describe('resetSenha', () => {
    it('should hash new password with rounds=12', async () => {
      prisma.usuario.findUnique.mockResolvedValue({ id_usuario: 1 });
      const hashSpy = jest.spyOn(bcrypt, 'hash').mockImplementation(async () => 'hash-new');
      prisma.usuario.update.mockResolvedValue({ id_usuario: 1 });

      await service.resetSenha(1, 'reset123');

      expect(hashSpy).toHaveBeenCalledWith('reset123', 12);
      expect(prisma.usuario.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { senha_hash: 'hash-new' },
        }),
      );
    });

    it('should throw NotFound when user does not exist', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);
      await expect(service.resetSenha(99, 'x')).rejects.toThrow(NotFoundException);
    });
  });

  // ── remove ─────────────────────────────────────────────────────────────
  describe('remove', () => {
    it('should hard delete the user', async () => {
      prisma.usuario.findUnique.mockResolvedValue({ id_usuario: 1 });
      prisma.usuario.delete.mockResolvedValue({ id_usuario: 1 });
      await service.remove(1);
      expect(prisma.usuario.delete).toHaveBeenCalledWith({
        where: { id_usuario: 1 },
      });
    });

    it('should throw NotFound when user does not exist', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);
      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });
  });
});
