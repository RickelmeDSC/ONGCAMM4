import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Servir arquivos de upload estaticamente
  app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads/' });

  // Prefixo global para todos os endpoints
  app.setGlobalPrefix('api/v1');

  // Validação global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,             // remove campos não declarados no DTO
      forbidNonWhitelisted: true,  // rejeita requisições com campos extras
      transform: true,             // converte tipos automaticamente (string → number, etc.)
    }),
  );

  // CORS — em produção exige FRONTEND_URL, em dev libera tudo
  const isProduction = process.env.NODE_ENV === 'production';
  app.enableCors({
    origin: isProduction ? (process.env.FRONTEND_URL || false) : '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Swagger / OpenAPI — disponível em /api/docs
  const config = new DocumentBuilder()
    .setTitle('ONG CAMM4 API')
    .setDescription('API do sistema de gestão da ONG CAMM4')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`Aplicação rodando em: http://localhost:${port}/api/v1`);
  logger.log(`Documentação Swagger: http://localhost:${port}/api/docs`);
}

bootstrap();
