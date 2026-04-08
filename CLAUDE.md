# CLAUDE.md

## Projeto

Sistema de gestao para a ONG CAMM (Casa de Apoio Maria de Magdala). Monorepo com backend NestJS e frontend vanilla JS.

## Stack

- **Backend:** NestJS 10 + TypeScript 5.6 + Prisma 6.6 + PostgreSQL (Neon serverless)
- **Frontend:** HTML5/CSS3/JavaScript vanilla (sem framework) + Chart.js + Lucide icons
- **Deploy:** Vercel (frontend) + Render (backend Docker) + Neon (banco)
- **Auth:** JWT (1h) + Refresh Token (8h, rotacao automatica, armazenado no banco)

## Estrutura

```
Back-end/src/
  auth/          # JWT + refresh token + Turnstile CAPTCHA
  usuarios/      # CRUD usuarios (RBAC: 1=Voluntario, 2=Gestor, 3=Diretor)
  criancas/      # Cadastro de criancas
  responsaveis/  # Responsaveis legais
  frequencia/    # Controle de presenca (Manha/Tarde/Integral)
  atividades/    # Atividades internas
  eventos/       # Eventos externos
  doacoes/       # Doacoes
  declaracoes/   # Declaracoes PDF (somente Diretor)
  relatorios/    # Relatorios PDF
  dashboard/     # Metricas e analytics
  auditoria/     # Logs do sistema
  documentos/    # Upload de arquivos
  prisma/        # PrismaService
  common/        # Guards, decorators, interceptors, filters

Front-end/files/
  index.html     # Login
  app.js         # Toda logica frontend (~65KB)
  styles.css     # Estilos
  *.html         # Paginas individuais
```

## Comandos

```bash
# Backend
cd Back-end && npm install && npx prisma generate
npm run start:dev          # Dev com watch
npm run build && npm start # Producao
npm run lint               # ESLint

# Docker (stack completa)
docker compose up -d
```

## Padroes do projeto

- API prefixada com `/api/v1`
- Swagger em `/api/docs`
- Modulos seguem: `module.ts`, `controller.ts`, `service.ts`, `dto/`
- Guards globais: `JwtAuthGuard`, `RolesGuard`, `ThrottlerGuard` (30 req/min)
- `@Public()` para rotas sem auth, `@Roles(2, 3)` para restringir por nivel
- `LoggingInterceptor` registra todas as escritas (POST/PATCH/PUT/DELETE) no `LogSistema`
- DTOs com class-validator, whitelist mode ativo
- CORS: `*` em dev, `FRONTEND_URL` em producao

## Banco de dados

- Prisma com adapter Neon (`@prisma/adapter-neon`)
- `DATABASE_URL` = pooler (queries), `DIRECT_URL` = direto (migrations)
- 13 tabelas principais, todas com soft delete via campo `ativo`
- Migrations: `npx prisma migrate dev` (usa DIRECT_URL)

## Variaveis de ambiente (Backend)

`DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `JWT_EXPIRATION`, `PORT`, `NODE_ENV`, `UPLOAD_DIR`, `MAX_FILE_SIZE_MB`, `TURNSTILE_SECRET`, `FRONTEND_URL`

## Deploy

Push na `main` dispara deploy automatico:
- **Vercel:** output de `Front-end/files`
- **Render:** build Docker do `Back-end/`

## Skills

O projeto tem skills do Claude Code em `.claude/skills/`. Veja `.claude/skills-setup-prompt.md` para o mapa de composicao entre elas.
