---
name: refactor
description: Sugere oportunidades de refatoração em código existente com foco em legibilidade, manutenibilidade e redução de complexidade. Nunca altera código sem aprovação explícita.
disable-model-invocation: false
user-invocable: true
---

# Skill: Refactor

## Objetivo
Identificar e propor melhorias estruturais no código sem alterar comportamento externo. O foco é tornar o código mais fácil de ler, testar e manter — não apenas mais "elegante".

## Quando usar
- Código que está funcionando mas difícil de entender
- Funções grandes que fazem coisas demais
- Módulos com alto acoplamento
- Antes de adicionar uma feature em cima de código problemático

## Princípio fundamental
> Refatoração sem testes é apenas reorganizar o risco.

Antes de sugerir qualquer refatoração, verificar: há testes cobrindo o comportamento atual? Se não, recomendar `test-review` primeiro.

## O que analisar

### Complexidade
- Funções com mais de 20-30 linhas — candidatas a extração
- Condicionais aninhadas em mais de 3 níveis
- Parâmetros demais numa função (>3-4 é sinal de problema)
- Código que precisa de comentário para ser entendido (o código deveria se explicar)

### Duplicação
- Lógica idêntica ou quase idêntica em dois ou mais lugares
- Copy-paste com pequenas variações — candidato a parametrização
- Constantes repetidas ao longo do código

### Acoplamento
- Módulos que importam dezenas de outros módulos
- Funções que sabem demais sobre a estrutura interna de outros módulos
- God objects — classes ou módulos que fazem tudo

### Nomenclatura
- Variáveis como `data`, `result`, `temp`, `obj` sem contexto
- Funções com `and` no nome (fazem duas coisas)
- Booleanos sem prefixo `is/has/should/can`

## Formato de resposta

Para cada oportunidade identificada:
```
📍 Arquivo: src/services/user.js — função processUserData (linha 45-98)
🔍 Problema: função com 54 linhas fazendo validação, transformação e persistência
💡 Sugestão: extrair em validateUser(), transformUser(), saveUser()
⚠️  Pré-requisito: adicionar testes antes de refatorar
```

Após listar as oportunidades, perguntar: "Por qual quer começar?"

## Regras
- Nunca altere código diretamente — proponha, explique, aguarde aprovação
- Priorize por impacto: complexidade alta em código frequentemente alterado primeiro
- Não refatore por gosto estético — todo item precisa de justificativa objetiva
- Se a refatoração mudar interfaces públicas, avise sobre breaking changes
- Use o contexto da sessão para evitar sugerir mudanças já descartadas anteriormente
