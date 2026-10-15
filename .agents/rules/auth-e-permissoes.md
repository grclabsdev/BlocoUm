---
trigger: always_on
description: Papéis de usuário, matriz de permissões e configuração do Better Auth. Sempre aplicar.
---

# Autenticação e permissões

## Multi-tenant
Um mesmo usuário (linha em `user` do Better Auth) pode ter `Membership` em mais de um
`Condominio` (ex: síndico profissional que administra vários prédios). Toda sessão logada precisa
resolver "qual condomínio estou vendo agora" — isso vem da rota `(app)/[condominioId]` e é
validado no servidor a cada request, nunca só confiado do client.

## Papéis (`PapelUsuario`)
| Papel        | Descrição                                                            |
|--------------|-----------------------------------------------------------------------|
| SINDICO      | Acesso total ao condomínio: financeiro, cadastros, aprovações.        |
| SUBSINDICO   | Mesmo acesso do síndico, exceto configurações sensíveis (ex: trocar síndico, dados fiscais). |
| CONSELHEIRO  | Leitura de tudo (inclusive financeiro e documentos do conselho); não edita nem exclui. |
| MORADOR      | Vê e edita apenas o que é da própria unidade; cria ocorrências e reservas; lê comunicados e documentos públicos. |
| FUNCIONARIO  | Acesso operacional: ocorrências (ver/atualizar status/comentar), comunicados (ler), sem acesso a financeiro. |

## Matriz de permissões por módulo
`V` = visualizar · `C` = criar · `E` = editar · `X` = excluir/cancelar · `-` = sem acesso

| Módulo                     | SINDICO   | SUBSINDICO | CONSELHEIRO | MORADOR                | FUNCIONARIO |
|-----------------------------|-----------|------------|-------------|-------------------------|--------------|
| Lançamentos financeiros     | V C E X   | V C E X    | V           | -                        | -            |
| Cobranças (marcar pago)     | V C E X   | V C E X    | V           | V (só a própria unidade) | -            |
| Moradores/Unidades          | V C E X   | V C E X    | V           | V (só a própria unidade) | -            |
| Comunicados                 | V C E X   | V C E X    | V           | V                        | V            |
| Reservas                    | V C E X   | V C E X    | V           | V C (própria unidade), X (própria reserva) | V |
| Ocorrências                 | V C E X   | V C E X    | V           | V C (próprias), comenta  | V (atualiza status/comenta) |
| Documentos                  | V C E X   | V C E X    | V           | V (visibilidade TODOS)   | V (visibilidade TODOS) |
| Configurações do condomínio | V C E X   | V (sem trocar síndico) | V | -                    | -            |

**Toda Server Action precisa checar essa matriz antes de executar** — usar um helper central em
`src/lib/permissions/` (ex: `podeAcao(papel, modulo, acao)`) em vez de repetir `if`s espalhados.

## Better Auth — configuração esperada
- Provedor de credenciais (email/senha) habilitado.
- Fluxo de convite: síndico convida um e-mail para uma `Unidade` com um `TipoOcupacao`; o
  convidado recebe link, define senha, e um `Membership` com papel `MORADOR` é criado
  automaticamente vinculado ao `Condominio` da unidade.
- Sessão via cookie httpOnly, renovação automática, expiração configurável.
- Middleware do Next.js (ou verificação em layout de servidor) bloqueia acesso a
  `(app)/[condominioId]/**` se não houver sessão válida **e** `Membership.ativo = true` para
  aquele `condominioId`.
- Nunca guardar papel/permissão só no client (ex: não confiar em algo salvo no localStorage) — a
  fonte de verdade é sempre a consulta ao `Membership` no servidor.
