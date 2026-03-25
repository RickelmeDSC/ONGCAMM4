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

    return next.handle().pipe(
      tap(() => {
        this.prisma.logSistema
          .create({
            data: {
              id_usuario: user.id_usuario,
              acao: `${method} ${url}`,
            },
          })
          .catch(() => {});
      }),
    );
  }
}
