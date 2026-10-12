import { z } from "zod";

export const documentoSchema = z.object({
  categoria: z.enum(["ATA", "REGIMENTO", "CONVENCAO", "OUTRO"]),
  titulo: z.string().min(3, "Título deve ter no mínimo 3 caracteres").max(120),
  arquivoUrl: z.string().min(1, "URL ou arquivo obrigatório"),
  visivelPara: z.enum(["TODOS", "CONSELHO"]),
});

export type DocumentoInput = z.infer<typeof documentoSchema>;
