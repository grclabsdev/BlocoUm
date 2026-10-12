import { z } from "zod";

export const comunicadoSchema = z.object({
  titulo: z.string().min(3, "Título deve ter no mínimo 3 caracteres").max(120, "Título muito longo"),
  corpo: z.string().min(10, "Mensagem do comunicado deve ter no mínimo 10 caracteres"),
  blocoId: z.string().nullable().optional(),
});

export type ComunicadoInput = z.infer<typeof comunicadoSchema>;
