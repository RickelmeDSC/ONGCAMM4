# 🏢 ONGCAMM4 — Sistema de Gestão para ONG

> Plataforma completa para digitalização e gestão operacional de uma ONG  
> Foco em **controle, rastreabilidade, segurança e eficiência**

---

## 📌 Visão Geral

O **ONGCAMM4** foi desenvolvido para substituir processos manuais (papel) por um sistema digital estruturado, garantindo:

- Centralização de dados
- Controle de acesso por nível (RBAC)
- Auditoria completa de ações
- Geração de relatórios em PDF
- Escalabilidade e organização

> Projeto com aplicação real, orientado a regras de negócio e arquitetura backend moderna.

---

## 🧠 Problema Resolvido

**Antes**
- Controle manual de presença
- Documentos físicos
- Falta de rastreabilidade
- Risco de perda de dados

**Depois**
- Sistema centralizado e auditável
- Histórico completo de ações
- Automação de relatórios
- Segurança e controle de acesso

---

## ⚙️ Stack Tecnológica

**Backend**
- NestJS (Node.js + TypeScript)
- Prisma ORM
- PostgreSQL (Neon)
- Autenticação: JWT + Refresh Token (rotação)
- Validação: class-validator
- Upload: Multer (armazena path)
- PDF: pdf-lib

**Frontend**
- HTML + CSS + JavaScript (vanilla)
- Integração via fetch com refresh automático

**Infra**
- Docker + Docker Compose
- Nginx (proxy reverso)
- Deploy: Render (API) + Vercel (Frontend) + Neon (DB)

---

## 🧩 Arquitetura — Pipeline de Requisição

```mermaid
flowchart TD
    A[Client / Frontend] --> B[API NestJS]
    B --> C[JWT Auth Guard]
    C --> D[Roles Guard (RBAC)]
    D --> E[Controller]
    E --> F[Service]
    F --> G[Prisma ORM]
    G --> H[(PostgreSQL - Neon)]
    F --> I[Logging Interceptor]
    I --> J[(LOG_SISTEMA)]

🔐 Autenticação e Autorização
Fluxo de Login e Renovação

<img width="1459" height="1474" alt="mermaid-diagram" src="https://github.com/user-attachments/assets/8c20e93f-8c3a-4fbe-9b9b-40b5ca079098" />

🗄️ Modelagem de Dados (Visão)

<img width="2971" height="1207" alt="mermaid-diagram (1)" src="https://github.com/user-attachments/assets/ea1b32a4-d46e-4117-8ce4-4d3c28efe6ad" />

Entidades principais

Usuario, Crianca, Responsavel
Frequencia, Atividade, Evento
Doacao, Declaracao
RelatorioAuditoria, LogSistema, RefreshToken
📊 Funcionalidades
👶 Gestão de Crianças
Cadastro completo
Upload de documentos (path)
Vínculo obrigatório com responsável
👨‍👩‍👧 Responsáveis
Cadastro e associação
CPF único
📅 Frequência
Registro Presente/Ausente
Histórico por criança
Correções controladas
🎯 Atividades e Eventos
Registro com responsável
Histórico organizacional
💰 Doações
Registro financeiro estruturado
📄 Declarações
Geração restrita ao Diretor
Registro de parentesco e autorização
📑 Relatórios (PDF)
Crianças, Frequência, Doações, Atividades, Auditoria
Download por endpoint
🧾 Auditoria
Log automático de ações
Rastreabilidade por usuário e entidade
🌐 API

Prefixo: /api/v1

Auth
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET /auth/me
Recursos
/usuarios
/criancas
/responsaveis
/frequencia
/relatorios

Swagger
/api/docs

🖥️ Frontend
Interface responsiva (vanilla)
Controle automático de refresh (retry com 401)
Organização por páginas (cadastros, frequência, admin)

🐳 Execução com Docker
docker compose up -d

Acessos:
Frontend: http://localhost
API (via proxy): http://localhost/api/v1
Swagger (direto): http://localhost:3000/api/docs



---

## 🧪 Execução Local

```bash
cd Back-end
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev

| Camada   | Serviço |
| -------- | ------- |
| Backend  | Render  |
| Frontend | Vercel  |
| Banco    | Neon    |


📈 Diferenciais Técnicos
Arquitetura modular (NestJS)
RBAC com Guards globais
Autenticação robusta (JWT + Refresh Token com rotação)
Auditoria via interceptor
Banco serverless (Neon)
Separação clara: Controller / Service / ORM
🧭 Roadmap (curto prazo)
Paginação e filtros avançados
Índices e otimizações de query
Endpoints de busca (ILIKE)
Hardenização de upload (naming + isolamento)
Expansão de auditoria (payload JSON)
👨‍💻 Autor

Rickelme David
📍 Olinda - PE, Brasil

GitHub: https://github.com/RickelmeDSC
LinkedIn: https://www.linkedin.com/in/rickelme-david-75630b203/



    
