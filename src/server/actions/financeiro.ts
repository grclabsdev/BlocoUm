"use server";

import { revalidatePath } from "next/cache";
import prisma, { StatusCobranca, TipoLancamento } from "@/lib/db/prisma";
import { requireAuthMembership } from "@/lib/auth/session";
import { podeAcao } from "@/lib/permissions";
import {
  lancamentoCategoriaSchema,
  lancamentoSchema,
  gerarCobrancasMesSchema,
  marcarPagamentoSchema,
} from "@/lib/validations/financeiro";
import { verificarAcesso } from "@/lib/billing/verificar-acesso";

// Atualiza cobranças vencidas aplicando multa de 2% e juros de 1% a.m. pro rata die
export async function atualizarEncargosAtraso(condominioId: string) {
  const agora = new Date();
  const condominio = await prisma.condominio.findUnique({
    where: { id: condominioId },
    select: { multaAtrasoPct: true, jurosMesPct: true },
  });

  const multaPct = Number(condominio?.multaAtrasoPct ?? 2.0) / 100;
  const jurosDiaPct = (Number(condominio?.jurosMesPct ?? 1.0) / 100) / 30;

  // Busca cobranças pendentes ou já atrasadas mas não pagas
  const cobrancas = await prisma.cobranca.findMany({
    where: {
      unidade: { condominioId },
      status: { in: [StatusCobranca.PENDENTE, StatusCobranca.ATRASADO] },
      vencimento: { lt: agora },
    },
  });

  for (const c of cobrancas) {
    const diffTime = agora.getTime() - new Date(c.vencimento).getTime();
    const diasAtraso = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    const original = Number(c.valorOriginal);

    const valorMulta = original * multaPct;
    const valorJuros = original * jurosDiaPct * diasAtraso;
    const novoValorAtual = Number((original + valorMulta + valorJuros).toFixed(2));

    await prisma.cobranca.update({
      where: { id: c.id },
      data: {
        status: StatusCobranca.ATRASADO,
        valorAtual: novoValorAtual,
      },
    });
  }
}

export async function listarFinanceiro(condominioId: string, mesReferencia?: string) {
  try {
    const { membership, moradorPerfil } = await requireAuthMembership(condominioId);
    
    // Atualiza encargos dinamicamente antes de exibir
    await atualizarEncargosAtraso(condominioId);

    const isSindicoOuConselho = ["SINDICO", "SUBSINDICO", "CONSELHEIRO"].includes(membership.papel);
    const isMorador = membership.papel === "MORADOR";

    if (!isSindicoOuConselho && !isMorador) {
      return { success: false, error: "Acesso financeiro não permitido para seu perfil." };
    }

    // Se for morador, restringe para apenas as cobranças da própria unidade
    const cobrancasFiltro = isMorador
      ? { unidadeId: moradorPerfil?.unidadeId ?? "__none__" }
      : { unidade: { condominioId } };

    const [categorias, cobrancas, lancamentos] = await Promise.all([
      isSindicoOuConselho
        ? prisma.lancamentoCategoria.findMany({
            where: { condominioId },
            orderBy: { nome: "asc" },
          })
        : Promise.resolve([]),
      prisma.cobranca.findMany({
        where: cobrancasFiltro,
        include: {
          unidade: {
            include: { bloco: true },
          },
        },
        orderBy: [{ competencia: "desc" }, { unidade: { identificador: "asc" } }],
      }),
      isSindicoOuConselho
        ? prisma.lancamento.findMany({
            where: { condominioId },
            include: { categoria: true },
            orderBy: { data: "desc" },
            take: 50,
          })
        : Promise.resolve([]),
    ]);

    // Resumo de inadimplência da competência mais recente
    let totalEsperadoMes = 0;
    let totalAtrasado = 0;
    let totalRecebidoMes = 0;

    const agora = new Date();
    const competenciaAtual = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), 1));

    cobrancas.forEach((c) => {
      if (new Date(c.competencia).getTime() === competenciaAtual.getTime()) {
        totalEsperadoMes += Number(c.valorOriginal);
        if (c.status === StatusCobranca.ATRASADO) {
          totalAtrasado += Number(c.valorAtual);
        } else if (c.status === StatusCobranca.PAGO) {
          totalRecebidoMes += Number(c.valorAtual);
        }
      }
    });

    const inadimplenciaPct = totalEsperadoMes > 0 ? (totalAtrasado / totalEsperadoMes) * 100 : 0;

    return {
      success: true,
      data: {
        categorias,
        cobrancas,
        lancamentos,
        resumo: {
          totalEsperadoMes,
          totalAtrasado,
          totalRecebidoMes,
          inadimplenciaPct: Number(inadimplenciaPct.toFixed(1)),
        },
        papel: membership.papel,
      },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao carregar dados financeiros.";
    return { success: false, error: msg };
  }
}

