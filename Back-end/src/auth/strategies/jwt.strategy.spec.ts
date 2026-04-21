import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    strategy = new JwtStrategy();
  });

  it('should map payload.sub to id_usuario and include other claims', async () => {
    const out = await strategy.validate({
      sub: 42,
      nome: 'Alice',
      nivel_acesso: 2,
    });
    expect(out).toEqual({ id_usuario: 42, nome: 'Alice', nivel_acesso: 2 });
  });

  it('should throw Unauthorized when payload has no sub', async () => {
    await expect(strategy.validate({ nome: 'X' })).rejects.toThrow(UnauthorizedException);
  });

  it('should throw Unauthorized when payload is null', async () => {
    await expect(strategy.validate(null)).rejects.toThrow(UnauthorizedException);
  });
});
