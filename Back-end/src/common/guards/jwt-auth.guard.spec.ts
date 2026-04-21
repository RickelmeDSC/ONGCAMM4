import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as any;
    guard = new JwtAuthGuard(reflector);
  });

  function ctx(): ExecutionContext {
    return { getHandler: () => ({}), getClass: () => ({}) } as any;
  }

  it('should bypass auth when route is marked @Public', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);
    expect(guard.canActivate(ctx())).toBe(true);
  });

  it('should delegate to passport AuthGuard when route is not public', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    const spy = jest
      .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate')
      .mockReturnValue(true as any);
    guard.canActivate(ctx());
    expect(spy).toHaveBeenCalled();
  });
});
