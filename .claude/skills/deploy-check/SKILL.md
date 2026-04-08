---
name: deploy-check
description: Checklist pré-deploy para projetos com Vercel e Docker. Efeito colateral direto — nunca executa automaticamente. Chama env-check internamente.
disable-model-invocation: true
user-invocable: true
---

# Skill: Deploy Check

## Objetivo
Executar um checklist completo antes de qualquer deploy, cobrindo ambiente, código, infraestrutura e rollback. Adaptado para stack Vercel (front-end) + Docker (back-end).

## Quando usar
- Antes de fazer deploy em produção
- Antes de promover staging → production
- Após mudanças críticas de infraestrutura

## Sequência de verificação

### 1. Código
- [ ] Branch correto? (`main` para prod, `staging` para homologação)
- [ ] PR aprovado e mergeado?
- [ ] Nenhum `console.log`, `debugger` ou `TODO crítico` esquecido
- [ ] Build local passa sem erros? (`npm run build`)
- [ ] Testes passam? (`npm test`)

### 2. Variáveis de ambiente
> Antes de verificar manualmente, execute a skill `env-check` e incorpore o resultado nesta seção. Use o relatório dela como base para os itens abaixo.

- [ ] Todas as variáveis necessárias estão definidas no painel da Vercel / Docker env
- [ ] Nenhuma variável de desenvolvimento está indo pra produção
- [ ] Secrets rotacionados se houve exposição recente

### 3. Banco de dados
- [ ] Há migrations pendentes? Se sim, foram testadas em staging primeiro?
- [ ] Backup recente antes de rodar migrations em produção?
- [ ] Migrations são reversíveis (down migration existe)?

### 4. Docker (back-end)
- [ ] Imagem buildada com a tag correta (`docker build -t app:vX.X.X`)
- [ ] `docker-compose.yml` atualizado se houve mudança de serviços
- [ ] Healthcheck configurado no container
- [ ] Volumes e redes não foram alterados acidentalmente

### 5. Vercel (front-end)
- [ ] Preview deploy funcionou corretamente?
- [ ] Domínio customizado configurado?
- [ ] Headers de segurança presentes (`vercel.json`)?
- [ ] Rewrites e redirects testados?

### 6. Rollback
- [ ] Sabe qual versão anterior fazer rollback se necessário?
- [ ] Rollback de banco é possível sem perda de dados?
- [ ] Comunicado à equipe sobre a janela de deploy?

## Formato de resposta
Para cada seção, responder:
- ✅ OK
- ⚠️ Atenção — [detalhe]
- ❌ Bloqueante — [não faça deploy até resolver]

## Observações
- Nunca execute o deploy automaticamente
- Se qualquer item for ❌, o deploy deve ser bloqueado até resolução
- Documente o resultado do checklist num comentário do PR ou issue
