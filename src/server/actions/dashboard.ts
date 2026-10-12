"use server";

import prisma, { StatusCobranca, TipoLancamento } from "@/lib/db/prisma";
import { requireAuthMembership } from "@/lib/auth/session";
import { atualizarEncargosAtraso } from "./financeiro";

export async function obterDadosDashboard(condominioId: string) {
  try {
    const { session, membership, moradorPerfil } = await requireAuthMembership(condominioId);

    // Atualiza encargos
    await atualizarEncargosAtraso(condominioId);

    const agora = new Date();
    const competenciaAtual = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), 1));

    // 1. Saldo Geral (todas as receitas - todas as despesas)
    const [receitasAgg, despesasAgg] = await Promise.all([
      prisma.lancamento.aggregate({
        where: { condominioId, tipo: TipoLancamento.RECEITA },
        _sum: { valor: true },
      }),
      prisma.lancamento.aggregate({
        where: { condominioId, tipo: TipoLancamento.DESPESA },
        _sum: { valor: true },
      }),
    ]);

    const totalReceitas = Number(receitasAgg._sum.valor ?? 0);
    const totalDespesas = Number(despesasAgg._sum.valor ?? 0);
    const saldoAtual = totalReceitas - totalDespesas;

    // 2. Inadimplência do mês atual
    const cobrancasMes = await prisma.cobranca.findMany({
      where: {
        unidade: { condominioId },
        competencia: competenciaAtual,
      },
    });

    let totalEsperado = 0;
    let totalAtrasado = 0;
    let totalPago = 0;

    cobrancasMes.forEach((c) => {
      totalEsperado += Number(c.valorOriginal);
      if (c.status === StatusCobranca.ATRASADO) {
        totalAtrasado += Number(c.valorAtual);
      } else if (c.status === StatusCobranca.PAGO) {
        totalPago += Number(c.valorAtual);
      }
    });

    const inadimplenciaPct = totalEsperado > 0 ? (totalAtrasado / totalEsperado) * 100 : 0;

    // 3. Gráfico dos últimos 6 meses (Receitas vs Despesas)
    const mesesGrafico: Array<{ mes: string; receitas: number; despesas: number }> = [];
    const nomesMeses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    for (let i = 5; i >= 0; i--) {
      const dataInicioMes = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth() - i, 1));
      const dataFimMes = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth() - i + 1, 0, 23, 59, 59));

      const [r, d] = await Promise.all([
        prisma.lancamento.aggregate({
          where: {
            condominioId,
            tipo: TipoLancamento.RECEITA,
            data: { gte: dataInicioMes, lte: dataFimMes },
          },
          _sum: { valor: true },
        }),
        prisma.lancamento.aggregate({
          where: {
            condominioId,
            tipo: TipoLancamento.DESPESA,
            data: { gte: dataInicioMes, lte: dataFimMes },
          },
          _sum: { valor: true },
        }),
      ]);

      const rotuloMes = `${nomesMeses[dataInicioMes.getUTCMonth()]}/${String(dataInicioMes.getUTCFullYear()).slice(2)}`;
      mesesGrafico.push({
        mes: rotuloMes,
        receitas: Number(r._sum.valor ?? 0),
        despesas: Number(d._sum.valor ?? 0),
      });
    }

    // 4. Últimos comunicados
    const ultimosComunicados = await prisma.comunicado.findMany({
      where: { condominioId },
      include: { bloco: true },
      orderBy: { publicadoEm: "desc" },
      take: 3,
    });

    // 5. Próximas reservas confirmadas
    const proximasReservas = await prisma.reserva.findMany({
      where: {
        areaComum: { condominioId },
        status: "CONFIRMADA",
        inicio: { gte: agora },
      },
      include: {
        areaComum: true,
        unidade: true,
      },
      orderBy: { inicio: "asc" },
      take: 3,
    });

    // 6. Dados específicos se for Morador
    let minhaCobrancaMes = null;
    if (membership.papel === "MORADOR" && moradorPerfil?.unidadeId) {
      minhaCobrancaMes = await prisma.cobranca.findFirst({
        where: {
          unidadeId: moradorPerfil.unidadeId,
          competencia: competenciaAtual,
        },
      });
    }

    return {
      success: true,
      data: {
        saldoAtual,
        totalReceitas,
        totalDespesas,
        inadimplenciaPct: Number(inadimplenciaPct.toFixed(1)),
        totalEsperado,
        totalAtrasado,
        totalPago,
        grafico6Meses: mesesGrafico,
        ultimosComunicados,
        proximasReservas,
        papel: membership.papel,
        minhaCobrancaMes: minhaCobrancaMes
          ? {
              ...minhaCobrancaMes,
              valorOriginal: Number(minhaCobrancaMes.valorOriginal),
              valorAtual: Number(minhaCobrancaMes.valorAtual),
            }
          : null,
      },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao carregar dashboard.";
    return { success: false, error: msg };
  }
}
