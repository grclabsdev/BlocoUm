---
name: gateway-abacatepay
description: Como integrar o gateway de pagamento AbacatePay (PIX, boleto e link de pagamento) para cobrar o plano base e o módulo de Documentos deste projeto — criação de cobrança, checkout transparente e webhook. Use sempre que for implementar checkout, renovação de assinatura ou o handler de webhook de pagamento.
---

# Gateway de pagamento: AbacatePay

Documentação oficial (checar antes de implementar — a API está evoluindo rápido, com uma v2 em
beta trazendo cartão/boleto/assinatura nativa; o que está aqui é o suficiente para o v1 estável):
https://docs.abacatepay.com · resumo para IA: https://www.abacatepay.com/llms.txt

## Decisão de produto deste projeto
Métodos habilitados: **PIX, Boleto e Link de Pagamento.** Não habilitar cartão de crédito nos
checkouts deste projeto.

## Por que não usamos "assinatura" nativa do gateway
A funcionalidade de assinatura recorrente da AbacatePay não está estável/disponível de forma
confiável no momento. Por isso, **quem controla se uma assinatura está ativa é o nosso banco**
(model `Assinatura` em `assinaturas-e-pagamento-por-modulo.md`), e a cobrança em si é feita via:
- **Link de Pagamento reutilizável** (`POST /payment-links/create`) — criado uma única vez por
  plano/módulo, o síndico paga esse mesmo link todo mês; ou
- **Checkout Transparente** (`POST /transparents/create`) — gera um PIX novo (QR + copia-e-cola)
  a cada cobrança, direto dentro do modal de upgrade, sem sair do app.

A confirmação de pagamento chega sempre via **webhook** — nunca fazer polling de status.

## Fatos da API (v1)
- Base URL: `https://api.abacatepay.com/v1` (conferir versão atual na doc — pode já estar em v2
  para contas novas).
- Autenticação: header `Authorization: Bearer <ABACATEPAY_API_KEY>`.
- Valores monetários sempre em **centavos** (ex.: `10000` = R$ 100,00).
- Resposta sempre no envelope `{ "data": {...}, "success": true, "error": null }`.
- `metadata` pode ser enviado em quase todo recurso de cobrança — usar para carregar
  `condominioId` e `modulo` (`NUCLEO` ou `DOCUMENTOS`), assim o webhook sabe o que liberar.

## Variáveis de ambiente
```
ABACATEPAY_API_KEY=...
ABACATEPAY_WEBHOOK_SECRET=...
```
Nunca expor `ABACATEPAY_API_KEY` no client — toda chamada à AbacatePay acontece em Server
Action/Route Handler.

## Fluxo 1 — Link de Pagamento reutilizável (cobrança mensal manual)
1. Uma única vez (ao cadastrar o `Plano` no admin), criar o link:
   `POST /payment-links/create` com `items` referenciando o produto do plano (criar o produto
   antes via `POST /products/create`, com `price` em centavos e `externalId` = id do `Plano` no
   nosso banco).
2. Guardar a `url` retornada em `Plano.abacatePayLinkId`.
3. O `UpgradeModal` (ver rule de UI) mostra um botão "Assinar agora" que abre essa URL em nova
   aba. O síndico paga; a confirmação chega pelo webhook.

## Fluxo 2 — Checkout Transparente (PIX na hora, sem sair do modal)
1. Server Action `criarCobrancaPix(condominioId, modulo)`:
   - Buscar o `Plano` ativo do módulo, montar `amount` em centavos.
   - `POST /transparents/create` com `data.amount`, `data.description`, `data.metadata: {
     condominioId, modulo }`.
   - Retornar `brCode` (copia-e-cola) e `brCodeBase64` (imagem do QR) para o client.
2. O `UpgradeModal` renderiza o QR Code e o copia-e-cola, com um texto "assim que o pagamento for
   confirmado, o acesso libera automaticamente" (o webhook cuida disso — não precisa de botão
   "já paguei").

## Webhook — obrigatório
1. Registrar uma vez: `POST /webhooks/create` com `endpoint` (HTTPS público, ex.:
   `https://SEU_DOMINIO/api/webhooks/abacatepay`), `secret` (mesmo valor de
   `ABACATEPAY_WEBHOOK_SECRET`), `events`: no mínimo `checkout.completed` e
   `transparent.completed`.
2. Implementar `src/app/api/webhooks/abacatepay/route.ts`:
   - Validar a assinatura HMAC do payload usando o `secret` — rejeitar (400) se inválida.
   - Ler `metadata.condominioId` e `metadata.modulo` do evento.
   - **Idempotência**: checar se já existe `Pagamento` com essa `referenciaExterna` antes de
     criar outro — o mesmo evento pode chegar mais de uma vez.
   - Buscar `Assinatura` por `condominioId` + `modulo`, atualizar `status = ATIVA`,
     `validaAte = agora + 30 dias`.
   - Criar o `Pagamento` com `status = PAGO`, `pagoEm = agora`.
   - Responder `200` rápido (o processamento pesado, se houver, deve ser assíncrono).

## Erros comuns a evitar
- Fazer polling do status do pagamento em vez de depender do webhook.
- Confiar em algo que o client mandou dizendo "já paguei" — a única fonte de verdade é o webhook
  validado por assinatura.
- Esquecer o `metadata` na criação da cobrança — sem ele o webhook não sabe qual `Assinatura`
  atualizar.
- Tratar valor em reais em vez de centavos ao chamar a API (a AbacatePay espera centavos).
