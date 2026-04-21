import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: jest.Mocked<Partial<AuthService>>;

  beforeEach(async () => {
    service = {
      login: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
      me: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: service }],
    }).compile();
    controller = module.get<AuthController>(AuthController);
  });

  it('login should delegate the full dto to service.login', async () => {
    (service.login as jest.Mock).mockResolvedValue({ access_token: 'x' });
    const dto: any = { email: 'a@b.com', senha: '1' };
    await controller.login(dto);
    expect(service.login).toHaveBeenCalledWith(dto);
  });

  it('refresh should forward the refresh_token string', async () => {
    (service.refresh as jest.Mock).mockResolvedValue({ access_token: 'x' });
    await controller.refresh({ refresh_token: 'tok' });
    expect(service.refresh).toHaveBeenCalledWith('tok');
  });

  it('logout should forward the refresh_token string', async () => {
    (service.logout as jest.Mock).mockResolvedValue({ message: 'ok' });
    await controller.logout({ refresh_token: 'tok' });
    expect(service.logout).toHaveBeenCalledWith('tok');
  });

  it('me should read id_usuario from current user', async () => {
    (service.me as jest.Mock).mockResolvedValue({ id_usuario: 5 });
    await controller.me({ id_usuario: 5 });
    expect(service.me).toHaveBeenCalledWith(5);
  });
});
