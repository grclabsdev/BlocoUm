import { z } from "zod";

export const condominioConfigSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  cnpj: z.string().nullable().optional(),
  endereco: z.string().min(5, "Endereço deve ter pelo menos 5 caracteres"),
  rateioTipo: z.enum(["FRACAO_IDEAL", "IGUALITARIO"]),
  diaVencimento: z.number().int().min(1).max(31),
  multaAtrasoPct: z.number().min(0).max(100),
  jurosMesPct: z.number().min(0).max(100),
});

export type CondominioConfigInput = z.infer<typeof condominioConfigSchema>;

export const membershipPapelSchema = z.object({
  membershipId: z.string().min(1, "ID do membro obrigatório"),
  papel: z.enum(["SINDICO", "SUBSINDICO", "CONSELHEIRO", "MORADOR", "FUNCIONARIO"]),
  ativo: z.boolean(),
});

export type MembershipPapelInput = z.infer<typeof membershipPapelSchema>;
