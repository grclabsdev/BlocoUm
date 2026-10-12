"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db/prisma";
import { requireAuthMembership } from "@/lib/auth/session";
import { podeAcao } from "@/lib/permissions";
import { areaComumSchema, reservaSchema } from "@/lib/validations/reservas";
import { formatDataHora } from "@/lib/formatters";
import { verificarAcesso } from "@/lib/billing/verificar-acesso";

export async function listarReservas(condominioId: string) {
  try {
    const { session, membership, moradorPerfil } = await requireAuthMembership(condominioId);
    if (!podeAcao(membership.papel, "reservas", "visualizar")) {
      return { success: false, error: "Permissão insuficiente para visualizar reservas." };
    }

    const [areas, reservas, unidades] = await Promise.all([
      prisma.areaComum.findMany({
        where: { condominioId },
        orderBy: { nome: "asc" },
      }),
      prisma.reserva.findMany({
        where: { areaComum: { condominioId } },
        include: {
          areaComum: true,
          unidade: { include: { bloco: true } },
        },
        orderBy: { inicio: "asc" },
      }),
      prisma.unidade.findMany({
        where: { condominioId },
        include: { bloco: true },
        orderBy: { identificador: "asc" },
      }),
    ]);

    return {
      success: true,
      data: {
        areas,
        reservas,
        unidades,
        papel: membership.papel,
        usuarioUnidadeId: moradorPerfil?.unidadeId ?? null,
        userId: session.user.id,
      },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao carregar reservas.";
    return { success: false, error: msg };
  }
}

export async function criarAreaComum(condominioId: string, input: unknown) {
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
    if (!podeAcao(membership.papel, "reservas", "criar")) {
      return { success: false, error: "Apenas síndico ou subsíndico podem cadastrar áreas comuns." };
    }

    const parsed = areaComumSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Dados inválidos." };
    }

    const area = await prisma.areaComum.create({
      data: {
        condominioId,
        nome: parsed.data.nome,
        antecedenciaMinHrs: parsed.data.antecedenciaMinHrs,
      },
    });

    revalidatePath(`/${condominioId}/reservas`);
    return { success: true, data: area };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao criar área comum.";
    return { success: false, error: msg };
  }
}

export async function criarReserva(condominioId: string, input: unknown) {
  try {
    const statusAcesso = await verificarAcesso(condominioId, "NUCLEO");
    if (statusAcesso !== "LIBERADO") {
      return {
        success: false,
        codigo: statusAcesso,
        error: "Período gratuito encerrado. Assine o plano para continuar.",
      };
    }

    const { session, membership, moradorPerfil } = await requireAuthMembership(condominioId);

    const parsed = reservaSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Dados de reserva inválidos." };
    }

    // Se for morador, só pode criar para a própria unidade
    let unidadeIdFinal = parsed.data.unidadeId;
    if (membership.papel === "MORADOR") {
      if (!moradorPerfil?.unidadeId) {
        return { success: false, error: "Seu usuário não possui uma unidade vinculada neste condomínio." };
      }
      unidadeIdFinal = moradorPerfil.unidadeId;
    }

    const area = await prisma.areaComum.findFirst({
      where: { id: parsed.data.areaComumId, condominioId },
    });
    if (!area) {
      return { success: false, error: "Área comum não encontrada." };
    }

    const inicio = new Date(parsed.data.inicio);
    const fim = new Date(parsed.data.fim);
    const agora = new Date();

    // Regra: Antecedência mínima
    const diffMs = inicio.getTime() - agora.getTime();
    const diffHoras = diffMs / (1000 * 60 * 60);

    if (diffHoras < area.antecedenciaMinHrs) {
      const horarioLiberado = new Date(agora.getTime() + area.antecedenciaMinHrs * 60 * 60 * 1000);
      return {
        success: false,
        error: `Esta área exige antecedência mínima de ${area.antecedenciaMinHrs} horas. Reservas só podem ser agendadas a partir de ${formatDataHora(horarioLiberado)}.`,
      };
    }

    // Regra: Checagem estrita de conflito de horários:
    // novoInicio < reserva.fim AND novoFim > reserva.inicio AND status = 'CONFIRMADA'
    const conflito = await prisma.reserva.findFirst({
      where: {
        areaComumId: area.id,
        status: "CONFIRMADA",
        inicio: { lt: fim },
        fim: { gt: inicio },
      },
      include: {
        unidade: true,
      },
    });

    if (conflito) {
      return {
        success: false,
        error: `Conflito de agenda: o espaço já está reservado das ${formatDataHora(conflito.inicio)} às ${formatDataHora(conflito.fim)} pela unidade ${conflito.unidade.identificador}. Escolha outro intervalo.`,
      };
    }

    const novaReserva = await prisma.reserva.create({
      data: {
        areaComumId: area.id,
        unidadeId: unidadeIdFinal,
        inicio,
        fim,
        status: "CONFIRMADA",
        criadoPor: session.user.id,
      },
    });

    revalidatePath(`/${condominioId}/reservas`);
    revalidatePath(`/${condominioId}/dashboard`);
    return { success: true, data: novaReserva };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao reservar área.";
    return { success: false, error: msg };
  }
}

export async function cancelarReserva(condominioId: string, reservaId: string) {
  try {
    const statusAcesso = await verificarAcesso(condominioId, "NUCLEO");
    if (statusAcesso !== "LIBERADO") {
      return {
        success: false,
        codigo: statusAcesso,
        error: "Período gratuito encerrado. Assine o plano para continuar.",
      };
    }

    const { session, membership, moradorPerfil } = await requireAuthMembership(condominioId);

    const reserva = await prisma.reserva.findFirst({
      where: { id: reservaId, areaComum: { condominioId } },
    });
    if (!reserva) {
      return { success: false, error: "Reserva não encontrada." };
    }

    const isSindico = ["SINDICO", "SUBSINDICO"].includes(membership.papel);
    const isAutorOuDono =
      reserva.criadoPor === session.user.id ||
      reserva.unidadeId === moradorPerfil?.unidadeId;

    if (!isSindico && !isAutorOuDono) {
      return { success: false, error: "Você só pode cancelar reservas criadas por sua unidade." };
    }

    // Cancelamento lógico obrigatório: status = 'CANCELADA', nunca deletar a linha
    const atualizada = await prisma.reserva.update({
      where: { id: reserva.id },
      data: { status: "CANCELADA" },
    });

    revalidatePath(`/${condominioId}/reservas`);
    revalidatePath(`/${condominioId}/dashboard`);
    return { success: true, data: atualizada };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao cancelar reserva.";
    return { success: false, error: msg };
  }
}
