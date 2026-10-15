---
description: Procedimento passo a passo para criar um novo módulo CRUD completo (schema, server actions, UI) seguindo os padrões do projeto. Invocar com /criar-modulo-crud.
---

# Workflow: criar um módulo CRUD

Use este procedimento sempre que for adicionar um módulo novo (ou uma entidade nova dentro de um
módulo existente) ao app de condomínio.

## Passos

1. **Modelo de dados**
   - Confirmar o model em `.agents/rules/data-model-e-regras-de-negocio.md` (ou propor um novo se
     não existir, seguindo o mesmo estilo).
   - Adicionar/ajustar em `prisma/schema.prisma`, gerar migration (`prisma migrate dev --name
     <nome>`), rodar `prisma generate`.

2. **Validação**
   - Criar schema Zod em `src/lib/validations/<modulo>.ts` cobrindo create e update.

3. **Camada de permissão**
   - Conferir a matriz em `.agents/rules/auth-e-permissoes.md` para esse módulo.
   - Usar/estender o helper `podeAcao(papel, modulo, acao)` de `src/lib/permissions/`.

4. **Server Actions**
   - Criar `src/server/actions/<modulo>.ts` com funções `listar`, `criar`, `atualizar`,
     `excluir` (ou os verbos aplicáveis). Cada função:
     a. Resolve sessão + `Membership` do `condominioId` da rota.
     b. Checa permissão via `podeAcao`.
     c. Valida input com o schema Zod.
     d. Executa a query Prisma **sempre filtrando por `condominioId`**.
     e. Retorna erro tipado (nunca lançar exceção crua para o client).

5. **UI**
   - Página de listagem em `src/app/(app)/[condominioId]/<modulo>/page.tsx`: tabela ou cards +
     estado de loading (skeleton) + vazio + erro, conforme
     `.agents/rules/ui-ux-e-componentes.md`.
   - Formulário de criar/editar em `Dialog` ou `Sheet` do shadcn, usando `react-hook-form` +
     o schema Zod do passo 2.
   - Se o módulo tiver uma rota própria de destaque (ex: "Novo lançamento"), adicionar o link
     correspondente na sidebar/bottom nav conforme já definido.

6. **Checagem final**
   - `tsc --noEmit` sem erros.
   - Testar visualmente em mobile, tablet e desktop.
   - Confirmar que os 3 estados (loading/vazio/erro) aparecem corretamente.
   - Resumir o que foi criado (arquivos + migration) antes de seguir para o próximo módulo.
