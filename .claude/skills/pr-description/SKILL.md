---
name: pr-description
description: Gera descrição completa de Pull Request com base no diff ou histórico de commits do branch. Nunca dispara automaticamente — PR é uma ação com consequência real no repositório.
disable-model-invocation: true
user-invocable: true
---

# Skill: PR Description

## Objetivo
Gerar uma descrição clara, completa e padronizada para Pull Requests, economizando tempo e garantindo que revisores tenham contexto suficiente para aprovar com confiança.

## Quando usar
- Antes de abrir um PR no GitHub/GitLab
- Ao atualizar a descrição de um PR já existente
- Quando o PR tem muitas mudanças e precisa de contexto explicado

## O que pedir ao usuário (se não fornecido)
- O diff ou output de `git log main..HEAD --oneline`
- O contexto da mudança: bug fix? nova feature? refactor?
- Há breaking changes?

## Estrutura da descrição gerada

```markdown
## O que foi feito
[Descrição clara e direta do que muda com esse PR — foco no "o quê"]

## Por que foi feito
[Motivação: bug reportado, decisão técnica, melhoria de performance, etc.]

## Como testar
- [ ] Passo 1
- [ ] Passo 2
- [ ] Comportamento esperado: ...

## Impacto
- [ ] Breaking change
- [ ] Mudança de banco de dados / migração necessária
- [ ] Mudança de variável de ambiente
- [ ] Afeta outros serviços

## Checklist
- [ ] Testes adicionados ou atualizados
- [ ] Documentação atualizada
- [ ] Sem `console.log` ou código de debug
- [ ] Variáveis de ambiente documentadas (se aplicável)
```

## Regras de geração
- Seja objetivo no título: máximo 72 caracteres, formato imperativo
- Não repita o nome dos arquivos como descrição — explique o impacto
- Se houver migration de banco, sinalize claramente
- Se afetar variáveis de ambiente, liste quais
- Adapte o nível de detalhe ao tamanho do PR: PRs pequenos não precisam de seção "Como testar" longa

## Observações
- Nunca abra o PR automaticamente
- Se o diff for muito grande (>500 linhas), peça ao usuário que divida o PR antes de descrever
- Use o contexto da sessão para aproveitar decisões já discutidas
