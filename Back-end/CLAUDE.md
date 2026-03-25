# CLAUDE.md — Documentação Global do Projeto ONG CAMM4

> Este arquivo é a fonte de verdade do projeto. Toda implementação deve seguir rigorosamente o que está definido aqui.

---

## 1. VISÃO GERAL DO SISTEMA

O sistema ONG CAMM4 é uma plataforma web destinada a digitalizar e profissionalizar a gestão interna de uma organização não governamental. Substitui processos manuais em papel por um sistema digital com controle de acesso, auditoria e geração de relatórios.

### 1.1 Objetivos Principais

- Substituir o controle manual por um sistema digital centralizado
- Garantir segurança no acesso e manipulação de dados
- Permitir rastreabilidade completa de todas as ações do sistema
- Facilitar a geração de documentos oficiais e relatórios de auditoria

### 1.2 Perfis de Acesso

| Perfil | Nível | Descrição |
|---|---|---|
| Diretor | 3 | Acesso irrestrito a todas as funcionalidades |
| Gestor | 2 | Gerenciamento geral com restrições em operações críticas |
| Voluntário | 1 | Acesso somente leitura e operações básicas |

---

## 2. STACK TECNOLÓGICA

### 2.1 Backend

| Camada | Tecnologia | Versão |
|---|---|---|
| Runtime | Node.js | >= 20 LTS |
| Framework | NestJS | >= 10 |
| Linguagem | TypeScript | >= 5 |
| ORM | Prisma | 6.19+ |
| Banco de Dados | PostgreSQL | Neon (serverless) |
| Autenticação | JWT (access) + Refresh Token (banco) | passport-jwt + bcryptjs |
| Upload | Multer | salva caminho no banco |
| PDF | pdf-lib | >= 1.17 |
| Validação | class-validator + class-transformer | >= 0.14 |
| Documentação | Swagger (OpenAPI) | @nestjs/swagger |

### 2.2 Frontend

| Camada | Tecnologia |
|---|---|
| Linguagem | HTML5 + CSS3 + JavaScript (vanilla) |
| Ícones | Lucide Icons (CDN) |
| Fontes | Nunito + Nunito Sans (Google Fonts) |
| Servidor local | Live Server (VSCode) ou npx serve |
| Estilo | CSS custom properties, sidebar escura, layout responsivo |

---

## 3. ARQUITETURA

### 3.1 Backend — Padrão de Camadas

```
Request HTTP
    ↓
[ Guard: JwtAuthGuard ]         ← verifica access_token JWT
    ↓
[ Guard: RolesGuard ]           ← verifica nível de acesso
    ↓
[ Controller ]                  ← recebe e valida DTOs
    ↓
[ Service ]                     ← lógica de negócio
    ↓
[ Prisma Client ]               ← acesso ao PostgreSQL (Neon)
    ↓
[ LoggingInterceptor ]          ← registra ação no LOG_SISTEMA
```

### 3.2 Frontend — Estrutura de Arquivos

```
Front-end/files/
├── index.html              ← Login (split-screen)
├── cadastros.html          ← Lista de crianças (página principal)
├── cadastrar-crianca.html  ← Formulário de cadastro
├── frequencia.html         ← Registro de frequência diária
├── historico-presenca.html ← Histórico individual com calendário
├── admin.html              ← Painel administrativo (cards)
├── admin-voluntarios.html  ← Lista de voluntários
├── admin-cadastrar-voluntario.html ← Cadastro de voluntário
├── admin-permissoes.html   ← Permissões por nível
├── admin-atividades.html   ← Registro de atividades
├── admin-doacoes.html      ← Registro de doações
├── styles.css              ← Estilos globais
└── app.js                  ← Lógica JS + integração com API
```

### 3.3 Frontend — Fluxo de Navegação

```
index.html (Login)
    ↓ login bem-sucedido
cadastros.html (Home)
    ├── cadastrar-crianca.html
    ├── frequencia.html → historico-presenca.html?id=X
    └── admin.html
         ├── admin-voluntarios.html
         ├── admin-cadastrar-voluntario.html
         ├── admin-permissoes.html
         ├── admin-atividades.html
         └── admin-doacoes.html
```

