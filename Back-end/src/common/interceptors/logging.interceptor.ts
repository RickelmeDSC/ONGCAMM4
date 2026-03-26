import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user } = request;

    const writeMethods = ['POST', 'PATCH', 'PUT', 'DELETE'];
    if (!writeMethods.includes(method) || !user) {
      return next.handle();
    }

    // Extrair entidade e ID da URL (ex: /api/v1/criancas/5 → entidade: "crianca", entidade_id: 5)
    const urlParts = url.replace(/^\/api\/v1\//, '').split('/');
    const entidade = urlParts[0] || null;
    const entidade_id = urlParts[1] ? parseInt(urlParts[1], 10) || null : null;
    const ip = request.ip || request.headers['x-forwarded-for'] || null;

    return next.handle().pipe(
      tap(() => {
        this.prisma.logSistema
          .create({
            data: {
              id_usuario: user.id_usuario,
              acao: `${method} ${url}`,
              entidade,
              entidade_id,
              ip: typeof ip === 'string' ? ip : null,
            },
          })
          .catch(() => {});
      }),
    );
  }
}
