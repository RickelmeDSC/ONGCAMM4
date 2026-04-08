---
name: env-check
description: Utilitário interno que verifica variáveis de ambiente. Não aparece no menu — é chamada por deploy-check e security-audit. Uso programático.
disable-model-invocation: true
user-invocable: false
---

# Skill: Env Check

## Objetivo
Verificar se variáveis de ambiente estão corretamente definidas, sem valores de desenvolvimento vazando para produção, e sem secrets expostos no código.

## Uso
Esta skill é interna. É chamada por `deploy-check` e `security-audit`. O usuário não precisa invocá-la diretamente, mas pode fazê-lo pelo nome se quiser.

## O que verificar

### 1. Presença obrigatória
Listar todas as variáveis presentes no `.env.example` e verificar se estão definidas no ambiente atual:
- Variáveis faltando → ❌ Bloqueante
- Variáveis com valor vazio → ⚠️ Atenção

### 2. Vazamento de ambiente
Detectar padrões que indicam configuração de desenvolvimento em produção:
- `NODE_ENV=development` em produção → ❌
- URLs apontando para `localhost` ou `127.0.0.1` → ❌
- Chaves com sufixo `_DEV` ou `_TEST` → ⚠️
- `DEBUG=true` → ⚠️

### 3. Secrets expostos no código
Verificar se há valores hardcoded que deveriam estar em variáveis:
- Padrões de JWT secrets, API keys, tokens diretamente no código
- Strings com padrão de hash (40+ caracteres alfanuméricos)
- Credenciais de banco diretamente em connection strings no código

### 4. Consistência entre ambientes
Comparar `.env.example` com o que está definido:
- Variáveis no código mas ausentes do `.env.example` → ⚠️ (não documentadas)
- Variáveis no `.env.example` mas nunca usadas no código → ℹ️ (pode remover)

## Formato de saída

```
ENV CHECK REPORT
================
✅ Presença: todas as variáveis obrigatórias definidas
❌ Vazamento: NODE_ENV=development detectado
⚠️  Exposição: possível API key hardcoded em src/config/stripe.js:12
ℹ️  Limpeza: 3 variáveis no .env.example nunca usadas no código
```

## Observações
- Nunca logar o valor das variáveis, apenas a presença/ausência
- Nunca expor secrets no output, apenas o caminho onde foram encontrados
