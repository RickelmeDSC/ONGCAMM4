---
name: commit-review
description: Revisão de commits antes de serem finalizados. Analisa mensagem, escopo das mudanças e consistência. Controle total do usuário — não dispara automaticamente.
disable-model-invocation: true
user-invocable: true
---

# Skill: Commit Review

## Objetivo
Revisar um commit antes de ser finalizado, garantindo que a mensagem seja clara, o escopo seja coerente e nenhum arquivo indevido esteja incluso.

## Por que `disable-model-invocation: true`?
Commits são operações com consequências reais no repositório. Esta skill **nunca dispara automaticamente** — só executa quando você a chamar explicitamente. Controle total seu.

## Quando usar
- Antes de executar `git commit`
- Ao revisar o trabalho do dia antes de fazer push
- Quando quiser garantir que o commit conta uma história clara

## O que analisar

### 1. Mensagem do commit
Verifique se a mensagem:
- Está no formato correto do projeto (conventional commits, etc.)
- Descreve **o quê** mudou e **por quê**, não apenas o **como**
- Está no tempo verbal adequado (imperativo é o padrão: "Add", "Fix", "Update")
- Tem escopo definido quando necessário: `feat(auth): add JWT refresh token`

**Problemas comuns a identificar:**
- Mensagens vagas: "fix bug", "changes", "wip"
- Mensagens longas demais no subject (mais de 72 caracteres)
- Ausência de corpo explicativo em mudanças complexas

### 2. Escopo das mudanças (diff)
Analise os arquivos staged:
- As mudanças são coesas? Um commit deve fazer **uma coisa só**
- Há arquivos que não deveriam estar inclusos? (`.env`, arquivos de build, logs)
- Há código de debug esquecido? (`console.log`, `debugger`, `TODO` urgente)
- O diff é proporcional ao que a mensagem descreve?

### 3. Consistência com o projeto
- As mudanças seguem o estilo de código do projeto?
- Há breaking changes que deveriam ser sinalizadas?
- Testes foram adicionados ou atualizados quando necessário?

## Formato da resposta

```
✅ Mensagem: [aprovado / ajuste sugerido]
📦 Escopo: [coeso / múltiplas responsabilidades detectadas]
🔍 Arquivos: [ok / atenção para: ...]
💬 Sugestão de mensagem: (se aplicável)
```

## Exemplo de uso
O usuário executa `git diff --staged` e compartilha o output + a mensagem que pretende usar.
A skill analisa e responde com o formato acima.

## Observações
- Nunca execute o commit em nome do usuário
- Se o commit tiver múltiplas responsabilidades, sugira como dividi-lo
- Mantenha o tom objetivo — o objetivo é agilizar, não bloquear
