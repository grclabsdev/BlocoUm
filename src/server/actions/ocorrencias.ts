"use server";

import { revalidatePath } from "next/cache";
import prisma, { StatusOcorrencia } from "@/lib/db/prisma";
import { requireAuthMembership } from "@/lib/auth/session";
import { podeAcao } from "@/lib/permissions";
import {
  ocorrenciaSchema,
  alterarStatusOcorrenciaSchema,
  comentarioOcorrenciaSchema,
} from "@/lib/validations/ocorrencias";
import { verificarAcesso } from "@/lib/billing/verificar-acesso";

export async function listarOcorrencias(condominioId: string) {
  try {
    const { session, membership, moradorPerfil } = await requireAuthMembership(condominioId);
    if (!podeAcao(membership.papel, "ocorrencias", "visualizar")) {
      return { success: false, error: "Permissão insuficiente para ver chamados/ocorrências." };
    }

    const isMorador = membership.papel === "MORADOR";

    // Morador vê ocorrências abertas por ele ou por sua unidade
    const whereFiltro = isMorador
      ? {
          condominioId,
          OR: [
            { criadoPor: session.user.id },
            { unidadeId: moradorPerfil?.unidadeId ?? "__none__" },
          ],
        }
      : { condominioId };

    const todas = await prisma.ocorrencia.findMany({
      where: whereFiltro,
      include: {
        unidade: { include: { bloco: true } },
        comentarios: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    // Ordenação de prioridade da regra de negócio:
    // ABERTA e EM_ANDAMENTO primeiro (mais antigas no topo)
    // RESOLVIDA e CANCELADA depois (mais recentes no topo)
    const prioridadeStatus: Record<StatusOcorrencia, number> = {
      ABERTA: 1,
      EM_ANDAMENTO: 2,
      RESOLVIDA: 3,
      CANCELADA: 4,
    };

    todas.sort((a, b) => {
      const pA = prioridadeStatus[a.status];
      const pB = prioridadeStatus[b.status];
      if (pA <= 2 && pB <= 2) {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (pA > 2 && pB > 2) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return pA - pB;
    });

    return {
      success: true,
      data: {
        ocorrencias: todas,
        papel: membership.papel,
        userId: session.user.id,
      },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao carregar ocorrências.";
    return { success: false, error: msg };
  }
}

export async function criarOcorrencia(condominioId: string, input: unknown) {
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
    if (!podeAcao(membership.papel, "ocorrencias", "criar")) {
      return { success: false, error: "Permissão insuficiente para abrir ocorrência." };
    }

    const parsed = ocorrenciaSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Dados inválidos." };
    }

    const unidadeIdFinal =
      membership.papel === "MORADOR"
        ? moradorPerfil?.unidadeId || null
        : parsed.data.unidadeId || null;

    const ocorrencia = await prisma.ocorrencia.create({
      data: {
        condominioId,
        unidadeId: unidadeIdFinal,
        categoria: parsed.data.categoria,
        titulo: parsed.data.titulo,
        descricao: parsed.data.descricao,
        status: StatusOcorrencia.ABERTA,
        criadoPor: session.user.id,
      },
    });

    // Cria comentário inicial de abertura
    await prisma.ocorrenciaComentario.create({
      data: {
        ocorrenciaId: ocorrencia.id,
        autorId: session.user.id,
        texto: `Chamado aberto: "${parsed.data.titulo}"`,
      },
    });

    revalidatePath(`/${condominioId}/ocorrencias`);
    return { success: true, data: ocorrencia };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao criar ocorrência.";
    return { success: false, error: msg };
  }
}

export async function alterarStatusOcorrencia(condominioId: string, input: unknown) {
  try {
    const statusAcesso = await verificarAcesso(condominioId, "NUCLEO");
    if (statusAcesso !== "LIBERADO") {
      return {
        success: false,
        codigo: statusAcesso,
        error: "Período gratuito encerrado. Assine o plano para continuar.",
      };
    }

    const { session, membership } = await requireAuthMembership(condominioId);

    // Morador não pode alterar status
    if (membership.papel === "MORADOR") {
      return { success: false, error: "Moradores não podem alterar o status de chamados." };
    }

    const parsed = alterarStatusOcorrenciaSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Dados inválidos." };
    }

    const ocorrencia = await prisma.ocorrencia.findFirst({
      where: { id: parsed.data.ocorrenciaId, condominioId },
    });
    if (!ocorrencia) {
      return { success: false, error: "Ocorrência não encontrada." };
    }

    const statusAtual = ocorrencia.status;
    const novo = parsed.data.novoStatus as StatusOcorrencia;

    // Regra estrita de transição: ABERTA -> RESOLVIDA não é permitida sem passar por EM_ANDAMENTO
    if (statusAtual === StatusOcorrencia.ABERTA && novo === StatusOcorrencia.RESOLVIDA) {
      return {
        success: false,
        error: "Não é permitido pular direto de ABERTA para RESOLVIDA. A ocorrência deve primeiro passar por EM_ANDAMENTO para confirmar atendimento.",
      };
    }

    // Se CANCELADA, exige justificativa
    if (novo === StatusOcorrencia.CANCELADA && (!parsed.data.motivo || parsed.data.motivo.trim().length < 5)) {
      return {
        success: false,
        error: "Para cancelar uma ocorrência é obrigatório informar o motivo (mínimo 5 caracteres).",
      };
    }

    const atualizada = await prisma.ocorrencia.update({
      where: { id: ocorrencia.id },
      data: {
        status: novo,
        atribuidoA: ocorrencia.atribuidoA ?? session.user.id, // auto-atribui se não houver responsável
      },
    });

    // Registra comentário do sistema auditável descrevendo a transição
    const textoAuditoria =
      novo === StatusOcorrencia.CANCELADA
        ? `Status alterado de ${statusAtual} para ${novo}. Motivo: ${parsed.data.motivo}`
        : `Status alterado de ${statusAtual} para ${novo} por ${session.user.name || "responsável"}.`;

    await prisma.ocorrenciaComentario.create({
      data: {
        ocorrenciaId: ocorrencia.id,
        autorId: session.user.id,
        texto: textoAuditoria,
      },
    });

    revalidatePath(`/${condominioId}/ocorrencias`);
    return { success: true, data: atualizada };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao alterar status.";
    return { success: false, error: msg };
  }
}

export async function adicionarComentarioOcorrencia(condominioId: string, input: unknown) {
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

    const parsed = comentarioOcorrenciaSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Comentário inválido." };
    }

    const ocorrencia = await prisma.ocorrencia.findFirst({
      where: { id: parsed.data.ocorrenciaId, condominioId },
    });
    if (!ocorrencia) {
      return { success: false, error: "Ocorrência não encontrada." };
    }

    // Se morador, só pode comentar na própria ocorrência
    if (membership.papel === "MORADOR") {
      const isProprio =
        ocorrencia.criadoPor === session.user.id ||
        ocorrencia.unidadeId === moradorPerfil?.unidadeId;
      if (!isProprio) {
        return { success: false, error: "Você só pode comentar em suas próprias ocorrências." };
      }
    }

    const comentario = await prisma.ocorrenciaComentario.create({
      data: {
        ocorrenciaId: ocorrencia.id,
        autorId: session.user.id,
        texto: parsed.data.texto,
      },
    });

    revalidatePath(`/${condominioId}/ocorrencias`);
    return { success: true, data: comentario };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao comentar na ocorrência.";
    return { success: false, error: msg };
  }
}
