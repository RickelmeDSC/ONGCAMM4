---
name: changelog-update
description: Atualiza o CHANGELOG.md com base nos commits ou PRs mergeados. Efeito colateral em arquivo versionado — nunca dispara automaticamente.
disable-model-invocation: true
user-invocable: true
---

# Skill: Changelog Update

## Objetivo
Gerar ou atualizar o `CHANGELOG.md` do projeto seguindo o formato [Keep a Changelog](https://keepachangelog.com), com base nos commits ou PRs de um período ou release.

## Quando usar
- Ao preparar uma nova release
- Ao fechar uma sprint
- Quando o CHANGELOG está desatualizado e precisa ser reconstruído

## Input esperado
Forneça um dos seguintes:
- Output de `git log vX.X.X..HEAD --oneline`
- Lista de PRs mergeados no período
- Descrição manual das mudanças

> **Fallback:** Se o projeto não usa versionamento por tags, usar `git log --since="YYYY-MM-DD" --oneline` ou listar os últimos N commits com `git log -N --oneline`.

## Estrutura do CHANGELOG gerado

```markdown
# Changelog

## [Unreleased]

## [X.X.X] - YYYY-MM-DD

### Added
- Nova funcionalidade X que permite Y

### Changed
- Comportamento de Z alterado para ser mais consistente com W

### Fixed
- Correção do bug que causava erro 500 ao fazer login com email inválido

### Removed
- Endpoint deprecado `/api/v1/old-route` removido

### Security
- Atualização de dependência com CVE-XXXX-XXXX
```

## Regras de categorização

**Added** — nova feature, novo endpoint, nova página, nova configuração  
**Changed** — mudança de comportamento existente, refactor com impacto externo, atualização de dependência major  
**Fixed** — bug fix, correção de comportamento incorreto  
**Removed** — remoção de feature, endpoint, ou dependência  
**Security** — correção de vulnerabilidade, atualização de segurança  
**Deprecated** — feature que será removida em breve  

## Regras de escrita
- Escreva para o usuário final da feature, não para o desenvolvedor
- Evite jargão interno: "Refatorou o serviço de auth" → "Login agora é 40% mais rápido"
- Seja específico: "Correção de bug" não diz nada — qual bug? qual impacto?
- Agrupe mudanças relacionadas em uma única entrada quando fizer sentido

## Observações
- Nunca sobrescreva versões já publicadas do CHANGELOG
- Apenas adicione entradas na seção `[Unreleased]` ou crie uma nova versão
- Pergunte ao usuário o número da versão antes de criar uma nova seção de release
- Se o projeto não tem CHANGELOG, crie o arquivo do zero com a estrutura correta
