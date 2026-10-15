"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db/prisma";
import { requireAuthMembership } from "@/lib/auth/session";
import { podeAcao } from "@/lib/permissions";
import { comunicadoSchema } from "@/lib/validations/comunicados";
import { verificarAcesso } from "@/lib/billing/verificar-acesso";

export async function listarComunicados(condominioId: string) {
  try {
    const { session, membership, moradorPerfil } = await requireAuthMembership(condominioId);
    if (!podeAcao(membership.papel, "comunicados", "visualizar")) {
      return { success: false, error: "Permissão insuficiente para ver comunicados." };
    }

    // Se morador, filtra comunicados gerais (blocoId = null) ou do seu próprio bloco
    const blocoIdUsuario = moradorPerfil?.unidade?.blocoId;
    const whereFiltro =
      membership.papel === "MORADOR" && blocoIdUsuario
        ? {
            condominioId,
            OR: [{ blocoId: null }, { blocoId: blocoIdUsuario }],
          }
        : { condominioId };

    const [comunicados, totalMoradores] = await Promise.all([
      prisma.comunicado.findMany({
        where: whereFiltro,
        include: {
          bloco: true,
          leituras: true,
        },
        orderBy: { publicadoEm: "desc" },
      }),
      prisma.moradorPerfil.count({
        where: { unidade: { condominioId } },
      }),
    ]);

    const formatados = comunicados.map((c) => {
      const lidoPorMim = c.leituras.some((l) => l.userId === session.user.id);
      const totalLeituras = c.leituras.length;
      const pctLeituras =
        totalMoradores > 0 ? Number(((totalLeituras / totalMoradores) * 100).toFixed(0)) : 0;

      return {
        id: c.id,
        titulo: c.titulo,
        corpo: c.corpo,
        blocoId: c.blocoId,
        blocoNome: c.bloco?.nome || "Todos os blocos",
        publicadoEm: c.publicadoEm,
        lidoPorMim,
        totalLeituras,
        pctLeituras,
      };
    });

    return {
      success: true,
      data: {
        comunicados: formatados,
        podeCriar: podeAcao(membership.papel, "comunicados", "criar"),
      },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao carregar comunicados.";
    return { success: false, error: msg };
  }
}

export async function criarComunicado(condominioId: string, input: unknown) {
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
    if (!podeAcao(membership.papel, "comunicados", "criar")) {
      return { success: false, error: "Apenas síndico ou subsíndico podem publicar comunicados." };
    }

    const parsed = comunicadoSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Dados inválidos." };
    }

    if (parsed.data.blocoId) {
      const bloco = await prisma.bloco.findFirst({
        where: { id: parsed.data.blocoId, condominioId },
      });
      if (!bloco) {
        return { success: false, error: "Bloco inválido para este condomínio." };
      }
    }

    const comunicado = await prisma.comunicado.create({
      data: {
        condominioId,
        titulo: parsed.data.titulo,
        corpo: parsed.data.corpo,
        blocoId: parsed.data.blocoId || null,
      },
    });

    revalidatePath(`/${condominioId}/comunicados`);
    revalidatePath(`/${condominioId}/dashboard`);
    return { success: true, data: comunicado };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao publicar comunicado.";
    return { success: false, error: msg };
  }
}

export async function confirmarLeituraComunicado(condominioId: string, comunicadoId: string) {
  try {
    const { session } = await requireAuthMembership(condominioId);

    const comunicado = await prisma.comunicado.findFirst({
      where: { id: comunicadoId, condominioId },
    });
    if (!comunicado) {
      return { success: false, error: "Comunicado não encontrado." };
    }

    await prisma.comunicadoLeitura.upsert({
      where: {
        comunicadoId_userId: {
          comunicadoId,
          userId: session.user.id,
        },
      },
      update: {},
      create: {
        comunicadoId,
        userId: session.user.id,
      },
    });

    revalidatePath(`/${condominioId}/comunicados`);
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao confirmar leitura.";
    return { success: false, error: msg };
  }
}
