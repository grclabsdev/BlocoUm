import { z } from "zod";

export const blocoSchema = z.object({
  nome: z
    .string()
    .min(2, "Nome do bloco deve ter pelo menos 2 caracteres")
    .max(50, "Nome muito longo"),
});

export type BlocoInput = z.infer<typeof blocoSchema>;

export const unidadeSchema = z.object({
  blocoId: z.string().nullable().optional(),
  identificador: z
    .string()
    .min(1, "Identificador é obrigatório (ex: Apto 101)")
    .max(30, "Identificador muito longo"),
  fracaoIdeal: z
    .number()
    .positive("A fração ideal deve ser maior que zero")
    .max(100, "A fração ideal não pode exceder 100%"),
});

export type UnidadeInput = z.infer<typeof unidadeSchema>;

export const moradorPerfilSchema = z.object({
  unidadeId: z.string().min(1, "Selecione a unidade"),
  userId: z.string().min(1, "Selecione o usuário"),
  tipoOcupacao: z.enum(["PROPRIETARIO", "INQUILINO", "DEPENDENTE"]),
});

export type MoradorPerfilInput = z.infer<typeof moradorPerfilSchema>;
