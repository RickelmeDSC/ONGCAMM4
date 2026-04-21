import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';
import { PrismaService } from '../../prisma/prisma.service';
import { createPrismaMock, MockPrisma } from '../../test-utils/prisma-mock';

function ctxMock(method: string, url: string, user?: any): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        method,
        url,
        user,
        ip: '127.0.0.1',
        headers: {},
      }),
    }),
  } as any;
}

function nextMock(): CallHandler {
  return { handle: () => of('result') };
}

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createPrismaMock();
    interceptor = new LoggingInterceptor(prisma as unknown as PrismaService);
  });

  it('should NOT log GET requests', (done) => {
    interceptor.intercept(ctxMock('GET', '/api/v1/criancas', { id_usuario: 1 }), nextMock())
      .subscribe(() => {
        expect(prisma.logSistema.create).not.toHaveBeenCalled();
        done();
      });
  });

  it('should NOT log when user is anonymous (public routes)', (done) => {
    interceptor.intercept(ctxMock('POST', '/api/v1/auth/login'), nextMock())
      .subscribe(() => {
        expect(prisma.logSistema.create).not.toHaveBeenCalled();
        done();
      });
  });

  it('should log POST with entidade from URL', (done) => {
    prisma.logSistema.create.mockResolvedValue({});
    interceptor.intercept(
      ctxMock('POST', '/api/v1/criancas', { id_usuario: 42 }),
      nextMock(),
    ).subscribe(() => {
      expect(prisma.logSistema.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id_usuario: 42,
          acao: 'POST /api/v1/criancas',
          entidade: 'criancas',
          entidade_id: null,
          ip: '127.0.0.1',
        }),
      });
      done();
    });
  });

  it('should log DELETE with entidade_id parsed from URL', (done) => {
    prisma.logSistema.create.mockResolvedValue({});
    interceptor.intercept(
      ctxMock('DELETE', '/api/v1/criancas/1234', { id_usuario: 1 }),
      nextMock(),
    ).subscribe(() => {
      expect(prisma.logSistema.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entidade: 'criancas',
          entidade_id: 1234,
        }),
      });
      done();
    });
  });

  it('should swallow errors from the log write', (done) => {
    prisma.logSistema.create.mockRejectedValue(new Error('db down'));
    interceptor.intercept(
      ctxMock('PATCH', '/api/v1/usuarios/5', { id_usuario: 1 }),
      nextMock(),
    ).subscribe({
      next: (v) => {
        expect(v).toBe('result');
        done();
      },
    });
  });
});
