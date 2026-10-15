# AGENTS.md — App de Gestão de Condomínio

Este arquivo é lido por qualquer agente (Antigravity, e por extensão Gemini CLI/Cursor/Claude Code
via compatibilidade com AGENTS.md) antes de iniciar trabalho neste repositório. Contém as regras
que valem para **todo** o projeto. Regras específicas por área ficam em `.agents/rules/`.

## Visão geral do produto
Sistema web de gestão de condomínios residenciais. Usuários: síndico, subsíndico, conselheiro,
morador (proprietário ou inquilino) e funcionário (porteiro/zelador). Módulos: cadastro estrutural
(blocos/unidades/moradores), financeiro (lançamentos e cobrança de taxa condominial), comunicados,
reservas de áreas comuns, ocorrências/chamados, documentos e dashboard.

## Stack obrigatória — não desviar sem justificar
- **Next.js 15+** (App Router), **React 19**, **TypeScript strict** (`any` só com comentário
  justificando por quê).
- **Banco**: Neon (Postgres serverless).
- **ORM: Prisma v7** — regras específicas (v7 mudou bastante em relação ao v6, não usar padrões antigos):
  - `generator client { provider = "prisma-client"; output = "../src/generated/prisma" }`.
    **Nunca** usar `provider = "prisma-client-js"`.
  - O bloco `datasource` do `schema.prisma` **não tem** `url`. A connection string vive em
    `prisma.config.ts` e é passada via adapter para o `PrismaClient`.
  - Adapter de driver é obrigatório: usar `@prisma/adapter-neon` (driver serverless da Neon).
    Nunca instanciar `new PrismaClient()` sem adapter.
  - Criar `prisma.config.ts` na raiz (carrega `.env` explicitamente — v7 não carrega sozinho fora
    do config).
  - Middleware `$use` foi removido — usar Client Extensions quando precisar interceptar queries.
  - Depois de `prisma migrate dev`, o seed **não** roda mais automaticamente — chamar
    `prisma db seed` explicitamente (documentar isso no README do projeto gerado).
- **Autenticação: Better Auth** (email/senha + convite por e-mail para novos moradores). Sessão via
  cookie httpOnly. Nunca implementar autenticação "na mão".
- **UI**: Tailwind CSS + shadcn/ui + lucide-react. Formulários com `react-hook-form` + `zod`.
- **Pagamento: AbacatePay** (PIX, boleto, link de pagamento — sem cartão). Ver
  `.agents/skills/gateway-abacatepay/SKILL.md` e `.agents/rules/assinaturas-e-pagamento-por-modulo.md`.
  Modelo de negócio é **por módulo**, não pelo app inteiro: núcleo tem 2 meses grátis, Documentos
  é pago desde o início.
- **Mutações sempre via Server Actions.** Client Component nunca chama Prisma diretamente.
- **Toda Server Action e toda rota de formulário valida entrada com um schema Zod**, mesmo que o
  client já valide — nunca confiar só na validação do lado do cliente.

## Estrutura de pastas sugerida
```
src/
  app/
    (public)/                    # login, convite, recuperação de senha
    (app)/[condominioId]/        # área logada, escopada por condomínio (multi-tenant)
      dashboard/ lancamentos/ moradores/ comunicados/ reservas/ ocorrencias/ documentos/ configuracoes/
  components/
    ui/                          # shadcn
    nav/                         # sidebar (desktop) + bottom nav (mobile)
  lib/
    auth/ db/ permissions/ validations/
  server/
    actions/                     # server actions, um arquivo por módulo
  generated/prisma/              # saída do prisma generate — não editar à mão
prisma/
  schema.prisma  migrations/  seed.ts
```

## Convenções de código
- Tabelas/campos do Prisma em `PascalCase`/`camelCase`; pastas e rotas em `kebab-case`.
- **Toda** query de dado de negócio filtra por `condominioId` — o sistema é multi-tenant desde o
  primeiro dia. Nunca confiar apenas em filtro de UI para isolar dados entre condomínios.
- Toda Server Action confere a permissão do usuário (ver `.agents/rules/auth-e-permissoes.md`)
  **antes** de tocar no banco.