export async function criarCategoriaLancamento(condominioId: string, input: unknown) {
  try {
    const statusAcesso = await verificarAcesso(condominioId, "NUCLEO");
    if (statusAcesso !== "LIBERADO") {
      return {
        success: false,
        codigo: statusAcesso,
        error: "Período gratuito encerrado. Assine o plano para continuar.",
      };
    }

    const { membership } = await requireAuthMembership(condominioId);
    if (!podeAcao(membership.papel, "lancamentos", "criar")) {
      return { success: false, error: "Permissão insuficiente para criar categoria." };
    }

    const parsed = lancamentoCategoriaSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Dados inválidos." };
    }

    const categoria = await prisma.lancamentoCategoria.create({
      data: {
        condominioId,
        nome: parsed.data.nome,
        tipo: parsed.data.tipo as TipoLancamento,
      },
    });

    revalidatePath(`/${condominioId}/lancamentos`);
    return { success: true, data: categoria };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao criar categoria.";
    return { success: false, error: msg };
  }
}

export async function criarLancamento(condominioId: string, input: unknown) {
  try {
    const statusAcesso = await verificarAcesso(condominioId, "NUCLEO");
    if (statusAcesso !== "LIBERADO") {
      return {
        success: false,
        codigo: statusAcesso,
        error: "Período gratuito encerrado. Assine o plano para continuar.",
      };
    }

    const { membership } = await requireAuthMembership(condominioId);
    if (!podeAcao(membership.papel, "lancamentos", "criar")) {
      return { success: false, error: "Permissão insuficiente para criar lançamento." };
    }

    const parsed = lancamentoSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Dados inválidos." };
    }

    // Verifica se a categoria pertence ao condomínio
    const cat = await prisma.lancamentoCategoria.findFirst({
      where: { id: parsed.data.categoriaId, condominioId },
    });
    if (!cat) {
      return { success: false, error: "Categoria financeira inválida para este condomínio." };
    }

    const lancamento = await prisma.lancamento.create({
      data: {
        condominioId,
        categoriaId: parsed.data.categoriaId,
        tipo: parsed.data.tipo as TipoLancamento,
        descricao: parsed.data.descricao,
        valor: parsed.data.valor,
        data: new Date(parsed.data.data),
      },
    });

    revalidatePath(`/${condominioId}/lancamentos`);
    revalidatePath(`/${condominioId}/dashboard`);
    return { success: true, data: lancamento };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao criar lançamento.";
    return { success: false, error: msg };
  }
}

// Geração de cobranças mensais rateadas conforme regras-financeiras-condominio
export async function gerarCobrancasMes(condominioId: string, input: unknown) {
  try {
    const statusAcesso = await verificarAcesso(condominioId, "NUCLEO");
    if (statusAcesso !== "LIBERADO") {
      return {
        success: false,
        codigo: statusAcesso,
        error: "Período gratuito encerrado. Assine o plano para continuar.",
      };
    }

    const { membership } = await requireAuthMembership(condominioId);
    if (!podeAcao(membership.papel, "cobrancas", "criar")) {
      return { success: false, error: "Apenas síndico e subsíndico podem gerar cobranças." };
    }

    const parsed = gerarCobrancasMesSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Dados inválidos." };
    }

    const [anoStr, mesStr] = parsed.data.competencia.split("-");
    const ano = parseInt(anoStr, 10);
    const mes = parseInt(mesStr, 10);
    const dataCompetencia = new Date(Date.UTC(ano, mes - 1, 1));
    const dataVencimento = new Date(Date.UTC(ano, mes - 1, parsed.data.diaVencimento));

    const [condominio, unidades] = await Promise.all([
      prisma.condominio.findUniqueOrThrow({ where: { id: condominioId } }),
      prisma.unidade.findMany({ where: { condominioId } }),
    ]);

    if (unidades.length === 0) {
      return { success: false, error: "Nenhuma unidade cadastrada para receber cobrança." };
    }

    // Verifica se já existem cobranças geradas para esta competência
    const existentes = await prisma.cobranca.findMany({
      where: {
        unidadeId: { in: unidades.map((u) => u.id) },
        competencia: dataCompetencia,
      },
    });

    if (existentes.length > 0) {
      return {
        success: false,
        error: `Já foram geradas cobranças para a competência ${mes}/${ano}. Não é permitido duplicar.`,
      };
    }

    const isIgualitario = condominio.rateioTipo === "IGUALITARIO";
    const totalRateio = parsed.data.valorTotalRateio;

    const novasCobrancas = [];
    for (const u of unidades) {
      let valorUnidade = 0;
      if (isIgualitario) {
        valorUnidade = Number((totalRateio / unidades.length).toFixed(2));
      } else {
        valorUnidade = Number((totalRateio * (Number(u.fracaoIdeal) / 100)).toFixed(2));
      }

      novasCobrancas.push({
        unidadeId: u.id,
        competencia: dataCompetencia,
        vencimento: dataVencimento,
        valorOriginal: valorUnidade,
        valorAtual: valorUnidade,
        status: StatusCobranca.PENDENTE,
      });
    }

    await prisma.cobranca.createMany({
      data: novasCobrancas,
    });

    revalidatePath(`/${condominioId}/lancamentos`);
    revalidatePath(`/${condominioId}/dashboard`);
    return {
      success: true,
      data: { geradas: novasCobrancas.length, competencia: parsed.data.competencia },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao gerar cobranças.";
    return { success: false, error: msg };
  }
}

