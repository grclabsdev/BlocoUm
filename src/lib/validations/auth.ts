import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "O e-mail é obrigatório")
    .email("E-mail inválido"),
  password: z
    .string()
    .min(6, "A senha deve ter pelo menos 6 caracteres"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const conviteSchema = z.object({
  unidadeId: z.string().min(1, "Selecione uma unidade"),
  email: z.string().min(1, "E-mail é obrigatório").email("E-mail inválido"),
  tipoOcupacao: z.enum(["PROPRIETARIO", "INQUILINO", "DEPENDENTE"]),
});

export type ConviteInput = z.infer<typeof conviteSchema>;

export const aceitarConviteSchema = z.object({
  token: z.string().min(1, "Token de convite obrigatório"),
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres"),
});

export type AceitarConviteInput = z.infer<typeof aceitarConviteSchema>;
