# CLAUDE.md — Documentação Global do Projeto Backend ONG CAMM4

> Este arquivo é a fonte de verdade do projeto. Toda implementação deve seguir rigorosamente o que está definido aqui. Nenhuma decisão arquitetural deve ser tomada sem consultar este documento.

---

## 1. VISÃO GERAL DO SISTEMA

O sistema ONG CAMM4 é uma plataforma web destinada a digitalizar e profissionalizar a gestão interna de uma organização não governamental. Atualmente, todos os processos são conduzidos manualmente em papel, o que gera ineficiência operacional, risco de perda de dados, dificuldade de auditoria e ausência de controle de acesso.

A solução proposta é um sistema web completo com backend em NestJS, banco de dados PostgreSQL gerenciado via Prisma ORM, autenticação baseada em JWT com hash de senha via bcrypt, geração de relatórios em PDF e controle granular de permissões por nível de acesso.

### 1.1 Objetivos Principais

- Substituir o controle manual por um sistema digital centralizado
- Garantir segurança no acesso e manipulação de dados
- Permitir rastreabilidade completa de todas as ações do sistema
- Facilitar a geração de documentos oficiais e relatórios de auditoria
- Estruturar o crescimento organizado e escalável da plataforma

### 1.2 Público-Alvo do Sistema

| Perfil | Nível | Descrição |
|---|---|---|
| Diretor | 3 | Acesso irrestrito a todas as funcionalidades |
| Gestor | 2 | Gerenciamento geral com restrições em operações críticas |
| Voluntário | 1 | Acesso somente leitura e operações básicas |

---

## 2. STACK TECNOLÓGICA

| Camada | Tecnologia | Versão Recomendada |
|---|---|---|
| Runtime | Node.js | >= 20 LTS |
| Framework | NestJS | >= 10 |
| Linguagem | TypeScript | >= 5 |
| ORM | Prisma | >= 5 |
| Banco de Dados | PostgreSQL | Neon (serverless) |
| Autenticação | JWT + bcrypt | jsonwebtoken + bcryptjs |
| Upload | Multer + path local | salva caminho no banco |
| PDF | pdf-lib | >= 1.17 |
| Validação | class-validator + class-transformer | >= 0.14 |
| Documentação | Swagger (OpenAPI) | via @nestjs/swagger |
| Testes | Jest + Supertest | via @nestjs/testing |

---

## 3. ARQUITETURA DO BACKEND

O backend segue a arquitetura modular do NestJS, organizada por domínios de negócio. Cada módulo é independente, segue o padrão Controller → Service → Repository (via Prisma), e é protegido por Guards de autenticação e autorização.

### 3.1 Padrão de Camadas

```
Request HTTP
    ↓
[ Guard: JwtAuthGuard ]         ← verifica token JWT
    ↓
[ Guard: RolesGuard ]           ← verifica nível de acesso
    ↓
[ Controller ]                  ← recebe e valida DTOs, chama Service
    ↓
[ Service ]                     ← lógica de negócio, chama Prisma
    ↓
[ Prisma Client ]               ← acesso ao banco PostgreSQL (Neon)
    ↓
[ Interceptor: LoggingInterceptor ] ← registra ação no LOG_SISTEMA
```

### 3.2 Módulos do Sistema

| Módulo | Responsável | Descrição |
|---|---|---|
| auth | Rickelme | Login, logout, geração de token JWT |
| usuarios | Rickelme | CRUD de usuários, controle de nível de acesso |
| criancas | Mike | Cadastro e gestão de crianças |
| responsaveis | Mike | Cadastro e gestão de responsáveis |
| documentos | Mike | Upload e vinculação de documentos (foto, certidão, cartão vacina) |
| frequencia | Lucas | Registro e histórico de frequência |
| atividades | Lucas | Registro de atividades internas |
| eventos | Lucas | Registro de eventos externos |
| doacoes | Lucas | Registro de doações recebidas |
| declaracoes | Lucas | Emissão de declarações de responsabilidade |
| relatorios | Lucas | Geração de relatórios em PDF |
| auditoria | Lucas | Consulta de logs de sistema |
| logs | Rickelme | Interceptor global de logs |
| prisma | Rickelme | Módulo global do Prisma Client |

---

## 4. ESTRUTURA DE PASTAS