- Dinheiro: campo `Decimal` no Prisma, nunca `Float`. Exibição sempre em `R$` via
  `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.
- Datas: armazenadas em UTC, exibidas em `dd/mm/aaaa`.
- Toda tela de listagem tem estado de *loading* (skeleton), *vazio* (empty state com CTA) e *erro*.
- Commits em Conventional Commits (`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`).

## Server Components vs Client Components — obrigatório
- **Todo componente é Server Component por padrão.** Só adicionar `"use client"` quando o
  componente realmente precisar de: hooks de estado/efeito (`useState`, `useEffect`,
  `useReducer`), handlers de interação (`onClick`, `onChange`, `onSubmit`) ou API de navegador.
- Buscar dado (via Prisma) sempre no Server Component da própria `page.tsx` (ou em Server
  Components auxiliares), de forma `async`. **Proibido** buscar o dado inicial de uma página via
  `useEffect` + `fetch`/Server Action disparado de um Client Component — isso é sinal de que a
  página deveria continuar sendo Server Component.
- "Empurre" `"use client"` para as folhas da árvore: a `page.tsx` e o `layout.tsx` continuam
  Server Component, buscam os dados e passam como props; só o pedaço realmente interativo (um
  formulário, um dropdown, um dialog) vira um componente próprio com `"use client"`.
- `useEffect` só é aceitável para sincronizar com algo fora do React (ex: assinar evento de
  navegador, WebSocket) — nunca para carregar dado inicial de página.
- Revalidação após mutação: usar `revalidatePath`/`revalidateTag` dentro da própria Server
  Action, não `router.refresh()` disparado de um `useEffect` no client.
- Estado de loading de uma página vem do `loading.tsx` da rota (Suspense automático do App
  Router), não de um `if (loading) return <Spinner />` dentro do componente.

## Formulários — obrigatório
- Todo formulário usa **`react-hook-form`** com `zodResolver` apontando para o schema Zod do
  módulo (`src/lib/validations/<modulo>.ts`). **Proibido** controlar campo de formulário com
  `useState` solto.
- Usar o padrão atual do shadcn/ui: `<Controller>` do react-hook-form + os componentes `Field`
  (`Field`, `FieldGroup`, `FieldLabel`, `FieldDescription`, `FieldError`, `FieldSet`,
  `FieldLegend`). **Não** usar o padrão antigo `<Form>/<FormField>/<FormItem>/<FormControl>/
  <FormMessage>` — foi substituído pelo padrão `Field` na documentação oficial. Ver o passo a
  passo completo e exemplos em
  `.agents/skills/formularios-shadcn-react-hook-form/SKILL.md`.
- O `<form>` em si é necessariamente um Client Component — isso é esperado. O que não pode
  acontecer é a página inteira virar Client Component por causa disso: isolar o formulário em um
  componente próprio (ex: `NovoLancamentoForm.tsx`) e importar esse componente (client) dentro da
  `page.tsx` (server).
- `onSubmit` (via `handleSubmit` do react-hook-form) chama a Server Action diretamente, com
  `useTransition` para o estado de pending do botão — nunca um `fetch` manual para uma API route.
- Feedback de sucesso/erro via toast (`sonner`), nunca `alert()`.

## Segurança — sem exceção
- Nunca expor `DATABASE_URL` ou segredos do Better Auth no client.
- Toda rota dentro de `(app)/[condominioId]` verifica no servidor que o usuário logado tem um
  `Membership` ativo naquele `condominioId` antes de renderizar qualquer dado.
- Upload de documentos: validar tipo e tamanho no servidor, nunca confiar só no `accept` do input.
- Rate limit básico em rotas públicas (login, convite, recuperação de senha).

## Como trabalhar neste repositório
1. Antes de gerar qualquer código de domínio, leia tudo em `.agents/rules/` e `.agents/skills/`.
2. Antes de codar, produza um plano de implementação (arquivos a criar/editar, ordem, migrations
   necessárias) e só então execute.
3. Ao final de cada módulo, rode `tsc --noEmit` e corrija erros antes de seguir para o próximo.
4. Para scaffolding de um novo módulo CRUD, siga o workflow `.agents/workflows/criar-modulo-crud.md`.
