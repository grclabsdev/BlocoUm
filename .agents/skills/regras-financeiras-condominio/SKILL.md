---
name: regras-financeiras-condominio
description: Cálculo de rateio de taxa condominial, geração de cobranças mensais, multa e juros por atraso, e indicador de inadimplência. Use sempre que a tarefa envolver lançamentos, cobranças, boletos, rateio, multa, juros ou inadimplência.
---

# Regras financeiras do condomínio

## Rateio da taxa condominial
1. Buscar todas as `Unidade` do condomínio e sua `fracaoIdeal`.
2. Definir a despesa/receita total esperada do mês (soma de `Lancamento` do tipo `DESPESA` da
   competência, ou um valor orçado configurado em `Condominio`).
3. Para cada unidade: `valorCobranca = totalMes * (fracaoIdeal / 100)`.
4. Se o condomínio estiver configurado para rateio igualitário: `valorCobranca = totalMes /
   quantidadeDeUnidades`.
5. Criar uma `Cobranca` por unidade com `status = PENDENTE`, `valorOriginal = valorAtual =
   valorCobranca`, `vencimento` = dia configurado do mês seguinte (ou do próprio mês, conforme
   regra do condomínio).
6. Nunca gerar duas cobranças para a mesma `unidadeId` + `competencia` — checar antes de criar
   (constraint única lógica, mesmo que não exista no banco).

## Multa e juros por atraso
Rotina a rodar diariamente (job/cron) ou sob demanda ao abrir a tela de cobranças:
```
para cada Cobranca com status = PENDENTE e vencimento < hoje:
  diasAtraso = hoje - vencimento (em dias)
  multa = valorOriginal * 0.02
  jurosDiario = valorOriginal * 0.01 / 30
  juros = jurosDiario * diasAtraso
  valorAtual = valorOriginal + multa + juros
  status = ATRASADO
```
- `valorOriginal` nunca muda.
- Ao registrar pagamento, gravar `pagoEm = agora`, `status = PAGO`, e manter `valorAtual` como o
  valor efetivamente cobrado (para conferência).
- Esses percentuais (2% multa / 1% a.m. juros) são o **padrão legal** usado no Brasil para
  condomínios (Código Civil, art. 1.336 §1º) — deixar configurável por condomínio, mas nunca
  hardcoded sem possibilidade de ajuste em `Configurações`.

## Indicador de inadimplência (para o dashboard)
```
totalEsperadoMes = soma(valorOriginal) de todas as Cobranca da competência atual
totalAtrasado    = soma(valorAtual) das Cobranca com status = ATRASADO na competência atual
inadimplencia%   = totalAtrasado / totalEsperadoMes * 100
```
Exibir com 1 casa decimal. Se `totalEsperadoMes = 0`, mostrar "sem dados" em vez de dividir por
zero.

## Relatório de prestação de contas (mínimo viável)
Para um intervalo de datas: listar `Lancamento` do tipo `RECEITA` e `DESPESA` agrupados por
`LancamentoCategoria`, com subtotal por categoria e saldo final (`totalReceitas -
totalDespesas`). Esse relatório é o que o síndico mais vai usar em assembleia — priorizar clareza
sobre densidade de dados.