// Marcação de pagamento
export async function registrarPagamentoCobranca(condominioId: string, input: unknown) {
  try {
    const statusAcesso = await verificarAcesso(condominioId, "NUCLEO");
    if (statusAcesso !== "LIBERADO") {
      return {
        success: false,
        codigo: statusAcesso,
        error: "Período gratuito encerrado. Assine o plano para continuar.",
      };
    }

    const { membership } = await requireAuthMembership(condominioId);
    if (!podeAcao(membership.papel, "cobrancas", "editar")) {
      return { success: false, error: "Permissão insuficiente para dar baixa em cobrança." };
    }

    const parsed = marcarPagamentoSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Dados inválidos." };
    }

    const cobranca = await prisma.cobranca.findFirst({
      where: {
        id: parsed.data.cobrancaId,
        unidade: { condominioId },
      },
    });

    if (!cobranca) {
      return { success: false, error: "Cobrança não encontrada." };
    }

    if (cobranca.status === StatusCobranca.PAGO) {
      return { success: false, error: "Esta cobrança já está marcada como paga." };
    }

    const atualizada = await prisma.cobranca.update({
      where: { id: cobranca.id },
      data: {
        status: StatusCobranca.PAGO,
        pagoEm: parsed.data.pagoEm ? new Date(parsed.data.pagoEm) : new Date(),
      },
    });

    revalidatePath(`/${condominioId}/lancamentos`);
    revalidatePath(`/${condominioId}/dashboard`);
    return { success: true, data: atualizada };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao registrar pagamento.";
    return { success: false, error: msg };
  }
}

// Prestação de contas por período
export async function obterPrestacaoContas(
  condominioId: string,
  dataInicio: string,
  dataFim: string
) {
  try {
    const { membership } = await requireAuthMembership(condominioId);
    if (!podeAcao(membership.papel, "lancamentos", "visualizar")) {
      return { success: false, error: "Permissão insuficiente para ver prestação de contas." };
    }

    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);

    const lancamentos = await prisma.lancamento.findMany({
      where: {
        condominioId,
        data: { gte: inicio, lte: fim },
      },
      include: { categoria: true },
      orderBy: { data: "asc" },
    });

    const categoriasMap = new Map<string, { nome: string; tipo: string; total: number; itens: typeof lancamentos }>();

    let totalReceitas = 0;
    let totalDespesas = 0;

    lancamentos.forEach((l) => {
      const catId = l.categoriaId;
      const val = Number(l.valor);

      if (!categoriasMap.has(catId)) {
        categoriasMap.set(catId, {
          nome: l.categoria.nome,
          tipo: l.categoria.tipo,
          total: 0,
          itens: [],
        });
      }

      const cat = categoriasMap.get(catId)!;
      cat.total += val;
      cat.itens.push(l);

      if (l.tipo === TipoLancamento.RECEITA) {
        totalReceitas += val;
      } else {
        totalDespesas += val;
      }
    });

    return {
      success: true,
      data: {
        categorias: Array.from(categoriasMap.values()),
        totalReceitas,
        totalDespesas,
        saldoFinal: totalReceitas - totalDespesas,
      },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao gerar prestação de contas.";
    return { success: false, error: msg };
  }
}
