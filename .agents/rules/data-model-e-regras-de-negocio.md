---
trigger: model_decision
description: Modelo de dados de referência e regras de negócio do domínio de condomínio. Ativar sempre que for mexer em schema.prisma, lançamentos financeiros, cobranças, reservas ou ocorrências.
---

# Modelo de dados e regras de negócio

Este é o modelo de referência. O agente pode ajustar nomes/tipos pontuais, mas **não pode remover
uma regra de negócio aqui descrita** sem avisar explicitamente por quê.

## Entidades principais (schema.prisma conceitual)

```prisma
enum PapelUsuario {
  SINDICO
  SUBSINDICO
  CONSELHEIRO
  MORADOR
  FUNCIONARIO
}

enum TipoOcupacao {
  PROPRIETARIO
  INQUILINO
  DEPENDENTE
}

enum TipoLancamento {
  RECEITA
  DESPESA
}

enum StatusCobranca {
  PENDENTE
  PAGO
  ATRASADO
  CANCELADO
}

enum StatusOcorrencia {
  ABERTA
  EM_ANDAMENTO
  RESOLVIDA
  CANCELADA
}

model Condominio {
  id        String   @id @default(cuid())
  nome      String
  cnpj      String?
  endereco  String
  createdAt DateTime @default(now())

  blocos       Bloco[]
  unidades     Unidade[]
  memberships  Membership[]
  lancamentos  Lancamento[]
  comunicados  Comunicado[]
  areasComuns  AreaComum[]
  ocorrencias  Ocorrencia[]
  documentos   Documento[]
}

model Membership {
  id           String       @id @default(cuid())
  userId       String       // referencia o usuário do Better Auth
  condominioId String
  papel        PapelUsuario
  ativo        Boolean      @default(true)
  condominio   Condominio   @relation(fields: [condominioId], references: [id])

  @@unique([userId, condominioId])
}

model Bloco {
  id           String     @id @default(cuid())
  condominioId String
  nome         String     // ex: "Bloco A", "Torre 1"
  condominio   Condominio @relation(fields: [condominioId], references: [id])
  unidades     Unidade[]
}

model Unidade {
  id            String     @id @default(cuid())
  condominioId  String
  blocoId       String?
  identificador String     // ex: "Apto 101"
  fracaoIdeal   Decimal    // percentual usado no rateio, soma das unidades = 100
  condominio    Condominio @relation(fields: [condominioId], references: [id])
  bloco         Bloco?     @relation(fields: [blocoId], references: [id])
  moradores     MoradorPerfil[]
  cobrancas     Cobranca[]
}

model MoradorPerfil {
  id           String       @id @default(cuid())
  userId       String
  unidadeId    String
  tipoOcupacao TipoOcupacao
  unidade      Unidade      @relation(fields: [unidadeId], references: [id])
}

model LancamentoCategoria {
  id           String         @id @default(cuid())
  condominioId String
  nome         String         // ex: "Manutenção", "Folha de pagamento", "Taxa condominial"
  tipo         TipoLancamento
}

model Lancamento {
  id           String         @id @default(cuid())
  condominioId String
  categoriaId  String
  tipo         TipoLancamento
  descricao    String
  valor        Decimal
  data         DateTime
  condominio   Condominio     @relation(fields: [condominioId], references: [id])
}

model Cobranca {
  id            String         @id @default(cuid())
  unidadeId     String
  competencia   DateTime       // mês de referência
  valorOriginal Decimal
  valorAtual    Decimal        // com multa/juros aplicados, se atrasado
  vencimento    DateTime
  status        StatusCobranca @default(PENDENTE)
  pagoEm        DateTime?
  unidade       Unidade        @relation(fields: [unidadeId], references: [id])
}

model Comunicado {
  id           String     @id @default(cuid())
  condominioId String
  titulo       String
  corpo        String
  blocoId      String?    // null = todos os blocos
  publicadoEm  DateTime   @default(now())
  condominio   Condominio @relation(fields: [condominioId], references: [id])
  leituras     ComunicadoLeitura[]
}

model ComunicadoLeitura {
  id           String     @id @default(cuid())
  comunicadoId String
  userId       String
  lidoEm       DateTime   @default(now())
  comunicado   Comunicado @relation(fields: [comunicadoId], references: [id])

  @@unique([comunicadoId, userId])
}

model AreaComum {
  id                 String     @id @default(cuid())
  condominioId       String
  nome               String     // ex: "Salão de festas", "Churrasqueira"
  antecedenciaMinHrs Int        @default(24)
  condominio         Condominio @relation(fields: [condominioId], references: [id])
  reservas           Reserva[]
}

model Reserva {
  id           String    @id @default(cuid())
  areaComumId  String
  unidadeId    String
  inicio       DateTime
  fim          DateTime
  status       String    @default("CONFIRMADA") // CONFIRMADA | CANCELADA
  areaComum    AreaComum @relation(fields: [areaComumId], references: [id])
}

model Ocorrencia {
  id           String           @id @default(cuid())
  condominioId String
  unidadeId    String?
  categoria    String
  titulo       String
  descricao    String
  status       StatusOcorrencia @default(ABERTA)
  criadoPor    String
  atribuidoA   String?
  createdAt    DateTime         @default(now())
  condominio   Condominio       @relation(fields: [condominioId], references: [id])
  comentarios  OcorrenciaComentario[]
}

model OcorrenciaComentario {
  id           String     @id @default(cuid())
  ocorrenciaId String
  autorId      String
  texto        String
  createdAt    DateTime   @default(now())
  ocorrencia   Ocorrencia @relation(fields: [ocorrenciaId], references: [id])
}

model Documento {
  id           String     @id @default(cuid())
  condominioId String
  categoria    String     // ATA | REGIMENTO | CONVENCAO | OUTRO
  titulo       String
  arquivoUrl   String
  visivelPara  String     @default("TODOS") // TODOS | CONSELHO
  condominio   Condominio @relation(fields: [condominioId], references: [id])
}
```

