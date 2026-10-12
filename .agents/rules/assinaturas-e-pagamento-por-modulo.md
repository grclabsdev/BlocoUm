---
trigger: always_on
description: Modelo de assinatura por módulo, período de teste gratuito e regras de bloqueio de escrita quando o plano expira. Sempre aplicar — afeta toda Server Action de mutação.
---

# Assinaturas, período de teste e pagamento por módulo

## Princípio central
**O pagamento é por módulo, não pelo app inteiro.** Hoje existem dois módulos com cobrança
independente:
- `NUCLEO` — lançamentos, moradores, comunicados, reservas, ocorrências, dashboard,
  configurações. Tem **2 meses de teste grátis** a partir da criação do condomínio.
- `DOCUMENTOS` — armazenamento de arquivo em serviço externo (S3 ou equivalente), custo
  recorrente à parte do plano base. **Nunca tem período de teste** — é pago desde o primeiro uso.

Esse desenho deve continuar funcionando se, no futuro, outro módulo virar pago à parte (ex.: um
módulo de portaria digital) — não hardcode a lógica assumindo só esses dois.

## Modelo de dados (adicionar ao schema existente)

```prisma
enum StatusAssinatura {
  TRIAL
  ATIVA
  EXPIRADA
  CANCELADA
}

enum ModuloPago {
  NUCLEO
  DOCUMENTOS
}

model Plano {
  id                  String     @id @default(cuid())
  modulo              ModuloPago
  nome                String     // "Plano X" — nome definitivo ainda não decidido, deixar configurável
  valorMensal         Decimal
  abacatePayLinkId    String?    // id do Link de Pagamento reutilizável criado na AbacatePay
  ativo               Boolean    @default(true)
}

model Assinatura {
  id                    String           @id @default(cuid())
  condominioId          String
  modulo                ModuloPago
  planoId               String?
  status                StatusAssinatura @default(TRIAL)
  trialInicio           DateTime?
  trialFim              DateTime?
  validaAte             DateTime?        // até quando o último pagamento cobre acesso
  abacatePayCustomerId  String?
  condominio            Condominio       @relation(fields: [condominioId], references: [id])
  pagamentos            Pagamento[]

  @@unique([condominioId, modulo])
}

model Pagamento {
  id                 String     @id @default(cuid())
  assinaturaId       String
  referenciaExterna  String     @unique // id do checkout/transparent/payment-link na AbacatePay
  metodo             String     // PIX | BOLETO | LINK_PAGAMENTO
  valor              Decimal
  status             String     // PENDENTE | PAGO | EXPIRADO | ESTORNADO
  pagoEm             DateTime?
  assinatura         Assinatura @relation(fields: [assinaturaId], references: [id])
}
```

## Regras de criação
- Ao criar um `Condominio`, criar automaticamente:
  - `Assinatura(modulo: NUCLEO, status: TRIAL, trialInicio: agora, trialFim: agora + 60 dias)`.
  - `Assinatura(modulo: DOCUMENTOS, status: EXPIRADA)` — já criada "bloqueada", sem trial, só para
    uniformizar a checagem (evita `null` espalhado pelo código).

## Regra de acesso (obrigatória em toda Server Action de mutação)
Criar um helper central `src/lib/billing/verificar-acesso.ts`:

```
verificarAcesso(condominioId, modulo): "LIBERADO" | "PLANO_EXPIRADO" | "MODULO_NAO_CONTRATADO"

- Buscar Assinatura(condominioId, modulo).
- Se modulo = NUCLEO:
    - status = TRIAL e trialFim > agora  → LIBERADO
    - status = ATIVA e (validaAte é null ou validaAte > agora) → LIBERADO
    - caso contrário → PLANO_EXPIRADO
- Se modulo = DOCUMENTOS:
    - status = ATIVA e (validaAte é null ou validaAte > agora) → LIBERADO
    - caso contrário → MODULO_NAO_CONTRATADO
```

- **Leitura nunca é bloqueada.** Listagens, detalhes e relatórios continuam acessíveis mesmo com
  plano expirado — é a premissa do produto ("depois de 2 meses, só visualização").
- **Toda Server Action de `criar`/`atualizar`/`excluir`** dos módulos núcleo chama
  `verificarAcesso` **antes** de checar permissão de papel e antes de tocar no Prisma. Se
  resultado ≠ `LIBERADO`, retornar `{ codigo: "PLANO_EXPIRADO" }` ou
  `{ codigo: "MODULO_NAO_CONTRATADO" }` — nunca lançar exceção genérica, o client usa esse código
  para decidir qual modal mostrar.
- No módulo `Documentos`, **toda ação de upload** passa pelo mesmo helper com `modulo:
  DOCUMENTOS`.
- Uma checagem "preguiçosa" (lazy) é suficiente: não precisa de cron — cada chamada ao helper já
  reavalia `trialFim`/`validaAte` contra `agora`. Se quiser, um job diário pode sincronizar
  `status` de `TRIAL` para `EXPIRADA` só para refletir melhor em relatórios administrativos, mas
  isso não é o que efetivamente bloqueia a escrita.

## Renovação (ver skill `gateway-abacatepay`)
Quando o webhook da AbacatePay confirma um pagamento: localizar a `Assinatura` pelo
`condominioId` + `modulo` (enviados como metadata na cobrança), marcar `status = ATIVA`,
`validaAte = agora + 30 dias`, e registrar o `Pagamento`.

## UI que depende dessas regras (ver `.agents/rules/ui-ux-e-componentes.md`)
- Card de status do plano na sidebar (dias restantes de trial, ou aviso de expirado).
- Modal de upgrade no lugar do modal de criação, quando `verificarAcesso` bloqueia.
- Alerta na página de Documentos quando o módulo não está contratado.