---

## 4. ESTRATÉGIA DE AUTENTICAÇÃO (Access Token + Refresh Token)

### 4.1 Visão Geral

O sistema usa **dois tokens**:

| Token | Tipo | Duração | Armazenamento |
|---|---|---|---|
| **access_token** | JWT (HS256) | 1 hora | localStorage (`camm_token`) |
| **refresh_token** | String aleatória (128 hex) | 30 dias | localStorage (`camm_refresh`) + tabela `refresh_token` no banco |

### 4.2 Fluxo de Login

```
1. POST /auth/login { email, senha }
2. Backend valida credenciais (bcrypt.compare)
3. Gera access_token (JWT, 1h) + refresh_token (random, 30 dias)
4. Salva refresh_token na tabela refresh_token
5. Retorna { access_token, refresh_token, expires_in, usuario }
6. Frontend salva ambos no localStorage
```

### 4.3 Fluxo de Renovação Automática

```
1. Frontend faz requisição → recebe 401
2. _fetchWithRefresh() detecta o 401
3. Chama POST /auth/refresh { refresh_token }
4. Backend valida refresh_token no banco
5. Deleta o refresh_token usado (rotação de token)
6. Gera NOVOS access_token + refresh_token
7. Frontend salva os novos tokens
8. Refaz a requisição original com o novo access_token
9. Se o refresh falhar → redireciona para login
```

### 4.4 Fluxo de Logout

```
1. Frontend chama POST /auth/logout { refresh_token }
2. Backend deleta o refresh_token do banco
3. Frontend limpa localStorage (camm_token, camm_refresh, camm_user)
4. Redireciona para index.html
```

### 4.5 Segurança

- **Rotação de token**: cada refresh gera um novo refresh_token e invalida o anterior
- **Limpeza automática**: tokens expirados são removidos do banco a cada login
- **Proteção contra replay**: refresh_token só pode ser usado uma vez
- **Cascade delete**: ao deletar um usuário, todos os refresh_tokens são removidos

### 4.6 Endpoints de Auth

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| POST | /auth/login | Público | Login → retorna access_token + refresh_token |
| POST | /auth/refresh | Público | Renova tokens usando refresh_token |
| POST | /auth/logout | Autenticado | Invalida refresh_token |
| GET | /auth/me | Autenticado | Retorna dados do usuário logado |

### 4.7 Estrutura do JWT Payload

```json
{
  "sub": 1,
  "nome": "Rickelme Silva",
  "nivel_acesso": 3,
  "iat": 1711234567,
  "exp": 1711238167
}
```

### 4.8 Tabela refresh_token (Prisma)

```prisma
model RefreshToken {
  id         Int      @id @default(autoincrement())
  token      String   @unique
  id_usuario Int
  expires_at DateTime
  created_at DateTime @default(now())
  usuario    Usuario  @relation(fields: [id_usuario], references: [id_usuario], onDelete: Cascade)
  @@map("refresh_token")
}
```

---

## 5. ESTRATÉGIA DE AUTORIZAÇÃO

### 5.1 Guards Globais

```typescript
providers: [
  { provide: APP_GUARD, useClass: JwtAuthGuard },
  { provide: APP_GUARD, useClass: RolesGuard },
]
```

### 5.2 Tabela de Permissões

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

## 6. MODELAGEM DO BANCO DE DADOS

