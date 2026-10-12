import { z } from "zod";

export const lancamentoCategoriaSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  tipo: z.enum(["RECEITA", "DESPESA"]),
});

export type LancamentoCategoriaInput = z.infer<typeof lancamentoCategoriaSchema>;

export const lancamentoSchema = z.object({
  categoriaId: z.string().min(1, "Selecione uma categoria"),
  tipo: z.enum(["RECEITA", "DESPESA"]),
  descricao: z.string().min(3, "Descrição deve ter pelo menos 3 caracteres"),
  valor: z.number().positive("O valor deve ser maior que zero"),
  data: z.string().min(1, "Data é obrigatória"),
});

export type LancamentoInput = z.infer<typeof lancamentoSchema>;

export const gerarCobrancasMesSchema = z.object({
  competencia: z.string().min(7, "Selecione o mês de competência (ex: 2026-09)"),
  diaVencimento: z.number().int().min(1).max(31),
  valorTotalRateio: z.number().positive("O valor total do rateio deve ser maior que zero"),
});

export type GerarCobrancasMesInput = z.infer<typeof gerarCobrancasMesSchema>;

export const marcarPagamentoSchema = z.object({
  cobrancaId: z.string().min(1, "ID da cobrança obrigatório"),
  pagoEm: z.string().optional(),
});

export type MarcarPagamentoInput = z.infer<typeof marcarPagamentoSchema>;