```
Back-end/
├── prisma/
│   ├── schema.prisma               ← definição de todas as tabelas
│   └── migrations/                 ← histórico de migrações do banco
│
├── src/
│   ├── main.ts                     ← bootstrap da aplicação NestJS
│   ├── app.module.ts               ← módulo raiz, importa todos os módulos
│   │
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts  ← @Roles(2, 3)
│   │   │   └── current-user.decorator.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts   ← verifica token JWT válido
│   │   │   └── roles.guard.ts      ← verifica nível de acesso mínimo
│   │   ├── interceptors/
│   │   │   └── logging.interceptor.ts ← grava LOG_SISTEMA automaticamente
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts ← padroniza erros HTTP
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts  ← valida DTOs globalmente
│   │   └── utils/
│   │       ├── hash.util.ts        ← bcrypt helpers
│   │       └── cpf.util.ts         ← validação de CPF
│   │
│   ├── prisma/
│   │   ├── prisma.module.ts        ← módulo global
│   │   └── prisma.service.ts       ← instância do PrismaClient
│   │
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts     ← configuração da estratégia JWT
│   │   └── dto/
│   │       └── login.dto.ts
│   │
│   ├── usuarios/
│   │   ├── usuarios.module.ts
│   │   ├── usuarios.controller.ts
│   │   ├── usuarios.service.ts
│   │   └── dto/
│   │       ├── create-usuario.dto.ts
│   │       └── update-usuario.dto.ts
│   │
│   ├── criancas/
│   │   ├── criancas.module.ts
│   │   ├── criancas.controller.ts
│   │   ├── criancas.service.ts
│   │   └── dto/
│   │       ├── create-crianca.dto.ts
│   │       └── update-crianca.dto.ts
│   │
│   ├── responsaveis/
│   │   ├── responsaveis.module.ts
│   │   ├── responsaveis.controller.ts
│   │   ├── responsaveis.service.ts
│   │   └── dto/
│   │       ├── create-responsavel.dto.ts
│   │       └── update-responsavel.dto.ts
│   │
│   ├── documentos/
│   │   ├── documentos.module.ts
│   │   ├── documentos.controller.ts
│   │   ├── documentos.service.ts
│   │   └── upload.config.ts        ← configuração do Multer
│   │
│   ├── frequencia/
│   │   ├── frequencia.module.ts
│   │   ├── frequencia.controller.ts
│   │   ├── frequencia.service.ts
│   │   └── dto/
│   │       └── create-frequencia.dto.ts
│   │
│   ├── atividades/
│   │   ├── atividades.module.ts
│   │   ├── atividades.controller.ts
│   │   ├── atividades.service.ts
│   │   └── dto/
│   │       ├── create-atividade.dto.ts
│   │       └── update-atividade.dto.ts
│   │
│   ├── eventos/
│   │   ├── eventos.module.ts
│   │   ├── eventos.controller.ts
│   │   ├── eventos.service.ts
│   │   └── dto/
│   │       ├── create-evento.dto.ts
│   │       └── update-evento.dto.ts
│   │
│   ├── doacoes/
│   │   ├── doacoes.module.ts
│   │   ├── doacoes.controller.ts
│   │   ├── doacoes.service.ts
│   │   └── dto/
│   │       └── create-doacao.dto.ts
│   │
│   ├── declaracoes/
│   │   ├── declaracoes.module.ts
│   │   ├── declaracoes.controller.ts
│   │   ├── declaracoes.service.ts
│   │   └── dto/
│   │       └── create-declaracao.dto.ts
│   │
│   ├── relatorios/
│   │   ├── relatorios.module.ts
│   │   ├── relatorios.controller.ts
│   │   ├── relatorios.service.ts
│   │   └── pdf/
│   │       └── relatorio.generator.ts ← geração de PDF com pdf-lib
│   │
│   └── auditoria/
│       ├── auditoria.module.ts
│       ├── auditoria.controller.ts
│       └── auditoria.service.ts
│
├── uploads/                        ← diretório de arquivos enviados (não versionado)
│   ├── fotos/
│   ├── certidoes/
│   └── cartoes-vacina/
│
├── .env                            ← variáveis de ambiente (não versionado)
├── .env.example                    ← modelo de variáveis de ambiente
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
├── package.json
└── CLAUDE.md                       ← este arquivo
```

