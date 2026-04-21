import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock, MockPrisma } from '../test-utils/prisma-mock';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = createPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('fake-jwt') },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    delete process.env.TURNSTILE_SECRET;
  });

  // ── login ──────────────────────────────────────────────────────────────
  describe('login', () => {
    const validDto: any = { email: 'a@b.com', senha: '123' };
    const fakeUser = {
      id_usuario: 1,
      nome: 'Alice',
      email: 'a@b.com',
      senha_hash: 'hashed',
      nivel_acesso: 2,
    };

    it('should return tokens and user on valid credentials', async () => {
      prisma.usuario.findUnique.mockResolvedValue(fakeUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);
      prisma.refreshToken.create.mockResolvedValue({});
      prisma.refreshToken.deleteMany.mockResolvedValue({ count: 0 });

      const out = await service.login(validDto);

      expect(out.access_token).toBe('fake-jwt');
      expect(out.refresh_token).toMatch(/^[0-9a-f]+$/);
      expect(out.usuario).toEqual({
        id: 1,
        nome: 'Alice',
        email: 'a@b.com',
        nivel_acesso: 2,
      });
    });

    it('should throw UnauthorizedException when email not found', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);
      await expect(service.login(validDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password mismatches', async () => {
      prisma.usuario.findUnique.mockResolvedValue(fakeUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);
      await expect(service.login(validDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should fail CAPTCHA when Turnstile returns invalid', async () => {
      process.env.TURNSTILE_SECRET = 'secret';
      global.fetch = jest.fn().mockResolvedValue({
        json: async () => ({ success: false }),
      }) as any;
      await expect(
        service.login({ ...validDto, turnstile_token: 'bad' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should skip CAPTCHA when TURNSTILE_SECRET is not set', async () => {
      prisma.usuario.findUnique.mockResolvedValue(fakeUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);
      prisma.refreshToken.create.mockResolvedValue({});
      prisma.refreshToken.deleteMany.mockResolvedValue({ count: 0 });

      const out = await service.login({ ...validDto, turnstile_token: 'x' });
      expect(out.access_token).toBe('fake-jwt');
    });
  });

  // ── refresh ────────────────────────────────────────────────────────────
  describe('refresh', () => {
    const fakeUser = {
      id_usuario: 1,
      nome: 'Alice',
      email: 'a@b.com',
      nivel_acesso: 2,
    };

    it('should rotate the refresh token and return new tokens', async () => {
      const future = new Date(Date.now() + 60_000);
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 10,
        token: 'old-token',
        expires_at: future,
        usuario: fakeUser,
      });
      prisma.refreshToken.delete.mockResolvedValue({});
      prisma.refreshToken.create.mockResolvedValue({});
      prisma.refreshToken.deleteMany.mockResolvedValue({ count: 0 });

      const out = await service.refresh('old-token');

      expect(prisma.refreshToken.delete).toHaveBeenCalledWith({ where: { id: 10 } });
      expect(out.access_token).toBe('fake-jwt');
      expect(out.refresh_token).not.toBe('old-token');
    });

    it('should throw when refresh token does not exist', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);
      await expect(service.refresh('unknown')).rejects.toThrow(UnauthorizedException);
    });

    it('should delete and throw when token is expired', async () => {
      const past = new Date(Date.now() - 60_000);
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 10,
        token: 'old',
        expires_at: past,
        usuario: fakeUser,
      });
      prisma.refreshToken.delete.mockResolvedValue({});

      await expect(service.refresh('old')).rejects.toThrow(UnauthorizedException);
      expect(prisma.refreshToken.delete).toHaveBeenCalledWith({ where: { id: 10 } });
    });
  });

  // ── logout ─────────────────────────────────────────────────────────────
  describe('logout', () => {
    it('should call deleteMany with the provided token', async () => {
      prisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });
      await service.logout('tok-123');
      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { token: 'tok-123' },
      });
    });

    it('should not throw when token does not exist', async () => {
      prisma.refreshToken.deleteMany.mockResolvedValue({ count: 0 });
      await expect(service.logout('ghost')).resolves.toEqual({
        message: 'Logout realizado com sucesso',
      });
    });
  });

  // ── me ─────────────────────────────────────────────────────────────────
  describe('me', () => {
    it('should return user info without senha_hash', async () => {
      prisma.usuario.findUnique.mockResolvedValue({
        id_usuario: 1,
        nome: 'Alice',
        email: 'a@b.com',
        nivel_acesso: 3,
      });
      const out = await service.me(1);
      expect(out).not.toHaveProperty('senha_hash');
    });

    it('should throw when user not found', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);
      await expect(service.me(99)).rejects.toThrow(UnauthorizedException);
    });
  });
});
