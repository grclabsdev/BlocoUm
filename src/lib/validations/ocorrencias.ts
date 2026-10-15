import { z } from "zod";

export const ocorrenciaSchema = z.object({
  unidadeId: z.string().nullable().optional(),
  categoria: z.string().min(2, "Informe a categoria (ex: Manutenção, Barulho, Portaria)"),
  titulo: z.string().min(3, "Título deve ter no mínimo 3 caracteres").max(100),
  descricao: z.string().min(10, "Descreva a ocorrência com pelo menos 10 caracteres"),
});

export type OcorrenciaInput = z.infer<typeof ocorrenciaSchema>;

export const alterarStatusOcorrenciaSchema = z.object({
  ocorrenciaId: z.string().min(1, "ID da ocorrência obrigatório"),
  novoStatus: z.enum(["ABERTA", "EM_ANDAMENTO", "RESOLVIDA", "CANCELADA"]),
  motivo: z.string().optional(),
});

export type AlterarStatusOcorrenciaInput = z.infer<typeof alterarStatusOcorrenciaSchema>;

export const comentarioOcorrenciaSchema = z.object({
  ocorrenciaId: z.string().min(1, "ID da ocorrência obrigatório"),
  texto: z.string().min(2, "Comentário não pode estar vazio"),
});

export type ComentarioOcorrenciaInput = z.infer<typeof comentarioOcorrenciaSchema>;