---

## 5. MODELAGEM DO BANCO DE DADOS (PRISMA SCHEMA)

A estrutura abaixo é a representação exata do diagrama ER do projeto. Nenhum campo deve ser omitido ou renomeado sem aprovação da equipe.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Usuario {
  id_usuario   Int      @id @default(autoincrement())
  nome         String
  email        String   @unique
  senha_hash   String
  nivel_acesso Int

  logs         LogSistema[]
  eventos      Evento[]
  atividades   Atividade[]
  declaracoes  Declaracao[]

  @@map("usuario")
}

model Responsavel {
  id_responsavel Int      @id @default(autoincrement())
  nome           String
  cpf            String   @unique
  contato        String
  endereco       String

  criancas       Crianca[]

  @@map("responsavel")
}

model Crianca {
  id_matricula     Int      @id @default(autoincrement())
  nome             String
  data_nascimento  DateTime
  cpf              String   @unique
  foto_path        String?
  certidao_nasc    String?
  cartao_vacina    String?
  data_entrada     DateTime @default(now())
  id_responsavel   Int

  responsavel      Responsavel  @relation(fields: [id_responsavel], references: [id_responsavel])
  frequencias      Frequencia[]
  declaracoes      Declaracao[]

  @@map("crianca")
}

model Frequencia {
  id_frequencia  Int      @id @default(autoincrement())
  id_matricula   Int
  data_registro  DateTime @default(now())
  status         String

  crianca        Crianca  @relation(fields: [id_matricula], references: [id_matricula])

  @@map("frequencia")
}

model Atividade {
  id_atividade     Int      @id @default(autoincrement())
  titulo           String
  data_realizacao  DateTime
  id_usuario_resp  Int

  responsavel      Usuario  @relation(fields: [id_usuario_resp], references: [id_usuario])

  @@map("atividade")
}

model Evento {
  id_evento        Int      @id @default(autoincrement())
  nome_evento      String
  local            String
  data_realizacao  DateTime
  id_usuario_resp  Int

  responsavel      Usuario  @relation(fields: [id_usuario_resp], references: [id_usuario])

  @@map("evento")
}

model Doacao {
  id_doacao    Int      @id @default(autoincrement())
  doador       String
  tipo         String
  valor        Decimal  @db.Decimal(10, 2)
  data_doacao  DateTime @default(now())

  @@map("doacao")
}

model Declaracao {
  id_declaracao          Int      @id @default(autoincrement())
  id_matricula           Int
  id_usuario_autorizador Int
  nome_parente           String
  parentesco             String
  data_emissao           DateTime @default(now())

  crianca                Crianca  @relation(fields: [id_matricula], references: [id_matricula])
  autorizador            Usuario  @relation(fields: [id_usuario_autorizador], references: [id_usuario])

  @@map("declaracao")
}

model RelatorioAuditoria {
  id_relatorio  Int      @id @default(autoincrement())
  tipo_periodo  String
  data_geracao  DateTime @default(now())
  path_arquivo  String

  @@map("relatorio_auditoria")
}

