# CLAUDE.md — Documentação Global do Projeto ONG CAMM4

> Este arquivo é a fonte de verdade do projeto. Toda implementação deve seguir rigorosamente o que está definido aqui.

---

## 1. VISÃO GERAL DO SISTEMA

O sistema ONG CAMM4 — **Centro de Atendimento a Meninos e a Meninas** — é uma plataforma web destinada a digitalizar e profissionalizar a gestão interna da ONG. Substitui processos manuais em papel por um sistema digital com controle de acesso, auditoria e geração de relatórios.

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
| Voluntário | 1 | Cadastra/edita crianças e responsáveis, registra frequência e faz upload de documentos — sem acesso a usuários, relatórios ou logs |

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
| Upload | Multer | documentos (certidão, vacina) — foto da criança removida por limitação do disco efêmero |
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
| Estilo | CSS custom properties, sidebar e header em gradiente amarelo, layout responsivo |

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
Front-end/
├── Dockerfile              ← Nginx Alpine (serve estáticos + proxy reverso)
├── nginx.conf              ← Proxy /api/* e /uploads/* → backend:3000
└── files/
    ├── index.html              ← Login (split-screen) + CAPTCHA Turnstile + Termos
    ├── home.html               ← Página inicial (Nossa História, Missão, Valores)
    ├── dashboard.html          ← Dashboard com métricas, gráficos Chart.js e alertas
    ├── cadastros.html          ← Lista de crianças + botão Gerar PDF
    ├── cadastrar-crianca.html  ← Formulário de cadastro (sem foto, avatar com iniciais)
    ├── frequencia.html         ← Registro de frequência + botão Gerar PDF
    ├── historico-presenca.html ← Histórico individual com calendário
    ├── admin.html              ← Painel administrativo (cards)
    ├── admin-voluntarios.html  ← Lista de voluntários + modal editar/reset senha
    ├── admin-cadastrar-voluntario.html ← Cadastro de novo voluntário
    ├── admin-permissoes.html   ← Controle de acessos (select de nível por usuário)
    ├── admin-atividades.html   ← Registro de atividades
    ├── admin-doacoes.html      ← Registro de doações (modal)
    ├── styles.css              ← Estilos globais + glassmorphism dashboard
    ├── app.js                  ← Lógica JS + integração com API + Chart.js
    ├── assets/
    │   ├── logo-camm.png       ← Logo da ONG (PNG com fundo transparente)
    │   ├── favicon.ico         ← Favicon da logo CAMM
    │   └── home-banner.png     ← Banner da página Home (crianças CAMM)
    ├── package.json            ← Dependências Vercel (analytics/speed-insights)
    └── package-lock.json
```

### 3.3 Frontend — Fluxo de Navegação

```
index.html (Login)
    ↓ login bem-sucedido
home.html (Página Inicial)
    ↓
dashboard.html (Dashboard — métricas, gráficos, alertas)
    ↓
cadastros.html (Cadastros)
    ├── cadastrar-crianca.html
    ├── frequencia.html → historico-presenca.html?id=X
    └── admin.html
         ├── admin-voluntarios.html (modal: cadastro, edição, reset senha)
         ├── admin-permissoes.html
         ├── admin-atividades.html
         └── admin-doacoes.html (modal: nova doação)
```

---

## 4. ESTRATÉGIA DE AUTENTICAÇÃO (Access Token + Refresh Token)

### 4.1 Visão Geral

O sistema usa **dois tokens**:

| Token | Tipo | Duração | Armazenamento |
|---|---|---|---|
| **access_token** | JWT (HS256) | 1 hora | localStorage (`camm_token`) |
| **refresh_token** | String aleatória (128 hex) | 8 horas | localStorage (`camm_refresh`) + tabela `refresh_token` no banco |

### 4.2 Fluxo de Login

```
1. POST /auth/login { email, senha, turnstile_token }
2. Backend valida CAPTCHA Turnstile (se TURNSTILE_SECRET configurado — token obrigatório)
3. Backend valida credenciais (bcrypt.compare)
4. Gera access_token (JWT, 1h) + refresh_token (random, 8h)
5. Salva refresh_token na tabela refresh_token
6. Retorna { access_token, refresh_token, expires_in, usuario }
7. Frontend salva ambos no localStorage
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
- **Rate limiting**: `@nestjs/throttler` — 5 tentativas/min no login, 10/min no refresh, 30/min global
- **CORS seguro**: em produção bloqueia se `FRONTEND_URL` não definida; em dev libera tudo
- **Bcrypt**: salt rounds = 12 (padrão segurança 2026)
- **Login falho logado**: `Logger.warn` com email para auditoria de brute-force
- **CAPTCHA**: Cloudflare Turnstile validado no backend via `TURNSTILE_SECRET`. Quando o secret está configurado, o `turnstile_token` é **obrigatório** — omissão resulta em 401 (fecha bypass onde o cliente simplesmente não enviava o token).
- **_fetchWithRefresh**: toda requisição que retorna 401 tenta refresh automático; só redireciona para login se o servidor CONFIRMOU que o token expirou (não por erro de rede)

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
| Cadastrar/editar/excluir crianças | Sim | Sim | Sim |
| Registrar/visualizar frequência | Sim | Sim | Sim |
| Upload de documentos | Sim | Sim | Sim |
| Criar/editar/excluir usuários | Não | Sim | Sim |
| Gerar relatórios (PDF) | Não | Sim | Sim |
| Redefinir senha | Não | Não | Sim |
| Gerar declaração | Não | Não | Sim |
| Auditoria / Logs | Não | Não | Sim |
| Menu Administrativo visível | Não | Sim | Sim |

---

## 6. MODELAGEM DO BANCO DE DADOS

```prisma
model Usuario {
  id_usuario   Int     @id @default(autoincrement())
  nome         String
  email        String  @unique
  senha_hash   String
  nivel_acesso Int     @default(1)
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
  genero          String?
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
  turno         String?  // "Manhã" | "Tarde" | "Integral"
  observacao    String?  // Justificativa da falta
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
  valor       Decimal? @db.Decimal(10, 2)
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
  id_log      Int      @id @default(autoincrement())
  id_usuario  Int
  acao        String
  entidade    String?  // ex: "crianca", "usuario", "doacao"
  entidade_id Int?     // ID do registro afetado
  ip          String?  // IP do cliente
  data_hora   DateTime @default(now())
  usuario     Usuario  @relation(fields: [id_usuario], references: [id_usuario])
  @@index([id_usuario])
  @@index([data_hora])
  @@index([entidade])
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
| POST | /usuarios | Gestor (2) | Criar |
| PATCH | /usuarios/:id | Gestor (2) | Atualizar |
| PATCH | /usuarios/:id/reset-senha | Diretor (3) | Redefinir senha |
| DELETE | /usuarios/:id | Gestor (2) | Remover permanentemente |

### 7.3 Crianças

| Método | Rota | Acesso Mínimo | Descrição |
|---|---|---|---|
| GET | /criancas | Voluntário (1) | Lista todas |
| GET | /criancas/:id | Voluntário (1) | Por ID |
| POST | /criancas | Voluntário (1) | Cadastrar |
| PATCH | /criancas/:id | Voluntário (1) | Atualizar |
| DELETE | /criancas/:id | Voluntário (1) | Remover permanentemente |

### 7.4 Responsáveis

| Método | Rota | Acesso Mínimo | Descrição |
|---|---|---|---|
| GET | /responsaveis | Voluntário (1) | Lista todos |
| POST | /responsaveis | Voluntário (1) | Cadastrar |
| PATCH | /responsaveis/:id | Voluntário (1) | Atualizar |
| DELETE | /responsaveis/:id | Voluntário (1) | Remover |

### 7.5 Frequência

| Método | Rota | Acesso Mínimo | Descrição |
|---|---|---|---|
| GET | /frequencia | Voluntário (1) | Lista todos |
| GET | /frequencia/crianca/:id | Voluntário (1) | Histórico por criança |
| POST | /frequencia | Voluntário (1) | Registrar presença/ausência |
| PATCH | /frequencia/:id | Gestor (2) | Corrigir |
| DELETE | /frequencia/:id | Diretor (3) | Remover |

### 7.6 Relatórios (PDF)

| Método | Rota | Acesso Mínimo | Descrição |
|---|---|---|---|
| GET | /relatorios | Gestor (2) | Listar relatórios gerados |
| POST | /relatorios/criancas | Gestor (2) | Gerar PDF de crianças cadastradas |
| POST | /relatorios/frequencia | Gestor (2) | Gerar PDF de frequência |
| POST | /relatorios/doacoes | Gestor (2) | Gerar PDF de doações |
| POST | /relatorios/atividades | Gestor (2) | Gerar PDF de atividades |
| POST | /relatorios/auditoria | Diretor (3) | Gerar PDF de auditoria |
| GET | /relatorios/:id/download | Gestor (2) | Download do PDF gerado |

### 7.7 Dashboard

| Método | Rota | Acesso Mínimo | Descrição |
|---|---|---|---|
| GET | /dashboard/metrics | Voluntário (1) | Métricas agregadas (crianças, frequência, doações, logs, alertas) |

Retorna JSON com: `criancas_ativas` (total), `frequencia_hoje` (presentes/total/percentual), `doacoes_mes` (total/valor/quantidade), `voluntarios_ativos` (total), `frequencia_semanal` (7 dias), `doacoes_mensais` (6 meses), `logs_recentes` (10 últimos), `aniversariantes_semana`, `criancas_sem_frequencia` (14 dias).

### 7.8 Atividades, Eventos, Doações, Declarações, Auditoria

Seguem o mesmo padrão CRUD. Consultar Swagger em `/api/docs` para detalhes.

---

## 8. FRONTEND — INTEGRAÇÃO COM API

### 8.1 Configuração

```javascript
// Produção (Vercel): aponta para o Render
// Docker local (porta 80): usa proxy Nginx
// Dev local (Live Server): aponta direto para localhost:3000
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? (window.location.port === '' || window.location.port === '80'
      ? '/api/v1'
      : 'http://localhost:3000/api/v1')
  : 'https://ongcamm4-api.onrender.com/api/v1';
```

### 8.2 Objeto `api` (app.js)

Todas as chamadas HTTP passam por `_fetchWithRefresh()` que:
1. Faz a requisição com o access_token atual
2. Se receber 401, tenta `POST /auth/refresh` automaticamente
3. Se o refresh funcionar, refaz a requisição original
4. Se o refresh falhar, redireciona para login

A resposta é processada por `_parseOrThrow()`, que em caso de erro lê o body JSON da API e lança um `Error` enriquecido com `err.status` (status HTTP) e `err.apiMessage` (mensagem real do backend, ex: "CPF já cadastrado"). Os toasts de erro mostram essa mensagem em vez de um texto genérico, e os handlers podem ramificar pelo `err.status` (ex: 409 → reusar entidade existente).

### 8.3 Armazenamento Local

| Key | Conteúdo |
|---|---|
| `camm_token` | access_token JWT (1 hora) |
| `camm_refresh` | refresh_token (8 horas) |
| `camm_user` | JSON com { id, nome, email, nivel_acesso } |

### 8.4 Bibliotecas Externas

- **Lucide Icons** — `https://unpkg.com/lucide@latest` (carregado em todas as páginas)
- **Google Fonts** — Nunito + Nunito Sans
- **Chart.js** — `https://cdn.jsdelivr.net/npm/chart.js@4.4.7` (carregado apenas no dashboard)
- **Cloudflare Turnstile** — CAPTCHA na tela de login (site key no HTML, secret key no backend)

### 8.5 Design System

- **Logo**: `logo-camm.png` com fundo transparente, exibida na sidebar e na tela de login
- **Sidebar**: gradiente amarelo (#FFD45E → #FFBE4A → #FFA726), textos marrom (#5A3E0A), item ativo com fundo branco semi-transparente
- **Header**: gradiente amarelo (#FFD45E → #FFBE4A → #FFA726), títulos escuros (#3D2800)
- **Cores primárias**: amarelo (#FFD45E), laranja (#FFA726), coral (#F4845F)
- **Cores de apoio**: rosa (#F48FB1), verde (#66BB6A), azul (#42A5F5)
- **Fundo geral**: #F8F9FC (cinza claro neutro)
- **Datas**: inputs `type="date"` (calendário nativo do navegador), formato ISO (YYYY-MM-DD). Em campos como `data_nascimento` o atributo `max` é setado dinamicamente para ontem, com validação extra no submit.
- **Botões com loading**: classe `.btn.is-loading` exibe spinner girando, oculta o texto e bloqueia cliques. Usada em operações longas (cadastro de criança, etc.) para feedback enquanto o backend (Render free tier) responde.
- **Login**: inclui Cloudflare Turnstile CAPTCHA e link para Termos de Responsabilidade e Uso de Imagem
- **Formulários modais**: cadastro de voluntário e doação usam modais com overlay opaco (65%)
- **Relatórios PDF**: botão "Gerar PDF" em cadastros e frequência, gerados em memória (buffer) e retornados direto na response
- **Hard delete**: exclusão de usuários, crianças e doações remove permanentemente do banco de dados
- **Frequência**: inclui turno (Manhã/Tarde/Integral) e campo de justificativa de falta (observação)
- **Dashboard**: página com cards glassmorphism (crianças, frequência, doações, voluntários), gráficos Chart.js (frequência semanal barras, doações mensais linha), logs recentes, aniversariantes da semana e alertas de crianças sem frequência. Cards com animação de entrada escalonada e contagem animada. Logs visíveis apenas para gestores/diretores (nível >= 2).
- **Glassmorphism**: cards do dashboard usam `backdrop-filter: blur()`, bordas translúcidas, sombras coloridas por categoria
- **Chart.js**: CDN v4.4.7, carregado apenas no dashboard.html
- **Sidebar**: navegação inclui Home, Dashboard, Cadastros, Frequência e Administrativo
- **Visibilidade**: menu Administrativo oculto para voluntários (nível < 2)
- **Proteção XSS**: função `esc()` escapa dados do usuário em todos os templates HTML dinâmicos
- **Validação de formulários**: todos os campos obrigatórios são validados no frontend antes de enviar à API
- **Contadores dinâmicos**: tabelas mostram total de registros em vez de paginação estática

---

## 9. VARIÁVEIS DE AMBIENTE

```env
DATABASE_URL="postgresql://..."        # Neon pooler
DIRECT_URL="postgresql://..."          # Neon direto (migrations)
JWT_SECRET="string-aleatoria-64-chars" # HS256 secret
JWT_EXPIRATION="3600"                  # 1 hora (access_token)
PORT=3000
NODE_ENV=development                   # "production" no Render
FRONTEND_URL="https://..."             # URL do frontend (CORS) — só em produção
TURNSTILE_SECRET="..."                 # Cloudflare Turnstile secret key (CAPTCHA)
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE_MB=5
```

---

## 10. COMANDOS ESSENCIAIS

```bash
# ── Docker (modo principal) ──
docker compose up -d                    # sobe backend + frontend
docker compose down                     # para tudo
docker compose build --no-cache         # rebuild completo
docker compose logs -f                  # acompanhar logs

# Acesso via Docker:
# Frontend: http://localhost (porta 80, Nginx)
# Backend API: http://localhost/api/v1 (proxy Nginx)
# Swagger: http://localhost:3000/api/docs (direto no backend)

# ── Desenvolvimento local (sem Docker) ──
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

### 10.1 Indices e Performance

Indices foram adicionados nas tabelas mais consultadas:
- `usuario`: nome
- `responsavel`: nome
- `crianca`: nome, id_responsavel
- `frequencia`: id_matricula, data_registro
- `doacao`: data_doacao
- `refresh_token`: id_usuario, expires_at
- `log_sistema`: id_usuario, data_hora, entidade

### 10.2 Auditoria (LogSistema)

O `LoggingInterceptor` registra automaticamente toda operação de escrita (POST, PATCH, PUT, DELETE) com:
- `acao`: método HTTP + URL (ex: `POST /api/v1/criancas`)
- `entidade`: nome da entidade afetada (ex: `criancas`)
- `entidade_id`: ID do registro afetado (quando presente na URL)
- `ip`: endereço IP do cliente
- `data_hora`: timestamp automático

### 10.3 Segurança do Backend

- **Rate Limiting** (`@nestjs/throttler`): global 30 req/min, login 5/min, refresh 10/min
- **CORS**: `origin: false` em produção se `FRONTEND_URL` ausente (bloqueia tudo)
- **Hard Delete**: Usuario, Crianca e Doacao são removidos permanentemente do banco (sem soft delete)
- **Race Conditions**: `create()` usa try-catch no Prisma P2002/P2003 em vez de check-then-create
- **Validação de CPF**: MinLength(11) MaxLength(14) nos DTOs
- **Foreign Keys**: catch P2003 retorna NotFoundException com mensagem clara
- **Login falho**: Logger.warn registra email para detecção de brute-force
- **CAPTCHA obrigatório**: em produção (com `TURNSTILE_SECRET` configurado), o body do login deve incluir `turnstile_token` — ausência retorna 401 antes de qualquer consulta ao banco. Previne bypass trivial onde o cliente simplesmente omitia o campo opcional do DTO.
- **Bcrypt**: salt rounds = 12
- **XSS Frontend**: função `esc()` escapa &, <, >, ", ' em todos os templates dinâmicos (nomes, emails, doadores, títulos)
- **Validação Frontend**: campos obrigatórios validados antes de enviar à API (nome, CPF, data nascimento, telefone). Data de nascimento bloqueia hoje e datas futuras (atributo `max` + check no submit).
- **Toast**: todas as páginas usam `Toast.success()` / `Toast.error()` — sem funções indefinidas. Toasts de erro mostram a mensagem real da API via `err.apiMessage` (parsed em `_parseOrThrow`).
- **Cadastro de criança resiliente**: se POST `/responsaveis` retornar 409 (CPF já cadastrado), o frontend busca o responsável existente e reusa o `id_responsavel`.
- **Avatar com iniciais**: a tabela de cadastros exibe um círculo com as iniciais (primeiro + segundo nome) via helper `iniciais()` em `app.js`, com gradiente amarelo/laranja. O upload de foto da criança foi removido do frontend enquanto o projeto usa Render free tier (disco efêmero).

### 10.4 Observações do Build

- O `tsconfig.build.json` exclui `prisma.config.ts` para evitar que o TypeScript gere `dist/src/main.js` ao invés de `dist/main.js`
- O Dockerfile do backend usa multi-stage build (builder → production)
- O frontend usa Nginx Alpine com proxy reverso para `/api/` apontando para o container `backend:3000`

---

## 11. DEPLOY EM PRODUÇÃO

### 11.1 Arquitetura de Deploy

| Serviço | Plataforma | URL |
|---------|-----------|-----|
| Backend (API) | Render (Docker, Free) | https://ongcamm4-api.onrender.com |
| Frontend | Vercel (Static) | https://ongcamm4.vercel.app |
| Banco de dados | NeonTech (PostgreSQL) | Neon pooler (us-east-1) |

### 11.2 Backend — Render

- **Tipo**: Web Service (Docker)
- **Root Directory**: `Back-end`
- **Branch**: `main`
- **Auto-Deploy**: On Commit
- **Plano**: Free (512MB RAM, 0.1 CPU — dorme após inatividade)
- **CORS**: controlado pela variável `FRONTEND_URL` no `main.ts`

### 11.3 Variáveis de Ambiente no Render

Configuradas no painel do Render (Environment → Environment Variables):
`DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `JWT_EXPIRATION`, `NODE_ENV=production`, `PORT=3000`, `FRONTEND_URL`, `TURNSTILE_SECRET`, `UPLOAD_DIR`, `MAX_FILE_SIZE_MB`

> ⚠️ **Atenção com `TURNSTILE_SECRET`**: é opcional mas **recomendada em produção**. Uma vez configurada, **todos** os logins passam a exigir `turnstile_token` no body — ausência retorna 401 imediatamente (antes de qualquer consulta ao banco). Em dev, deixar ausente permite login sem CAPTCHA.

---

## 12. DIVISÃO DE RESPONSABILIDADES

### Back-end

#### Rickelme
- Inicialização do projeto, configuração base
- Módulos: prisma, auth, usuarios, criancas, responsaveis, documentos, common (guards, decorators, interceptors, filters)
- Validação de CPF, busca por nome/matrícula
- Setup do Swagger, .env, main.ts, app.module.ts

#### Lucas
- Módulos: frequencia, atividades, eventos, doacoes, declaracoes, relatorios, auditoria

### Front-end

#### Sergio
- Estrutura inicial do frontend (pasta `Front-end/files/`): HTML base, CSS base, layout geral

#### Rickelme
- Redesign completo da sidebar (cores, gradientes, logo, footer com avatar/logout)
- Integração total com a API (app.js): Auth, _fetchWithRefresh, refresh token, CORS
- Dashboard: página, gráficos Chart.js, glassmorphism, animações, endpoint backend
- Segurança frontend: função `esc()` (XSS), validações, CAPTCHA Turnstile
- Correções de bugs (11+ itens reportados da ONG): modais, permissões, PDF em memória, session handling
- Funcionalidades adicionadas: gênero, turno/justificativa na frequência, matrícula aleatória, upload de documentos (certidão, vacina), avatar com iniciais, contadores dinâmicos, histórico de presença com calendário
- Refatoração mobile completa: page-header responsivo, touch targets 44px, anti-zoom iOS, modais com `100dvh`
- Testes automatizados: 113 testes em 17 suites (Jest + jest-mock-extended) cobrindo services, guards, interceptors e geração de PDF
- Páginas novas/reescritas: home.html, dashboard.html, admin-permissoes.html
- Deploy: configuração Vercel + Render + Docker, Speed Insights/Analytics
- Documentação: CLAUDE.md, README.md, PROFILE-README.md

---

## 13. DASHBOARD

### 13.1 Visão Geral

O Dashboard é a página central de métricas do sistema. Acessível por todos os usuários autenticados, exibe dados agregados em tempo real via endpoint `GET /dashboard/metrics`.

### 13.2 Componentes

| Componente | Descrição | Permissão |
|---|---|---|
| Cards de Resumo | 4 cards glassmorphism: Crianças Cadastradas (total após hard delete), Frequência Hoje (%), Doações do Mês, Voluntários Cadastrados | Todos |
| Gráfico Frequência | Barras (Chart.js) — presentes vs ausentes nos últimos 7 dias | Todos |
| Gráfico Doações | Linha (Chart.js) — valor de doações nos últimos 6 meses | Todos |
| Atividade Recente | Últimos 10 registros do LogSistema com tempo relativo | Gestor+ (nível >= 2) |
| Aniversariantes | Crianças com aniversário nos próximos 7 dias | Todos |
| Alertas Frequência | Crianças sem registro de frequência há 14+ dias | Todos |

### 13.3 Visual

- **Glassmorphism**: `backdrop-filter: blur(16px)`, bordas semi-transparentes, sombras coloridas por categoria (coral, verde, azul, laranja)
- **Animações**: entrada escalonada dos cards (`dashCardIn`), contagem animada dos números (`animateCounter`), fade slide dos logs (`fadeSlideUp`)
- **Chart.js**: CDN v4.4.7, gráficos responsivos com `maintainAspectRatio: false`
- **Responsivo**: 4 cols → 2 cols → 1 col; gráficos e alertas empilham em mobile

### 13.4 Backend

- **Módulo**: `DashboardModule` (controller + service)
- **Endpoint**: `GET /dashboard/metrics` — retorna todas as métricas em uma única chamada
- **Queries**: usa Prisma `count`, `findMany` com `.select()` para retornar apenas campos necessários, e `$queryRawUnsafe` para consultas agregadas otimizadas
- **Performance**: todas as 10 queries são executadas em paralelo via `Promise.all`; eliminado problema N+1 na busca de crianças sem frequência via raw SQL com `GROUP BY`

### 13.5 Tempo Relativo nos Logs

A função `_tempoRelativo()` no frontend exibe timestamps com precisão:
- `< 1min` → "agora"
- `< 1h` → "ha Xmin"
- `< 24h` → "XhYmin (HH:MM)"
- `>= 24h` → "DD/MM HH:MM"

---

## 14. SKILLS DO CLAUDE CODE

O projeto inclui 10 skills em `.claude/skills/`, organizadas por tipo:

**Invocáveis pelo usuário (automáticas):**
- `code-review` — revisão geral; delega para `security-audit` e indica `api-review` para endpoints
- `test-review` — gaps de cobertura e qualidade dos testes
- `refactor` — sugere refatorações; exige testes como pré-requisito
- `api-review` — design, contratos e segurança de endpoints REST

**Invocáveis pelo usuário (manuais):**
- `commit-review` — revisão de mensagem e escopo antes do commit
- `pr-description` — gera descrição completa de Pull Request
- `changelog-update` — atualiza CHANGELOG.md (com fallback para projetos sem tags)
- `deploy-check` — checklist pré-deploy; executa `env-check` automaticamente

**Internas (chamadas por outras skills):**
- `env-check` — verifica variáveis de ambiente
- `security-audit` — auditoria de segurança OWASP

Veja `.claude/skills-setup-prompt.md` para o mapa de composição entre elas.

**Configurações de segurança do Claude Code:**

O arquivo `.claude/settings.json` (commitado no repo) bloqueia leitura/edição de arquivos `.env*` pelo Claude Code via regras `deny`:
- `Read(.env*)` / `Read(**/.env*)` — bloqueia leitura em qualquer pasta
- `Edit(.env*)` / `Edit(**/.env*)` — idem para edição
- `Bash(cat|head|tail|less|more|grep|type *.env*)` — bloqueia inspeção via shell

Protege `DATABASE_URL`, `JWT_SECRET`, `TURNSTILE_SECRET` e outras credenciais contra exposição acidental. Configurações locais (e permissões `allow` por máquina) ficam em `.claude/settings.local.json` (gitignored).

---

## 15. ATUALIZAÇÕES FUTURAS

Melhorias planejadas para evolução do projeto após a entrega atual.

### 15.1 Migração do Frontend para Vue.js + PrimeVue

**Stack proposta:**
- Vue 3 (Composition API)
- Vite (build tooling)
- Vue Router (navegação SPA)
- Pinia (gerenciamento de estado / auth)
- PrimeVue (biblioteca de UI)
- Chart.js + vue-chartjs (gráficos reativos)

**Benefícios:**
- Componentes reutilizáveis (sidebar, header, modais, tabelas feitos uma vez)
- Reatividade automática (sem manipulação DOM manual)
- Roteamento SPA (navegação sem reload de página)
- Componentes PrimeVue prontos (DataTable com filtro/ordenação/paginação, Dialog, Forms)
- Build otimizado com tree-shaking e code-splitting

**Plano de migração:**
1. Setup Vite + Vue, migrar layout (sidebar/header) para componentes
2. Migrar páginas mais simples (admin, cadastros)
3. Migrar dashboard (integrar Chart.js com vue-chartjs)
4. Migrar auth e lógica do `_fetchWithRefresh` para Pinia

### 15.2 Paginação no Backend

Endpoints que retornam datasets completos (`findAll`) devem implementar paginação com `skip` e `take`:
- `GET /criancas` — retorna todas as crianças
- `GET /frequencia` — retorna todos os registros
- `GET /auditoria/logs` — retorna todos os logs
- Relatórios PDF — queries sem limite

### 15.3 Testes Automatizados

**Status atual**: 113 testes em 17 suites — `npm test` passa 100% verde.

**Stack em uso**:
- **Jest + ts-jest** (padrão NestJS, já configurado)
- **jest-mock-extended** para mockar `PrismaClient` (dev dependency)
- Helper `src/test-utils/prisma-mock.ts` expõe `createPrismaMock()` tipado como `any` — Prisma 6+ tem types circulares que travam inferência do TS em testes

**Cobertura atual (services + infra transversal)**:
- `AuthService` — 13 testes (login, refresh, logout, me, CAPTCHA obrigatório quando secret set)
- `UsuariosService` — 13 testes (bcrypt rounds=12, P2002, reset-senha)
- `CriancasService` — 14 testes (matrícula retry 50x, P2002, P2003)
- `ResponsaveisService` — 9 testes
- `FrequenciaService` — 10 testes (turno, observacao, data range)
- `DoacoesService` + `AtividadesService` + `EventosService` — 17 testes
- `DeclaracoesService` — 4 testes (inclui validação de bytes `%PDF` no buffer)
- `RelatoriosService` — 5 testes (PDFs gerados em memória)
- `DashboardService` — 5 testes (zero-state, aniversariantes, frequência hoje)
- `AuthController` + `JwtStrategy` — 7 testes
- `JwtAuthGuard` + `RolesGuard` — 8 testes
- `LoggingInterceptor` + `HttpExceptionFilter` — 8 testes

**Próximos passos** (débito técnico):
- Testes E2E com Supertest (fluxo completo HTTP → auth → CRUD)
- Controllers dos módulos restantes (hoje cobertos indiretamente pelos testes de service)
- DTOs (validação class-validator)

**Comando**: `cd Back-end && npm test` (ou `npm run test:cov` para cobertura).

### 15.4 Armazenamento Externo de Arquivos

O Render (free tier) usa disco efêmero — uploads de fotos e documentos são perdidos a cada redeploy. Por isso o upload de foto da criança foi removido do cadastro (substituído por avatar com iniciais) e o upload de documentos continua no backend mas deve ser migrado. Para persistir arquivos em produção, migrar o upload para um serviço externo:

**Opções recomendadas:**
- **Cloudinary** — plano free com 25GB, SDK Node.js, transformações de imagem automáticas
- **AWS S3** — custo baixo, SDK `@aws-sdk/client-s3`, integração com Multer via `multer-s3`
- **Supabase Storage** — gratuito até 1GB, API REST compatível com S3

**Plano de migração:**
1. Criar conta no serviço escolhido e configurar bucket/pasta
2. Substituir `multer diskStorage` por upload direto ao serviço (ex: `multer-s3` ou Cloudinary SDK)
3. Salvar URL pública no campo `foto_path` (em vez de caminho local)
4. Remover `useStaticAssets` do `main.ts` e proxy `/uploads/` do Nginx
5. Atualizar variáveis de ambiente no Render
6. Reabilitar o upload de foto no formulário de cadastro de criança

### 15.5 Domínio Próprio

Registro de domínio `.org.br` via registro.br com o CNPJ da ONG. Após registro:
- Configurar DNS no Vercel (frontend) e Render (backend)
- Atualizar `FRONTEND_URL` no Render
- Atualizar CORS e CAPTCHA para o novo domínio

---

*Última revisão: 2026-04-12 (inclui hard delete, CAPTCHA obrigatório, 113 testes automatizados, refatoração mobile). Toda alteração estrutural deve ser refletida aqui antes de ser implementada.*