```prisma
model Usuario {
  id_usuario   Int    @id @default(autoincrement())
  nome         String
  email        String @unique
  senha_hash   String
  nivel_acesso Int    @default(1)
  logs           LogSistema[]
  eventos        Evento[]
  atividades     Atividade[]
  declaracoes    Declaracao[]
  refreshTokens  RefreshToken[]
  @@map("usuario")
}

model Responsavel {
  id_responsavel Int    @id @default(autoincrement())
  nome           String
  cpf            String @unique
  contato        String
  endereco       String
  criancas       Crianca[]
  @@map("responsavel")
}

model Crianca {
  id_matricula    Int      @id @default(autoincrement())
  nome            String
  data_nascimento DateTime
  cpf             String   @unique
  foto_path       String?
  certidao_nasc   String?
  cartao_vacina   String?
  data_entrada    DateTime @default(now())
  id_responsavel  Int
  responsavel     Responsavel  @relation(fields: [id_responsavel], references: [id_responsavel])
  frequencias     Frequencia[]
  declaracoes     Declaracao[]
  @@map("crianca")
}

model Frequencia {
  id_frequencia Int      @id @default(autoincrement())
  id_matricula  Int
  data_registro DateTime @default(now())
  status        String
  crianca       Crianca  @relation(fields: [id_matricula], references: [id_matricula])
  @@map("frequencia")
}

model Atividade {
  id_atividade    Int      @id @default(autoincrement())
  titulo          String
  data_realizacao DateTime
  id_usuario_resp Int
  responsavel     Usuario  @relation(fields: [id_usuario_resp], references: [id_usuario])
  @@map("atividade")
}

model Evento {
  id_evento       Int      @id @default(autoincrement())
  nome_evento     String
  local           String
  data_realizacao DateTime
  id_usuario_resp Int
  responsavel     Usuario  @relation(fields: [id_usuario_resp], references: [id_usuario])
  @@map("evento")
}

model Doacao {
  id_doacao   Int      @id @default(autoincrement())
  doador      String
  tipo        String
  valor       Decimal  @db.Decimal(10, 2)
  data_doacao DateTime @default(now())
  @@map("doacao")
}

model Declaracao {
  id_declaracao          Int      @id @default(autoincrement())
  id_matricula           Int
  id_usuario_autorizador Int
  nome_parente           String
  parentesco             String
  data_emissao           DateTime @default(now())
  crianca     Crianca @relation(fields: [id_matricula], references: [id_matricula])
  autorizador Usuario @relation(fields: [id_usuario_autorizador], references: [id_usuario])
  @@map("declaracao")
}

model RefreshToken {
  id         Int      @id @default(autoincrement())
  token      String   @unique
  id_usuario Int
  expires_at DateTime
  created_at DateTime @default(now())
  usuario    Usuario  @relation(fields: [id_usuario], references: [id_usuario], onDelete: Cascade)
  @@map("refresh_token")
}

model RelatorioAuditoria {
  id_relatorio Int      @id @default(autoincrement())
  tipo_periodo String
  data_geracao DateTime @default(now())
  path_arquivo String
  @@map("relatorio_auditoria")
}

model LogSistema {
  id_log     Int      @id @default(autoincrement())
  id_usuario Int
  acao       String
  data_hora  DateTime @default(now())
  usuario    Usuario  @relation(fields: [id_usuario], references: [id_usuario])
  @@map("log_sistema")
}
```

---

## 7. ENDPOINTS DA API

Prefixo global: `/api/v1`. Todos (exceto login e refresh) exigem `Authorization: Bearer <access_token>`.

### 7.1 Auth

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| POST | /auth/login | Público | Login → access_token + refresh_token |
| POST | /auth/refresh | Público | Renovar tokens |
| POST | /auth/logout | Autenticado | Invalidar refresh_token |
| GET | /auth/me | Autenticado | Dados do usuário logado |

### 7.2 Usuários

| Método | Rota | Acesso Mínimo | Descrição |
|---|---|---|---|
| GET | /usuarios | Gestor (2) | Lista todos |
| GET | /usuarios/:id | Gestor (2) | Por ID |
| POST | /usuarios | Diretor (3) | Criar |
| PATCH | /usuarios/:id | Diretor (3) | Atualizar |
| DELETE | /usuarios/:id | Diretor (3) | Remover |

### 7.3 Crianças

| Método | Rota | Acesso Mínimo | Descrição |
|---|---|---|---|
| GET | /criancas | Voluntário (1) | Lista todas |
| GET | /criancas/:id | Voluntário (1) | Por ID |
| POST | /criancas | Gestor (2) | Cadastrar |
| PATCH | /criancas/:id | Gestor (2) | Atualizar |
| DELETE | /criancas/:id | Diretor (3) | Remover |

