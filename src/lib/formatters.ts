import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const moedaFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatMoeda(valor: number | string | { toString(): string } | null | undefined): string {
  if (valor === null || valor === undefined) return "R$ 0,00";
  const num = typeof valor === "number" ? valor : Number(valor.toString());
  if (isNaN(num)) return "R$ 0,00";
  return moedaFormatter.format(num);
}

export function formatData(data: Date | string | null | undefined): string {
  if (!data) return "-";
  const d = typeof data === "string" ? parseISO(data) : data;
  return format(d, "dd/MM/yyyy", { locale: ptBR });
}

export function formatDataHora(data: Date | string | null | undefined): string {
  if (!data) return "-";
  const d = typeof data === "string" ? parseISO(data) : data;
  return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

export function formatHora(data: Date | string | null | undefined): string {
  if (!data) return "-";
  const d = typeof data === "string" ? parseISO(data) : data;
  return format(d, "HH:mm", { locale: ptBR });
}

export function formatPercentual(valor: number | string | { toString(): string } | null | undefined, casas = 1): string {
  if (valor === null || valor === undefined) return "0,0%";
  const num = typeof valor === "number" ? valor : Number(valor.toString());
  if (isNaN(num)) return "0,0%";
  return `${num.toFixed(casas).replace(".", ",")}%`;
}
