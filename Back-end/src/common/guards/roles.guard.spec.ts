import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';

function mockContext(user: any): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as any;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as any;
    guard = new RolesGuard(reflector);
  });

  it('should allow when no @Roles decorator is present', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    expect(guard.canActivate(mockContext({ nivel_acesso: 1 }))).toBe(true);
  });

  it('should deny when request has no user', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([2]);
    expect(guard.canActivate(mockContext(undefined))).toBe(false);
  });

  it('should allow when user level equals required', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([2]);
    expect(guard.canActivate(mockContext({ nivel_acesso: 2 }))).toBe(true);
  });

  it('should allow when user level is higher than required', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([2]);
    expect(guard.canActivate(mockContext({ nivel_acesso: 3 }))).toBe(true);
  });

  it('should deny when user level is below required', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([3]);
    expect(guard.canActivate(mockContext({ nivel_acesso: 2 }))).toBe(false);
  });

  it('should deny Voluntário (1) accessing Gestor (2) endpoint', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([2]);
    expect(guard.canActivate(mockContext({ nivel_acesso: 1 }))).toBe(false);
  });
});
