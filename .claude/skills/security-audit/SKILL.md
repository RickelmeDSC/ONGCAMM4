---
name: security-audit
description: Auditoria de segurança focada em vulnerabilidades comuns para projetos Node.js full-stack. Não aparece no menu — chamada internamente por code-review em arquivos críticos.
disable-model-invocation: true
user-invocable: false
---

# Skill: Security Audit

## Objetivo
Identificar vulnerabilidades de segurança comuns em projetos Node.js com back-end e front-end separados, antes que cheguem à produção.

## Quando é chamada
- Internamente pelo `code-review` quando analisa arquivos de autenticação, rotas de API, ou configuração
- Diretamente pelo usuário quando quiser uma auditoria completa

## Categorias de análise

### Autenticação e autorização
- JWT com algoritmo fraco (ex: `alg: none`, HS256 com secret fraco)?
- Tokens sem expiração definida?
- Refresh tokens armazenados de forma insegura (localStorage em vez de httpOnly cookie)?
- Rotas protegidas sem verificação de role/permission?
- Ausência de rate limiting em endpoints de login?

### Injeção
- SQL injection: queries construídas com concatenação de string?
- NoSQL injection: inputs não sanitizados em queries MongoDB?
- Command injection: uso de `exec()` ou `spawn()` com input do usuário?
- XSS: dados do usuário renderizados sem escape no front-end?

### Exposição de dados
- Respostas de API retornando campos desnecessários (senhas, hashes, dados internos)?
- Erros expondo stack trace em produção?
- Logs registrando dados sensíveis?
- Headers HTTP expondo informações da stack (`X-Powered-By`, versões)?

### Configuração
- CORS configurado com `origin: *` em produção?
- HTTPS não forçado?
- Dependências com vulnerabilidades conhecidas (`npm audit`)?
- Helmet.js ou equivalente configurado?

### Upload e arquivos
- Validação de tipo de arquivo apenas pelo mime-type do cliente (bypassável)?
- Sem limite de tamanho de upload?
- Arquivos salvos com nome original do usuário (path traversal)?

## Severidade
- 🔴 **Crítico** — exploração direta, dado sensível exposto, autenticação quebrada
- 🟠 **Alto** — requer encadeamento mas tem impacto real
- 🟡 **Médio** — configuração ruim, boas práticas violadas
- 🔵 **Informativo** — sugestão de hardening

## Formato de saída
```
SECURITY AUDIT
==============
🔴 CRÍTICO: Token JWT sem expiração — src/middleware/auth.js:23
🟠 ALTO: CORS com origin: * — src/config/cors.js:8
🟡 MÉDIO: X-Powered-By header exposto — adicionar helmet()
🔵 INFO: Considerar CSP headers no vercel.json
```

## Observações
- Não corrija automaticamente — liste e explique, decisão é do usuário
- Para cada item crítico, inclua um exemplo de como corrigir
- Verificar `npm audit` e listar dependências vulneráveis se o `package.json` estiver disponível
