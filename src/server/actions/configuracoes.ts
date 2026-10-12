"use server";

import { revalidatePath } from "next/cache";
import prisma, { PapelUsuario } from "@/lib/db/prisma";
import { requireAuthMembership } from "@/lib/auth/session";
import { podeAcao } from "@/lib/permissions";
import {
  condominioConfigSchema,
  membershipPapelSchema,
} from "@/lib/validations/configuracoes";
import { verificarAcesso } from "@/lib/billing/verificar-acesso";

export async function obterConfiguracoes(condominioId: string) {
  try {
    const { membership } = await requireAuthMembership(condominioId);
    if (!podeAcao(membership.papel, "configuracoes", "visualizar")) {
      return { success: false, error: "Permissão insuficiente para ver configurações." };
    }

    const [condominio, memberships] = await Promise.all([
      prisma.condominio.findUniqueOrThrow({
        where: { id: condominioId },
      }),
      prisma.membership.findMany({
        where: { condominioId },
        include: {
          user: true,
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    return {
      success: true,
      data: {
        condominio: {
          ...condominio,
          multaAtrasoPct: Number(condominio.multaAtrasoPct),
          jurosMesPct: Number(condominio.jurosMesPct),
        },
        memberships,
        papelUsuarioLogado: membership.papel,
      },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao carregar configurações.";
    return { success: false, error: msg };
  }
}

export async function salvarParametrosCondominio(condominioId: string, input: unknown) {
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
    if (!podeAcao(membership.papel, "configuracoes", "editar")) {
      return { success: false, error: "Permissão insuficiente para alterar configurações." };
    }

    const parsed = condominioConfigSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Dados inválidos." };
    }

    const atualizado = await prisma.condominio.update({
      where: { id: condominioId },
      data: {
        nome: parsed.data.nome,
        cnpj: parsed.data.cnpj || null,
        endereco: parsed.data.endereco,
        rateioTipo: parsed.data.rateioTipo,
        diaVencimento: parsed.data.diaVencimento,
        multaAtrasoPct: parsed.data.multaAtrasoPct,
        jurosMesPct: parsed.data.jurosMesPct,
      },
    });

    revalidatePath(`/${condominioId}/configuracoes`);
    return { success: true, data: atualizado };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao salvar configurações.";
    return { success: false, error: msg };
  }
}

export async function alterarPapelMembro(condominioId: string, input: unknown) {
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
    if (membership.papel !== PapelUsuario.SINDICO && membership.papel !== PapelUsuario.SUBSINDICO) {
      return { success: false, error: "Apenas síndico ou subsíndico podem alterar papéis." };
    }

    const parsed = membershipPapelSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Dados inválidos." };
    }

    // Regra: Subsíndico não pode promover ou rebaixar um Síndico
    const alvo = await prisma.membership.findFirst({
      where: { id: parsed.data.membershipId, condominioId },
    });
    if (!alvo) {
      return { success: false, error: "Membro não encontrado neste condomínio." };
    }

    if (membership.papel === PapelUsuario.SUBSINDICO) {
      if (alvo.papel === PapelUsuario.SINDICO || parsed.data.papel === PapelUsuario.SINDICO) {
        return { success: false, error: "Subsíndico não possui permissão para alterar o papel de síndico." };
      }
    }

    const atualizado = await prisma.membership.update({
      where: { id: alvo.id },
      data: {
        papel: parsed.data.papel as PapelUsuario,
        ativo: parsed.data.ativo,
      },
    });

    revalidatePath(`/${condominioId}/configuracoes`);
    return { success: true, data: atualizado };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao alterar papel do membro.";
    return { success: false, error: msg };
  }
}
