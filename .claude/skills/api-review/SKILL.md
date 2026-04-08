---
name: api-review
description: Revisão de design e implementação de endpoints de API REST. Cobre contratos, status codes, segurança e consistência. Roda no contexto principal da sessão.
disable-model-invocation: false
user-invocable: true
---

# Skill: API Review

## Objetivo
Revisar endpoints de API REST verificando design, segurança, consistência e aderência às boas práticas — antes de expor a API para consumidores externos ou para o front-end.

## Quando usar
- Ao criar novos endpoints
- Ao revisar uma rota existente que está causando problemas
- Antes de documentar a API (Swagger, Postman, etc.)
- Quando há inconsistência entre endpoints de um mesmo recurso

## O que analisar

### Design e nomenclatura
- Recursos no plural e em substantivos: `/users`, não `/getUsers` ou `/user`
- Hierarquia clara: `/users/:id/posts` para recursos aninhados
- Verbos HTTP usados corretamente:
  - `GET` — leitura, sem efeito colateral
  - `POST` — criação
  - `PUT` — substituição completa
  - `PATCH` — atualização parcial
  - `DELETE` — remoção
- Versão na URL ou no header: `/api/v1/` ou `Accept: application/vnd.app.v1+json`

### Status codes
- `200` para sucesso com body
- `201` para criação bem-sucedida (com `Location` header)
- `204` para sucesso sem body (DELETE, por exemplo)
- `400` para erro de validação do cliente
- `401` para não autenticado
- `403` para autenticado mas sem permissão
- `404` para recurso não encontrado
- `409` para conflito (email duplicado, etc.)
- `422` para entidade não processável (validação semântica)
- `500` apenas para erros inesperados do servidor

### Contratos de resposta
- Estrutura consistente entre endpoints? (envelope `{ data, error, meta }`)
- Erros sempre no mesmo formato? (`{ error: { code, message, field } }`)
- Paginação implementada para listas? (`{ data, total, page, limit }`)
- Campos desnecessários ou sensíveis sendo retornados?

### Segurança
> Chama `security-audit` internamente para endpoints de autenticação

- Autenticação verificada em todas as rotas protegidas?
- Input validado e sanitizado antes de usar?
- Rate limiting configurado em endpoints públicos?
- CORS correto para o front-end consumidor?

### Performance
- N+1 queries em rotas que retornam listas?
- Sem paginação em endpoints que podem retornar muitos registros?
- Campos pesados retornados quando não necessários (considerar field selection)?

## Formato de resposta

```
API REVIEW — [método] [rota]
=============================
✅ Nomenclatura: correta
❌ Status code: retorna 200 para criação — deveria ser 201 com Location header
⚠️  Contrato: campo `password_hash` sendo retornado na resposta
💡 Performance: sem paginação — pode explodir com muitos registros
🔒 Segurança: sem rate limiting neste endpoint público
```

## Observações
- Revise todos os endpoints de um mesmo recurso juntos para garantir consistência
- Documente breaking changes se a API já tiver consumidores
- Se houver Swagger/OpenAPI, verificar se a spec está sincronizada com a implementação
