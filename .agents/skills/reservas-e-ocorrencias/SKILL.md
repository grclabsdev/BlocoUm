---
name: reservas-e-ocorrencias
description: Regras de conflito de agenda para reservas de áreas comuns e o fluxo de status de ocorrências/chamados. Use sempre que a tarefa envolver reservas, calendário de áreas comuns, chamados, manutenção ou ocorrências.
---

# Reservas de área comum

## Checagem de conflito
Antes de criar uma `Reserva`, buscar todas as reservas `CONFIRMADA` da mesma `AreaComum` cujo
intervalo `[inicio, fim)` sobreponha o novo intervalo pedido:
```
conflito = existe reserva onde
  reserva.status = 'CONFIRMADA' AND
  novoInicio < reserva.fim AND novoFim > reserva.inicio
```
Se houver conflito, bloquear a criação e mostrar os horários já ocupados naquele dia (não só
"horário indisponível" — mostrar o que está livre).

## Antecedência mínima
Rejeitar reserva se `inicio - agora < antecedenciaMinHrs` da `AreaComum`. Mostrar a partir de que
horário a reserva já pode ser feita.

## Cancelamento
Só o morador que criou a reserva (mesma `unidadeId`) ou um usuário com papel `SINDICO`/
`SUBSINDICO` pode cancelar. Cancelar = `status = 'CANCELADA'`, nunca apagar a linha (mantém
histórico).

---

# Ocorrências / chamados

## Fluxo de status
```
ABERTA ──► EM_ANDAMENTO ──► RESOLVIDA
   │             │
   └────────► CANCELADA
```
- Não permitir transição direta `ABERTA → RESOLVIDA` na UI — forçar passar por `EM_ANDAMENTO`
  (ajuda a garantir que alguém de fato assumiu o chamado).
- `CANCELADA` é possível a partir de `ABERTA` ou `EM_ANDAMENTO`, mas exigir um motivo (campo de
  texto) ao cancelar.
- Ao mudar de status, registrar automaticamente um comentário do sistema
  (`OcorrenciaComentario` com `autorId` do usuário que fez a mudança) descrevendo a transição,
  para manter histórico auditável.

## Permissões de interação
- Morador: cria ocorrências vinculadas à própria unidade, comenta nas próprias, não muda status.
- Síndico/Subsíndico/Funcionário: veem todas as ocorrências do condomínio, podem comentar, mudar
  status e se auto-atribuir (`atribuidoA`).

## Priorização na listagem
Ordenar por padrão: `ABERTA` e `EM_ANDAMENTO` primeiro (mais antigas no topo), `RESOLVIDA` e
`CANCELADA` depois (mais recentes no topo) — reflete o que o síndico precisa agir primeiro.
