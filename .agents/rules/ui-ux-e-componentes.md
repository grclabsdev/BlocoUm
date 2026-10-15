---
trigger: model_decision
description: Padrões visuais, componentes shadcn a usar, navegação responsiva e formatação brasileira. Ativar sempre que for gerar ou alterar UI.
---

# UI/UX e componentes

## Navegação (já definida — reaproveitar, não redesenhar do zero)
- **Desktop/tablet paisagem (`md:` para cima):** sidebar fixa à esquerda com os links: Início,
  Lançamentos, Moradores, Comunicados, Reservas, Ocorrências, Documentos, e um botão em destaque
  "Novo lançamento". Rodapé da sidebar com o card de status do plano (abaixo) e avatar/nome do
  usuário logado com logout.
- **Mobile/tablet retrato (abaixo de `md`):** duas peças, não uma só:
  1. **Bottom nav fixa** com exatamente 3 itens: Lançamentos (esquerda), Novo lançamento (centro,
     botão elevado), Início (direita) — como já implementado.
  2. **Barra superior fixa** (`md:hidden`, altura ~14, com nome/logo do condomínio) com um botão
     de menu (ícone `Menu` do lucide-react) que abre um `Sheet` (`side="left"`) contendo **a
     mesma lista completa de links da sidebar desktop** (Início, Lançamentos, Moradores,
     Comunicados, Reservas, Ocorrências, Documentos, Configurações) + o card de status do plano +
     o bloco de usuário/logout. Sem essa barra, no mobile só dá pra alcançar 3 dos 8 links — não
     pode acontecer.
- Breakpoint controlado só por classes Tailwind (`hidden md:flex` / `md:hidden`), sem JS de resize.
- Reservar espaço (`padding-top` para a barra superior, `padding-bottom` para a bottom nav) para
  nenhuma das duas sobrepor conteúdo no mobile.

## Status do plano e upgrade (ver rule `assinaturas-e-pagamento-por-modulo.md`)
- **Card de status do plano**: componente fixo no rodapé da sidebar (desktop) e dentro do `Sheet`
  do menu mobile. Três estados visuais:
  - Trial ativo: "Período gratuito — faltam N dias" (neutro).
  - Trial nos últimos 7 dias: mesmo card, cor de alerta (amber), reforça o prazo.
  - Expirado: "Período gratuito encerrado. Assine o [Plano X] para continuar inserindo dados." +
    botão que abre o `UpgradeModal`.
  Vem de um valor calculado no servidor (`trialFim - agora`) e passado como prop — nunca calcular
  data de expiração no client.
- **`UpgradeModal`** (`Dialog` do shadcn, componente único reaproveitado em todo o app): título
  muda conforme o motivo (`PLANO_EXPIRADO` → "Seu período gratuito acabou"; `MODULO_NAO_CONTRATADO`
  → "Módulo Documentos não contratado"), corpo curto explicando o que o plano libera, e a opção de
  pagamento (link de pagamento ou QR PIX — ver skill `gateway-abacatepay`).
- **Botões de criação** ("Novo lançamento", "Nova reserva", etc.): recebem via prop o status do
  plano vindo do server. `onClick`: se liberado, abre o `Dialog`/`Sheet` de criação normalmente;
  se bloqueado, abre o `UpgradeModal` no lugar — o dialog de criação nunca chega a abrir.
- **Defesa em profundidade**: mesmo que o botão de alguma forma deixe passar, a Server Action
  correspondente sempre chama `verificarAcesso` de novo antes de mutar. Se o resultado vier
  `PLANO_EXPIRADO`/`MODULO_NAO_CONTRATADO` do server (não do client), o formulário mostra o
  `UpgradeModal` em vez de um toast de erro genérico.
- **Página de Documentos**: se `verificarAcesso(condominioId, 'DOCUMENTOS')` não for `LIBERADO`,
  renderizar um `Alert` (shadcn) no topo da página — "Documentos é um módulo pago à parte (o
  armazenamento é feito em um serviço externo). Assine para habilitar upload e organização de
  documentos." — com botão que abre o `UpgradeModal`. A listagem de documentos já existentes
  continua visível (leitura nunca é bloqueada); o botão de upload fica desabilitado.

## Formulários e busca de dados
Ver as seções "Server Components vs Client Components" e "Formulários" em `AGENTS.md` — são
obrigatórias e valem para toda tela deste módulo. Resumo rápido ao montar uma tela:
- `page.tsx` = Server Component `async` que busca o dado e renderiza a lista/detalhe.
- Formulário de criar/editar = componente `"use client"` separado, com `react-hook-form` +
  `zodResolver`, dentro de um `Dialog`/`Sheet` do shadcn, chamado pela `page.tsx`.

## Componentes shadcn/ui a instalar e usar
`button`, `input`, `textarea`, `select`, `field`, `input-group`, `dialog`, `sheet`, `table`,
`tabs`, `badge`, `calendar`, `avatar`, `tooltip`, `separator`, `dropdown-menu`, `sonner` (toasts),
`skeleton`, `card`, `alert`. Não reinventar esses componentes — sempre `npx shadcn add <componente>`.
Formulário usa `field` (não o componente `form` legado) — ver
`.agents/skills/formularios-shadcn-react-hook-form/SKILL.md`.

## Estados obrigatórios em toda tela de listagem/dados
- **Loading:** skeleton no formato do conteúdo final (não um spinner genérico solto).
- **Vazio:** ícone + frase curta explicando o que fazer + botão de ação (ex: "Nenhum comunicado
  ainda. Publique o primeiro aviso para os moradores." + botão "Novo comunicado").
- **Erro:** mensagem específica do que falhou, nunca só "Erro ao carregar".

## Formatação brasileira
- Moeda: `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.
- Data: `dd/mm/aaaa`; hora `HH:mm`. Usar `date-fns` com `locale: ptBR`.
- Percentual de inadimplência/fração ideal com 1 ou 2 casas decimais, sufixo `%`.

## Tom da escrita na interface
- Voz ativa, direta, sem jargão de sistema: "Salvar lançamento", não "Submeter registro
  financeiro". Botão de ação e mensagem de confirmação usam o mesmo verbo (ex: botão "Publicar" →
  toast "Comunicado publicado").
- Mensagens de erro dizem o que aconteceu e como resolver, nunca genéricas.

## Acessibilidade e responsividade — piso de qualidade
- Foco visível em todo elemento navegável por teclado.
- Contraste mínimo AA nas cores de texto sobre fundo.
- Testar visualmente em 3 larguras: mobile (~390px), tablet (~768px) e desktop (~1280px) antes de
  considerar um módulo pronto.
