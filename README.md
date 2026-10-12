# Kit de IA para o App de Condomínio — Antigravity

Este kit contém tudo que o Antigravity precisa para construir o app inteiro sozinho, mantendo
consistência de arquitetura, regras de negócio e UI ao longo de toda a geração.

## O que tem aqui

```
AGENTS.md                                    # regras gerais do projeto (stack, estrutura, convenções)
.agents/
  rules/
    data-model-e-regras-de-negocio.md         # schema de referência + regras de negócio
    auth-e-permissoes.md                      # papéis e matriz de permissões
    ui-ux-e-componentes.md                    # navegação responsiva, shadcn, formatação BR
  skills/
    regras-financeiras-condominio/SKILL.md    # rateio, multa/juros, inadimplência
    reservas-e-ocorrencias/SKILL.md           # conflito de agenda, fluxo de status
  workflows/
    criar-modulo-crud.md                      # procedimento padrão para scaffolding de módulos
prompts/
  00-prompt-mestre-app-completo.md            # cole este para construir o app inteiro
  01-prompt-plano-de-implementacao.md         # opcional: só o plano, antes de liberar execução
  02-prompt-revisao-seguranca-e-qualidade.md  # rode depois do build, antes de refinar manualmente
  03-prompt-template-refinamento.md           # template para pedidos pontuais futuros
  04-prompt-corrigir-server-components-e-forms.md  # migra client component/useEffect e forms sem react-hook-form
  05-prompt-trial-pagamento-modulo-e-menu-mobile.md  # trial de 2 meses, pagamento por módulo (AbacatePay) e menu mobile completo
```

## Como usar

1. **Copie os arquivos** `AGENTS.md` e a pasta `.agents/` para a **raiz** do seu repositório do
   projeto (o mesmo diretório que você abre no Antigravity). Eles são lidos automaticamente pelo
   agente antes de qualquer tarefa — você não precisa colá-los no prompt.
2. Abra o projeto no Antigravity. Escolha o perfil de autonomia **"Review-driven development"**
   para a primeira rodada — assim você aprova o plano antes do agente sair criando tudo sozinho.
3. (Opcional, recomendado) Cole primeiro `prompts/01-prompt-plano-de-implementacao.md` para ver o
   plano completo antes de liberar a execução.
4. Cole `prompts/00-prompt-mestre-app-completo.md` no Agent Manager. Isso constrói o app inteiro,
   módulo por módulo, na ordem definida.
5. Depois que a geração terminar, cole `prompts/02-prompt-revisao-seguranca-e-qualidade.md` para o
   próprio agente auditar isolamento multi-tenant, permissões e regras financeiras antes de você
   começar a mexer manualmente no código.
6. Para ajustes pontuais depois (o que você mencionou que vai refinar), use o template em
   `prompts/03-prompt-template-refinamento.md` — ele mantém o agente ancorado nas mesmas regras em
   vez de cada prompt novo "esquecer" o contexto do projeto.

## Por que separar em rules / skills / workflow

- **`AGENTS.md`** e **`.agents/rules/`**: contexto que vale sempre (stack, modelo de dados,
  permissões, UI). O Antigravity carrega isso no início de cada sessão.
- **`.agents/skills/`**: conhecimento específico (fórmulas de multa/juros, regras de conflito de
  reserva) que só entra no contexto quando a tarefa realmente precisa — evita poluir o contexto do
  agente com detalhe financeiro quando ele está mexendo em UI de comunicados, por exemplo.
- **`.agents/workflows/`**: o procedimento repetível de "criar um módulo CRUD" — invocável a
  qualquer momento com `/criar-modulo-crud`, inclusive por você manualmente depois, ao adicionar
  um módulo novo que não estava no escopo inicial.

## Ajustando para a sua realidade
Os arquivos em `.agents/rules/` e `.agents/skills/` são o "contrato" do projeto — edite-os
diretamente se alguma regra de negócio estiver diferente do que você realmente quer (ex: outro
percentual de multa, outros papéis de usuário). O prompt mestre só referencia esses arquivos, não
duplica as regras, então uma mudança nas rules já se reflete em qualquer prompt futuro.
