---
name: test-review
description: Revisa testes existentes e identifica cenários sem cobertura. Roda no contexto principal para aproveitar o histórico do código já discutido na sessão.
disable-model-invocation: false
user-invocable: true
---

# Skill: Test Review

## Objetivo
Analisar os testes de um módulo ou feature, identificar gaps de cobertura e sugerir casos de teste ausentes — sem gerar código automaticamente, a menos que solicitado.

## Quando usar
- Após implementar uma nova feature
- Antes de abrir um PR
- Quando a cobertura cai abaixo do threshold do projeto
- Ao revisar código legado sem testes

## O que analisar

### 1. Cobertura de cenários (não de linhas)
Cobertura de linha é métrica enganosa. O que importa:
- **Happy path** — o fluxo principal funciona?
- **Edge cases** — inputs vazios, nulos, limites de tamanho, valores extremos
- **Cenários de erro** — o que acontece quando o banco cai? A API externa retorna 500?
- **Autenticação** — rotas protegidas testadas com e sem token?
- **Concorrência** — operações que podem conflitar se rodarem em paralelo?

### 2. Qualidade dos testes existentes
- Testes com assertions vagas (`expect(result).toBeTruthy()`) não provam nada
- Testes que dependem de ordem de execução são frágeis
- Mocks que mascaram o comportamento real em vez de isolá-lo
- Testes sem `describe` organizado ficam difíceis de manter
- Setup/teardown ausente causando estado compartilhado entre testes

### 3. Nomenclatura
Um bom teste se lê como documentação:
```
✅ "should return 401 when token is expired"
❌ "test auth"
```

## Formato de resposta

```
TEST REVIEW — [nome do módulo]
==============================
✅ Coberto: happy path, validação de input, erro 404
❌ Ausente: token expirado, rate limit excedido, timeout de banco
⚠️  Frágil: test linha 45 — assertion muito genérica
💡 Sugestão: adicionar teste de integração para o fluxo completo de cadastro
```

Após o relatório, perguntar: "Quer que eu escreva os casos ausentes?"

## Observações
- Não reescreva testes que funcionam, apenas os que são incorretos
- Priorize os casos ausentes por criticidade do módulo
- Se o projeto não tem testes, sugira por onde começar (módulos mais críticos primeiro)
- Use o contexto da sessão para entender a lógica do código sem ter que reler tudo
