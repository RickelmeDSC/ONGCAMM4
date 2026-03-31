import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { ResponsaveisModule } from './responsaveis/responsaveis.module';
import { CriancasModule } from './criancas/criancas.module';
import { DocumentosModule } from './documentos/documentos.module';
import { FrequenciaModule } from './frequencia/frequencia.module';
import { AtividadesModule } from './atividades/atividades.module';
import { EventosModule } from './eventos/eventos.module';
import { DoacoesModule } from './doacoes/doacoes.module';
import { DeclaracoesModule } from './declaracoes/declaracoes.module';
import { RelatoriosModule } from './relatorios/relatorios.module';
import { AuditoriaModule } from './auditoria/auditoria.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 30 }]), // 30 requests por minuto global
    PrismaModule,
    AuthModule,
    UsuariosModule,
    ResponsaveisModule,
    CriancasModule,
    DocumentosModule,
    FrequenciaModule,
    AtividadesModule,
    EventosModule,
    DoacoesModule,
    DeclaracoesModule,
    RelatoriosModule,
    AuditoriaModule,
    DashboardModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}
