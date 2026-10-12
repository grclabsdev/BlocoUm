import { z } from "zod";

export const onboardingCondominioSchema = z.object({
  // Dados do Administrador/Síndico
  admin: z.object({
    nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
    email: z.string().email("E-mail inválido"),
    password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres").optional(),
  }),

  // Dados do Condomínio
  condominio: z.object({
    nome: z.string().min(3, "Nome do condomínio deve ter pelo menos 3 caracteres"),
    cnpj: z.string().optional(),
    endereco: z.string().min(5, "Endereço completo é obrigatório"),
    diaVencimento: z.number().int().min(1).max(28).default(10),
    rateioTipo: z.enum(["FRACAO_IDEAL", "IGUALITARIO"]).default("FRACAO_IDEAL"),
  }),

  // Blocos (opcional se for torre única)
  blocos: z
    .array(
      z.object({
        nome: z.string().min(1, "Nome do bloco é obrigatório"),
      })
    )
    .default([]),

  // Unidades habitacionais
  unidades: z
    .array(
      z.object({
        identificador: z.string().min(1, "Identificador da unidade é obrigatório"),
        blocoNome: z.string().optional(),
        fracaoIdeal: z.number().positive().max(100).optional(),
      })
    )
    .min(1, "Cadastre pelo menos 1 unidade no condomínio"),

  // Convites iniciais de moradores
  convites: z
    .array(
      z.object({
        email: z.string().email("E-mail inválido"),
        unidadeIdentificador: z.string().min(1, "Selecione a unidade"),
        tipoOcupacao: z.enum(["PROPRIETARIO", "INQUILINO", "DEPENDENTE"]).default("PROPRIETARIO"),
      })
    )
    .default([]),
});

export type OnboardingCondominioInput = z.infer<typeof onboardingCondominioSchema>;

