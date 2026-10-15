"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db/prisma";
import { requireAuthMembership } from "@/lib/auth/session";
import { podeAcao } from "@/lib/permissions";
import { blocoSchema, unidadeSchema, moradorPerfilSchema } from "@/lib/validations/estrutural";
import { conviteSchema } from "@/lib/validations/auth";
import { verificarAcesso } from "@/lib/billing/verificar-acesso";
import crypto from "crypto";

export async function listarEstrutural(condominioId: string) {
  try {
    const { membership } = await requireAuthMembership(condominioId);
    if (!podeAcao(membership.papel, "estrutural", "visualizar")) {
      return { success: false, error: "Permissão insuficiente para visualizar estrutura." };
    }

    const [blocos, unidades, perfis, convites] = await Promise.all([
      prisma.bloco.findMany({
        where: { condominioId },
        orderBy: { nome: "asc" },
      }),
      prisma.unidade.findMany({
        where: { condominioId },
        include: {
          bloco: true,
          moradores: {
            include: {
              user: true,
            },
          },
        },
        orderBy: [{ bloco: { nome: "asc" } }, { identificador: "asc" }],
      }),
      prisma.moradorPerfil.findMany({
        where: { unidade: { condominioId } },
        include: {
          user: true,
          unidade: { include: { bloco: true } },
        },
      }),
      prisma.convite.findMany({
        where: { condominioId },
        include: { unidade: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const somaFracaoTotal = unidades.reduce(
      (acc, u) => acc + Number(u.fracaoIdeal),
      0
    );

    return {
      success: true,
      data: {
        blocos,
        unidades,
        perfis,
        convites,
        somaFracaoTotal: Number(somaFracaoTotal.toFixed(4)),
      },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao carregar estrutura.";
    return { success: false, error: msg };
  }
}

export async function criarBloco(condominioId: string, input: unknown) {
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
    if (!podeAcao(membership.papel, "estrutural", "criar")) {
      return { success: false, error: "Apenas síndico ou subsíndico podem cadastrar blocos." };
    }

    const parsed = blocoSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Dados inválidos." };
    }

    const bloco = await prisma.bloco.create({
      data: {
        condominioId,
        nome: parsed.data.nome,
      },
    });

    revalidatePath(`/${condominioId}/moradores`);
    return { success: true, data: bloco };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao criar bloco.";
    return { success: false, error: msg };
  }
}

export async function criarUnidade(condominioId: string, input: unknown) {
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
    if (!podeAcao(membership.papel, "estrutural", "criar")) {
      return { success: false, error: "Apenas síndico ou subsíndico podem cadastrar unidades." };
    }

    const parsed = unidadeSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Dados inválidos." };
    }

    // Regra de negócio obrigatória: Soma de frações ideais <= 100%
    const unidadesExistentes = await prisma.unidade.findMany({
      where: { condominioId },
      select: { fracaoIdeal: true },
    });

    const somaAtual = unidadesExistentes.reduce(
      (acc, u) => acc + Number(u.fracaoIdeal),
      0
    );

    const novaSoma = somaAtual + parsed.data.fracaoIdeal;
    // Permite pequena margem de arredondamento de float (100.001)
    if (novaSoma > 100.001) {
      return {
        success: false,
        error: `A soma das frações ideais ultrapassaria 100% (atual: ${somaAtual.toFixed(2)}%, nova: ${novaSoma.toFixed(2)}%). Ajuste os percentuais.`,
      };
    }

    const unidade = await prisma.unidade.create({
      data: {
        condominioId,
        blocoId: parsed.data.blocoId || null,
        identificador: parsed.data.identificador,
        fracaoIdeal: parsed.data.fracaoIdeal,
      },
    });

    revalidatePath(`/${condominioId}/moradores`);
    return { success: true, data: unidade };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao criar unidade.";
    return { success: false, error: msg };
  }
}

export async function convidarMorador(condominioId: string, input: unknown) {
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
    if (!podeAcao(membership.papel, "estrutural", "criar")) {
      return { success: false, error: "Apenas síndico ou subsíndico podem convidar moradores." };
    }

    const parsed = conviteSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Dados inválidos." };
    }

    // Verifica se unidade pertence a este condominioId
    const unidade = await prisma.unidade.findFirst({
      where: { id: parsed.data.unidadeId, condominioId },
    });
    if (!unidade) {
      return { success: false, error: "Unidade não encontrada neste condomínio." };
    }

    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 dias

    const convite = await prisma.convite.create({
      data: {
        condominioId,
        unidadeId: parsed.data.unidadeId,
        email: parsed.data.email.toLowerCase().trim(),
        tipoOcupacao: parsed.data.tipoOcupacao,
        token,
        expiresAt,
      },
      include: {
        unidade: true,
      },
    });

    revalidatePath(`/${condominioId}/moradores`);
    return {
      success: true,
      data: {
        ...convite,
        inviteUrl: `/convite/${token}`,
      },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao gerar convite.";
    return { success: false, error: msg };
  }
}