model LogSistema {
  id_log      Int      @id @default(autoincrement())
  id_usuario  Int
  acao        String
  data_hora   DateTime @default(now())

  usuario     Usuario  @relation(fields: [id_usuario], references: [id_usuario])

  @@map("log_sistema")
}
```

---

## 6. MAPEAMENTO COMPLETO DE ENDPOINTS

Todos os endpoints são prefixados com `/api/v1`. Todos (exceto `/auth/login`) exigem o header `Authorization: Bearer <token>`.

### 6.1 Autenticação — Rickelme

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| POST | /auth/login | Público | Autentica usuário e retorna token JWT |
| POST | /auth/logout | Todos | Invalida sessão |
| GET | /auth/me | Todos | Retorna dados do usuário autenticado |

### 6.2 Usuários — Rickelme

| Método | Rota | Acesso Mínimo | Descrição |
|---|---|---|---|
| GET | /usuarios | Gestor (2) | Lista todos os usuários |
| GET | /usuarios/:id | Gestor (2) | Retorna um usuário por ID |
| POST | /usuarios | Diretor (3) | Cria novo usuário |
| PATCH | /usuarios/:id | Diretor (3) | Atualiza dados do usuário |
| DELETE | /usuarios/:id | Diretor (3) | Remove usuário do sistema |

### 6.3 Crianças — Mike

| Método | Rota | Acesso Mínimo | Descrição |
|---|---|---|---|
| GET | /criancas | Voluntário (1) | Lista todas as crianças |
| GET | /criancas/busca?nome=&matricula= | Voluntário (1) | Busca por nome ou matrícula |
| GET | /criancas/:id | Voluntário (1) | Retorna criança por ID |
| POST | /criancas | Gestor (2) | Cadastra nova criança |
| PATCH | /criancas/:id | Gestor (2) | Atualiza dados da criança |
| DELETE | /criancas/:id | Diretor (3) | Remove criança do sistema |

### 6.4 Responsáveis — Mike

| Método | Rota | Acesso Mínimo | Descrição |
|---|---|---|---|
| GET | /responsaveis | Voluntário (1) | Lista todos os responsáveis |
| GET | /responsaveis/:id | Voluntário (1) | Retorna responsável por ID |
| POST | /responsaveis | Gestor (2) | Cadastra novo responsável |
| PATCH | /responsaveis/:id | Gestor (2) | Atualiza dados do responsável |
| DELETE | /responsaveis/:id | Diretor (3) | Remove responsável |

### 6.5 Documentos — Mike

| Método | Rota | Acesso Mínimo | Descrição |
|---|---|---|---|
| POST | /documentos/upload/foto/:id | Gestor (2) | Upload de foto da criança |
| POST | /documentos/upload/certidao/:id | Gestor (2) | Upload de certidão de nascimento |
| POST | /documentos/upload/vacina/:id | Gestor (2) | Upload de cartão de vacina |
| GET | /documentos/:id | Voluntário (1) | Lista documentos de uma criança |

### 6.6 Frequência — Lucas

| Método | Rota | Acesso Mínimo | Descrição |
|---|---|---|---|
| GET | /frequencia | Voluntário (1) | Lista todos os registros de frequência |
| GET | /frequencia/crianca/:id | Voluntário (1) | Histórico de frequência por criança |
| GET | /frequencia/data/:data | Voluntário (1) | Frequência de um dia específico |
| POST | /frequencia | Voluntário (1) | Registra presença/ausência |
| PATCH | /frequencia/:id | Gestor (2) | Corrige registro de frequência |
| DELETE | /frequencia/:id | Diretor (3) | Remove registro de frequência |

### 6.7 Atividades — Lucas

| Método | Rota | Acesso Mínimo | Descrição |
|---|---|---|---|
| GET | /atividades | Voluntário (1) | Lista todas as atividades |
| GET | /atividades/:id | Voluntário (1) | Retorna atividade por ID |
| POST | /atividades | Gestor (2) | Registra nova atividade |
| PATCH | /atividades/:id | Gestor (2) | Atualiza atividade |
| DELETE | /atividades/:id | Diretor (3) | Remove atividade |

### 6.8 Eventos — Lucas

| Método | Rota | Acesso Mínimo | Descrição |
|---|---|---|---|
| GET | /eventos | Voluntário (1) | Lista todos os eventos |
| GET | /eventos/:id | Voluntário (1) | Retorna evento por ID |
| POST | /eventos | Gestor (2) | Registra novo evento |
| PATCH | /eventos/:id | Gestor (2) | Atualiza evento |
| DELETE | /eventos/:id | Diretor (3) | Remove evento |

### 6.9 Doações — Lucas

| Método | Rota | Acesso Mínimo | Descrição |
|---|---|---|---|
| GET | /doacoes | Gestor (2) | Lista todas as doações |
| GET | /doacoes/:id | Gestor (2) | Retorna doação por ID |
| POST | /doacoes | Gestor (2) | Registra nova doação |
| PATCH | /doacoes/:id | Gestor (2) | Atualiza doação |
| DELETE | /doacoes/:id | Diretor (3) | Remove doação |

### 6.10 Declarações — Lucas

| Método | Rota | Acesso Mínimo | Descrição |
|---|---|---|---|
| GET | /declaracoes | Gestor (2) | Lista todas as declarações |
| GET | /declaracoes/:id | Gestor (2) | Retorna declaração por ID |
| POST | /declaracoes | Diretor (3) | Emite nova declaração |
| GET | /declaracoes/:id/pdf | Gestor (2) | Gera PDF da declaração |

### 6.11 Relatórios — Lucas

| Método | Rota | Acesso Mínimo | Descrição |
|---|---|---|---|
| GET | /relatorios | Gestor (2) | Lista relatórios gerados |
| POST | /relatorios/frequencia | Gestor (2) | Gera relatório de frequência em PDF |
| POST | /relatorios/doacoes | Gestor (2) | Gera relatório de doações em PDF |
| POST | /relatorios/atividades | Gestor (2) | Gera relatório de atividades em PDF |
| POST | /relatorios/auditoria | Diretor (3) | Gera relatório de auditoria em PDF |
| GET | /relatorios/:id/download | Gestor (2) | Faz download de um relatório gerado |

### 6.12 Auditoria — Lucas

| Método | Rota | Acesso Mínimo | Descrição |
|---|---|---|---|
| GET | /auditoria/logs | Diretor (3) | Lista todos os logs do sistema |
| GET | /auditoria/logs/usuario/:id | Diretor (3) | Logs por usuário específico |
| GET | /auditoria/logs/periodo?inicio=&fim= | Diretor (3) | Logs em intervalo de datas |

---

## 7. ESTRATÉGIA DE AUTENTICAÇÃO

### 7.1 Fluxo de Login

1. Cliente envia POST /auth/login com { email, senha }
2. AuthService busca usuario por email no banco
3. bcrypt.compare(senha, usuario.senha_hash)
4. Se válido: gera JWT assinado com id_usuario e nivel_acesso
5. Retorna { access_token, expires_in, usuario: { id, nome, nivel_acesso } }

### 7.2 Estrutura do JWT Payload

```json
{
  "sub": 1,
  "nome": "Rickelme Silva",
  "nivel_acesso": 3,
  "iat": 1711234567,
  "exp": 1711320967
}
```

### 7.3 Configurações do Token

- Algoritmo: HS256
- Expiração: 24 horas
- Secret: variável de ambiente JWT_SECRET (mínimo 64 caracteres)
- Transmissão: header Authorization: Bearer token

### 7.4 JwtStrategy

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    return {
      id_usuario: payload.sub,
      nome: payload.nome,
      nivel_acesso: payload.nivel_acesso,
    };
  }
}
```