### 7.4 Responsáveis

| Método | Rota | Acesso Mínimo | Descrição |
|---|---|---|---|
| GET | /responsaveis | Voluntário (1) | Lista todos |
| POST | /responsaveis | Gestor (2) | Cadastrar |
| PATCH | /responsaveis/:id | Gestor (2) | Atualizar |
| DELETE | /responsaveis/:id | Diretor (3) | Remover |

### 7.5 Frequência

| Método | Rota | Acesso Mínimo | Descrição |
|---|---|---|---|
| GET | /frequencia | Voluntário (1) | Lista todos |
| GET | /frequencia/crianca/:id | Voluntário (1) | Histórico por criança |
| POST | /frequencia | Voluntário (1) | Registrar presença/ausência |
| PATCH | /frequencia/:id | Gestor (2) | Corrigir |
| DELETE | /frequencia/:id | Diretor (3) | Remover |

### 7.6 Atividades, Eventos, Doações, Declarações, Relatórios, Auditoria

Seguem o mesmo padrão CRUD. Consultar Swagger em `/api/docs` para detalhes.

---

## 8. FRONTEND — INTEGRAÇÃO COM API

### 8.1 Configuração

```javascript
const API_BASE_URL = 'http://localhost:3000/api/v1';
```

### 8.2 Objeto `api` (app.js)

Todas as chamadas HTTP passam por `_fetchWithRefresh()` que:
1. Faz a requisição com o access_token atual
2. Se receber 401, tenta `POST /auth/refresh` automaticamente
3. Se o refresh funcionar, refaz a requisição original
4. Se o refresh falhar, redireciona para login

### 8.3 Armazenamento Local

| Key | Conteúdo |
|---|---|
| `camm_token` | access_token JWT (1 hora) |
| `camm_refresh` | refresh_token (30 dias) |
| `camm_user` | JSON com { id, nome, email, nivel_acesso } |

### 8.4 Bibliotecas Externas

- **Lucide Icons** — `https://unpkg.com/lucide@latest` (carregado em todas as páginas)
- **Google Fonts** — Nunito + Nunito Sans

### 8.5 Design System

- **Sidebar**: tema escuro (#1a1a2e), itens com ícones Lucide
- **Header**: gradiente escuro, título branco
- **Cores**: amarelo (#FFD45E) como primária, laranja (#e8872a) como acento
- **Datas**: formato DD/MM/AAAA com máscara, convertidas para ISO antes de enviar à API

---

## 9. VARIÁVEIS DE AMBIENTE

```env
DATABASE_URL="postgresql://..."        # Neon pooler
DIRECT_URL="postgresql://..."          # Neon direto (migrations)
JWT_SECRET="string-aleatoria-64-chars" # HS256 secret
JWT_EXPIRATION="3600"                  # 1 hora (access_token)
PORT=3000
NODE_ENV=development
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE_MB=5
```

---

## 10. COMANDOS ESSENCIAIS

```bash
# Backend
cd Back-end
npm install
npm run start:dev          # inicia em modo desenvolvimento
npx prisma generate        # regenera Prisma Client
npx prisma migrate dev     # aplica migrations
npx prisma studio          # interface visual do banco

# Frontend
cd Front-end/files
# Abrir index.html com Live Server (VSCode) ou:
npx serve .
```

---

## 11. DIVISÃO DE RESPONSABILIDADES

### Rickelme
- Inicialização do projeto, configuração base
- Módulos: prisma, auth, usuarios, common (guards, decorators, interceptors, filters)
- Setup do Swagger, .env, main.ts, app.module.ts

### Mike
- Módulos: criancas, responsaveis, documentos
- Validação de CPF, busca por nome/matrícula

### Lucas
- Módulos: frequencia, atividades, eventos, doacoes, declaracoes, relatorios, auditoria

---

*Documento atualizado em 2026-03-25. Toda alteração estrutural deve ser refletida aqui antes de ser implementada.*
