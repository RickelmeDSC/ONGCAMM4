# Prompt — Setup de Skills para Novo Projeto

Cole este prompt no início de uma nova sessão para recriar a estrutura de skills:

---

Crie a estrutura de Skills do projeto na pasta `.claude/skills/` na raiz do projeto, seguindo exatamente este padrão de frontmatter e organização:

**Skills com `disable-model-invocation: false` e `user-invocable: true`** (disparam automaticamente):
- `code-review` — revisão geral de código com foco em qualidade, segurança e manutenibilidade. Delega para `security-audit` em arquivos de autenticação/configuração, e indica `api-review` para revisão específica de endpoints REST.
- `test-review` — identifica gaps de cobertura e avalia qualidade dos testes existentes
- `refactor` — sugere refatorações sem alterar código automaticamente. Exige testes como pré-requisito; se não houver, recomenda `test-review` primeiro.
- `api-review` — revisa design, contratos e segurança de endpoints REST

**Skills com `disable-model-invocation: true` e `user-invocable: true`** (só rodam quando chamadas):
- `commit-review` — revisão de mensagem e escopo antes do commit
- `pr-description` — gera descrição completa de Pull Request
- `changelog-update` — atualiza o CHANGELOG.md seguindo o formato Keep a Changelog. Inclui fallback com `git log --since` para projetos sem tags de versão.
- `deploy-check` — checklist pré-deploy cobrindo código, ambiente, banco e rollback. Executa `env-check` explicitamente na etapa de variáveis de ambiente.

**Skills com `disable-model-invocation: true` e `user-invocable: false`** (uso interno por outras skills):
- `env-check` — verifica variáveis de ambiente, chamada por `deploy-check` e `security-audit`
- `security-audit` — auditoria de segurança, chamada por `code-review` e `api-review`

## Composição entre skills
As skills se integram entre si:
- `code-review` → chama `security-audit` (arquivos críticos) e sugere `api-review` (endpoints)
- `deploy-check` → executa `env-check` antes da verificação manual
- `refactor` → recomenda `test-review` como pré-requisito
- `api-review` → chama `security-audit` para endpoints de autenticação

Adapte o conteúdo de cada SKILL.md para o stack específico deste projeto antes de criar os arquivos.
