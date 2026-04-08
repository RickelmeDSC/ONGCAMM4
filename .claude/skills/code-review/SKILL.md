---
name: code-review
description: Revisão de código focada em qualidade, segurança e boas práticas. Roda no contexto principal da sessão, com acesso ao histórico e arquivos já discutidos.
disable-model-invocation: false
user-invocable: true
---

# Skill: Code Review

## Objetivo
Realizar uma revisão de código detalhada e contextualizada, aproveitando o histórico da sessão atual para entender decisões já tomadas e evitar sugestões redundantes.

## Quando usar
- O usuário pede revisão de um arquivo, função ou bloco de código
- Antes de abrir um Pull Request
- Após implementar uma nova feature ou correção de bug

## Como executar

### 1. Contexto da sessão
Antes de revisar, verifique o que já foi discutido na sessão:
- Há decisões de arquitetura já tomadas?
- Algum padrão foi estabelecido anteriormente?
- Existe contexto sobre o propósito do código?

### 2. Leitura do código
Leia o arquivo ou trecho indicado com atenção a:
- Lógica e fluxo de execução
- Nomenclatura de variáveis, funções e classes
- Estrutura e organização

### 3. Delegação para skills especializadas
- Para arquivos de autenticação, rotas de API ou configuração de segurança, chamar a skill `security-audit` automaticamente e incorporar o resultado na seção de Segurança.
- Para revisão específica de endpoints REST (controllers, rotas, contratos), considere usar `api-review` em vez desta skill — ela cobre design de API com mais profundidade.

### 4. Categorias de análise

**Qualidade**
- O código faz o que se propõe a fazer?
- Há lógica duplicada que pode ser extraída?
- Os nomes comunicam a intenção claramente?

**Segurança**
- Há dados sensíveis expostos (tokens, senhas, chaves)?
- Existe validação de entrada em pontos críticos?
- Há possibilidade de injeção ou vazamento de dados?

**Performance**
- Há operações desnecessariamente custosas no caminho crítico?
- Loops ou chamadas que podem ser otimizadas?

**Manutenibilidade**
- O código está suficientemente documentado onde necessário?
- Está fácil de testar?
- Segue os padrões do restante do projeto?

### 5. Formato da resposta
Estruture a revisão em:
1. **Resumo geral** — impressão geral do código (1-2 linhas)
2. **Pontos críticos** — problemas que precisam ser corrigidos
3. **Sugestões** — melhorias recomendadas, mas não obrigatórias
4. **Positivos** — o que está bem feito (não pule essa parte)

## Observações
- Seja direto, mas construtivo
- Priorize clareza na explicação dos problemas
- Sempre inclua um exemplo de como corrigir, quando aplicável
- Use o contexto da sessão para não repetir sugestões já discutidas