---

## 8. ESTRATÉGIA DE AUTORIZAÇÃO

### 8.1 Decorator Roles

```typescript
export const ROLES_KEY = 'roles';
export const Roles = (...roles: number[]) => SetMetadata(ROLES_KEY, roles);
```

### 8.2 RolesGuard

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<number[]>(ROLES_KEY, context.getHandler());
    if (!requiredRoles) return true;
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some(role => user.nivel_acesso >= role);
  }
}
```

### 8.3 Aplicação Global dos Guards

```typescript
providers: [
  { provide: APP_GUARD, useClass: JwtAuthGuard },
  { provide: APP_GUARD, useClass: RolesGuard },
]
```

### 8.4 Tabela de Permissões

| Operação | Voluntário (1) | Gestor (2) | Diretor (3) |
|---|---|---|---|
| Visualizar crianças | Sim | Sim | Sim |
| Cadastrar crianças | Não | Sim | Sim |
| Excluir crianças | Não | Não | Sim |
| Registrar frequência | Sim | Sim | Sim |
| Gerar declaração | Não | Não | Sim |
| Gerenciar usuários | Não | Não | Sim |
| Visualizar logs | Não | Não | Sim |
| Gerar relatórios | Não | Sim | Sim |

---

## 9. ESTRATÉGIA DE LOGS

### 9.1 LoggingInterceptor

Todo endpoint autenticado que realiza POST, PATCH ou DELETE deve gerar um registro na tabela log_sistema automaticamente via interceptor global.

```typescript
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
        this.prisma.logSistema.create({
          data: {
            id_usuario: user.id_usuario,
            acao: method + ' ' + url,
            data_hora: new Date(),
          },
        }).catch(() => {});
      }),
    );
  }
}
```

### 9.2 Estrutura de um Log

```json
{
  "id_log": 42,
  "id_usuario": 1,
  "acao": "POST /api/v1/criancas",
  "data_hora": "2026-03-24T14:32:00.000Z"
}
```

### 9.3 Retenção de Logs

- Logs são armazenados indefinidamente no banco de dados
- O Diretor consulta via /api/v1/auditoria/logs
- Logs nunca são deletados

---

## 10. VALIDAÇÃO DE DADOS

```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}));
```

### 10.1 Regras de Validação por Entidade

**Usuario:**
- email: formato válido, único no banco
- senha: mínimo 8 caracteres
- nivel_acesso: inteiro entre 1 e 3

**Crianca:**
- cpf: formato válido e único no banco
- data_nascimento: data válida, não futura
- id_responsavel: deve existir no banco

**Frequencia:**
- status: somente "Presente" ou "Ausente"
- data_registro: não pode ser futura

**Declaracao:**
- Somente usuarios com nivel_acesso >= 3 podem criar
- id_matricula: criança deve existir no banco

---

## 11. TRATAMENTO DE ERROS

Formato padronizado via HttpExceptionFilter:

```json
{
  "statusCode": 400,
  "message": "CPF já cadastrado no sistema",
  "error": "Bad Request",
  "timestamp": "2026-03-24T14:32:00.000Z",
  "path": "/api/v1/criancas"
}
```

| Situação | HTTP Status |
|---|---|
| Token ausente ou inválido | 401 Unauthorized |
| Nível de acesso insuficiente | 403 Forbidden |
| Recurso não encontrado | 404 Not Found |
| CPF/email duplicado | 409 Conflict |
| Dados inválidos no body | 400 Bad Request |
| Erro interno do servidor | 500 Internal Server Error |

---

## 12. UPLOAD DE ARQUIVOS

O arquivo é salvo no servidor local e o caminho é armazenado no banco de dados. Nunca armazene o binário no banco.

```typescript
export const multerConfig: MulterOptions = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      const tipo = req.params.tipo ?? 'outros';
      const dest = './uploads/' + tipo;
      mkdirSync(dest, { recursive: true });
      cb(null, dest);
    },
    filename: (req, file, cb) => {
      const ext = extname(file.originalname);
      const filename = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;
      cb(null, filename);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    cb(null, allowed.includes(file.mimetype));
  },
};
```

---

## 13. GERAÇÃO DE PDF

PDFs gerados com pdf-lib, salvos em ./uploads/relatorios/ e o caminho registrado na tabela relatorio_auditoria.

```typescript
export async function gerarPdfFrequencia(dados: any[]): Promise<string> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage(PageSizes.A4);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  page.drawText('Relatório de Frequência — ONG CAMM4', {
    x: 50, y: 780, size: 18, font,
  });

  const pdfBytes = await pdfDoc.save();
  const filename = 'frequencia-' + Date.now() + '.pdf';
  const filePath = './uploads/relatorios/' + filename;
  writeFileSync(filePath, pdfBytes);
  return filePath;
}
```

---

## 14. VARIÁVEIS DE AMBIENTE

```env
DATABASE_URL="postgresql://user:password@host/db?sslmode=require"
JWT_SECRET="gere-uma-string-aleatoria-de-64-caracteres-minimo"
JWT_EXPIRATION="86400"
PORT=3000
NODE_ENV=development
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE_MB=5
```

---

## 15. FLUXO COMPLETO DO SISTEMA

```
[Usuário] → Login com email/senha
     ↓
