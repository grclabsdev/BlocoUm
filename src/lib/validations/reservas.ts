import { z } from "zod";

export const areaComumSchema = z.object({
  nome: z.string().min(2, "Nome da área deve ter pelo menos 2 caracteres").max(80),
  antecedenciaMinHrs: z
    .number()
    .int("Deve ser um número inteiro de horas")
    .nonnegative("A antecedência não pode ser negativa"),
});

export type AreaComumInput = z.infer<typeof areaComumSchema>;

export const reservaSchema = z
  .object({
    areaComumId: z.string().min(1, "Selecione a área comum"),
    unidadeId: z.string().min(1, "Selecione a unidade"),
    inicio: z.string().min(1, "Horário de início obrigatório"),
    fim: z.string().min(1, "Horário de término obrigatório"),
  })
  .refine(
    (data) => new Date(data.fim).getTime() > new Date(data.inicio).getTime(),
    {
      message: "O horário de término deve ser após o horário de início",
      path: ["fim"],
    }
  );

export type ReservaInput = z.infer<typeof reservaSchema>;
