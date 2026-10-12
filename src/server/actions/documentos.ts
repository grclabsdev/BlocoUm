"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db/prisma";
import { requireAuthMembership } from "@/lib/auth/session";
import { podeAcao } from "@/lib/permissions";
import { documentoSchema } from "@/lib/validations/documentos";
import { verificarAcesso } from "@/lib/billing/verificar-acesso";

export async function listarDocumentos(condominioId: string) {
  try {
    const { membership } = await requireAuthMembership(condominioId);
    if (!podeAcao(membership.papel, "documentos", "visualizar")) {
      return { success: false, error: "Permissão insuficiente para visualizar documentos." };
    }

    const podeVerConselho = ["SINDICO", "SUBSINDICO", "CONSELHEIRO"].includes(membership.papel);
    const statusAcessoModulo = await verificarAcesso(condominioId, "DOCUMENTOS");

    const documentos = await prisma.documento.findMany({
      where: {
        condominioId,
        ...(podeVerConselho ? {} : { visivelPara: "TODOS" }),
      },
      orderBy: [{ categoria: "asc" }, { createdAt: "desc" }],
    });

    return {
      success: true,
      data: {
        documentos,
        podeGerenciar: podeAcao(membership.papel, "documentos", "criar"),
        papel: membership.papel,
        statusAcessoModulo,
      },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao carregar documentos.";
    return { success: false, error: msg };
  }
}

export async function criarDocumento(condominioId: string, input: unknown) {
  try {
    const statusAcesso = await verificarAcesso(condominioId, "DOCUMENTOS");
    if (statusAcesso !== "LIBERADO") {
      return {
        success: false,
        codigo: statusAcesso,
        error: "Módulo Documentos não contratado. Assine o módulo para realizar uploads.",
      };
    }

    const { membership } = await requireAuthMembership(condominioId);
    if (!podeAcao(membership.papel, "documentos", "criar")) {
      return { success: false, error: "Apenas síndico ou subsíndico podem cadastrar documentos." };
    }

    const parsed = documentoSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Dados inválidos." };
    }

    const documento = await prisma.documento.create({
      data: {
        condominioId,
        categoria: parsed.data.categoria,
        titulo: parsed.data.titulo,
        arquivoUrl: parsed.data.arquivoUrl,
        visivelPara: parsed.data.visivelPara,
      },
    });

    revalidatePath(`/${condominioId}/documentos`);
    return { success: true, data: documento };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao cadastrar documento.";
    return { success: false, error: msg };
  }
}

export async function excluirDocumento(condominioId: string, documentoId: string) {
  try {
    const statusAcesso = await verificarAcesso(condominioId, "DOCUMENTOS");
    if (statusAcesso !== "LIBERADO") {
      return {
        success: false,
        codigo: statusAcesso,
        error: "Módulo Documentos não contratado.",
      };
    }

    const { membership } = await requireAuthMembership(condominioId);
    if (!podeAcao(membership.papel, "documentos", "excluir")) {
      return { success: false, error: "Apenas síndico ou subsíndico podem excluir documentos." };
    }

    await prisma.documento.deleteMany({
      where: {
        id: documentoId,
        condominioId,
      },
    });

    revalidatePath(`/${condominioId}/documentos`);
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao excluir documento.";
    return { success: false, error: msg };
  }
}