[Sistema] → Valida credenciais → Gera JWT
     ↓
[Usuário] → Envia requisições com Bearer Token
     ↓
[JwtAuthGuard] → Valida token → Injeta user no request
     ↓
[RolesGuard] → Verifica nivel_acesso vs @Roles()
     ↓
[Controller] → Valida DTO → Chama Service
     ↓
[Service] → Executa regra de negócio → Chama Prisma
     ↓
[Prisma] → Executa query no PostgreSQL (Neon)
     ↓
[LoggingInterceptor] → Registra ação no LOG_SISTEMA
     ↓
[Response] → Retorna dados ao cliente
```

---

## 16. DIVISÃO DE RESPONSABILIDADES DA EQUIPE

### Rickelme

- Inicialização do projeto NestJS e configuração base
- Módulo prisma (PrismaService global)
- Módulo auth completo (login, JWT, estratégia, guards)
- Módulo usuarios completo (CRUD, hash de senha)
- common/guards/ (JwtAuthGuard, RolesGuard)
- common/decorators/ (Roles, CurrentUser)
- common/interceptors/ (LoggingInterceptor)
- common/filters/ (HttpExceptionFilter)
- common/pipes/ (ValidationPipe global)
- Configuração do .env, main.ts, app.module.ts
- Setup do Swagger/OpenAPI

### Mike

- Módulo criancas completo (CRUD, busca por nome e matrícula)
- Módulo responsaveis completo (CRUD)
- Módulo documentos (upload com Multer, vinculação à criança)
- Validação de CPF único
- Busca por nome ou número de matrícula

### Lucas

- Módulo frequencia (registro, histórico, correção)
- Módulo atividades (CRUD)
- Módulo eventos (CRUD)
- Módulo doacoes (CRUD)
- Módulo declaracoes (emissão restrita a Diretor, geração de PDF)
- Módulo relatorios (geração de PDFs com pdf-lib, armazenamento de path)
- Módulo auditoria (consulta de logs por usuário, data e período)

---

## 17. REQUISITOS FUNCIONAIS COMPLETOS

| # | Requisito | Módulo | Responsável |
|---|---|---|---|
| RF01 | Cadastro de usuários com nível de acesso | usuarios | Rickelme |
| RF02 | Autenticação via email e senha com JWT | auth | Rickelme |
| RF03 | Controle de acesso por nível (1, 2, 3) | common/guards | Rickelme |
| RF04 | Cadastro de crianças | criancas | Mike |
| RF05 | Cadastro de responsáveis | responsaveis | Mike |
| RF06 | Upload de documentos (foto, certidão, vacina) | documentos | Mike |
| RF07 | Busca de criança por nome ou matrícula | criancas | Mike |
| RF08 | Registro de frequência diária | frequencia | Lucas |
| RF09 | Histórico de frequência por criança | frequencia | Lucas |
| RF10 | Registro de atividades internas | atividades | Lucas |
| RF11 | Registro de eventos | eventos | Lucas |
| RF12 | Registro de doações | doacoes | Lucas |
| RF13 | Emissão de declarações (apenas Diretor) | declaracoes | Lucas |
| RF14 | Geração de relatórios em PDF | relatorios | Lucas |
| RF15 | Auditoria completa de ações | auditoria | Lucas |
| RF16 | Log automático de todas as operações de escrita | common/interceptors | Rickelme |

---

## 18. REQUISITOS NÃO FUNCIONAIS

| # | Requisito | Implementação |
|---|---|---|
| RNF01 | Segurança de senhas | bcrypt com salt rounds >= 10 |
| RNF02 | Autenticação stateless | JWT sem estado no servidor |
| RNF03 | Validação de entrada | class-validator com whitelist |
| RNF04 | Rastreabilidade | Log de todas as mutações |
| RNF05 | Escalabilidade | Arquitetura modular NestJS |
| RNF06 | Documentação da API | Swagger automático |
| RNF07 | Integridade de dados | Constraints no Prisma e banco |
| RNF08 | Unicidade de CPF e email | @unique no schema Prisma |
| RNF09 | Backup de dados | Neon realiza backup automático |
| RNF10 | Performance | Índices no banco, queries otimizadas |

---

## 19. CONVENÇÕES DE CÓDIGO

- Nomenclatura de arquivos: kebab-case (ex: create-crianca.dto.ts)
- Nomenclatura de classes: PascalCase (ex: CriancasService)
- Nomenclatura de variáveis e métodos: camelCase
- Nomes de tabelas no banco: snake_case em português (conforme o diagrama)
- DTOs sempre validados com class-validator
- Nunca retornar senha_hash nas respostas da API
- Todo Service deve lançar NotFoundException quando o recurso não existe
- Todo Service deve lançar ConflictException quando há violação de unicidade

---

## 20. COMANDOS ESSENCIAIS

```bash
npm install
npm run start:dev
npx prisma generate
npx prisma migrate dev --name nome_da_migracao
npx prisma studio
npm run test
npm run build
npm run start:prod
```

---

*Documento criado em 2026-03-24. Toda alteração estrutural deve ser refletida neste arquivo antes de ser implementada.*