## Regras de negócio obrigatórias

### Rateio e cobrança mensal
- A taxa condominial mensal é gerada por unidade proporcionalmente à `fracaoIdeal`, salvo quando o
  condomínio configurar rateio igualitário (todas as unidades pagam o mesmo valor) — deixar essa
  opção configurável em `Condominio`, mas o **padrão é rateio por fração ideal**.
- A soma de `fracaoIdeal` de todas as unidades de um condomínio deve ser validada para não
  ultrapassar 100% ao cadastrar/editar unidade.
- Geração de cobranças é uma ação (job manual ou botão "Gerar cobranças do mês") que cria uma
  `Cobranca` por unidade para a competência informada, com base no rateio das despesas/receita
  esperada do mês.

### Multa e juros por atraso
- Ao passar do `vencimento` sem pagamento, a cobrança muda de `PENDENTE` para `ATRASADO`.
- Fórmula padrão (configurável por condomínio, mas esse é o default legal usual no Brasil,
  Código Civil art. 1.336 §1º): **multa de 2% sobre o valor original** + **juros de 1% ao mês,
  calculados pro rata die** sobre os dias de atraso.
- `valorAtual = valorOriginal + multa + juros`. Nunca alterar `valorOriginal` (é o valor de
  referência para relatórios).

### Inadimplência
- Indicador de inadimplência = soma de `valorAtual` das cobranças com status `ATRASADO` dividido
  pela soma esperada do mês, exibido em % no dashboard.

### Reservas de área comum
- Uma reserva só pode ser criada se não houver conflito de horário com outra reserva
  `CONFIRMADA` na mesma `AreaComum`.
- Respeitar `antecedenciaMinHrs`: não permitir reserva com início a menos dessas horas do momento
  atual.
- Cancelamento: só quem criou a reserva ou um síndico/subsíndico pode cancelar.

### Ocorrências
- Fluxo de status: `ABERTA → EM_ANDAMENTO → RESOLVIDA`, com `CANCELADA` possível a partir de
  `ABERTA` ou `EM_ANDAMENTO`. Não permitir pular direto de `ABERTA` para `RESOLVIDA` sem passar
  por `EM_ANDAMENTO` — a UI deve guiar essa transição.
- Qualquer morador pode comentar na própria ocorrência; síndico/subsíndico/funcionário podem
  comentar em qualquer ocorrência do condomínio.

### Comunicados
- `blocoId = null` significa "todos os blocos do condomínio".
- "Confirmação de leitura" é opcional por comunicado (`ComunicadoLeitura`), mas quando ativada,
  o dashboard do síndico deve mostrar quantos % dos moradores confirmaram leitura.
