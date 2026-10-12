"use client";

import { useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoeda, formatData } from "@/lib/formatters";
import { registrarPagamentoCobranca } from "@/server/actions/financeiro";

export interface CobrancaItem {
  id: string;
  competencia: Date | string;
  vencimento: Date | string;
  valorOriginal: number;
  valorAtual: number;
  status: string;
  pagoEm?: Date | string | null;
  unidade: {
    identificador: string;
    bloco?: {
      nome: string;
    } | null;
  };
}

interface CobrancasTableProps {
  cobrancas: CobrancaItem[];
  isSindico: boolean;
  condominioId: string;
}

export function CobrancasTable({
  cobrancas,
  isSindico,
  condominioId,
}: CobrancasTableProps) {
  const [isPending, startTransition] = useTransition();

  function handleMarcarPago(cobrancaId: string) {
    startTransition(async () => {
      const res = await registrarPagamentoCobranca(condominioId, { cobrancaId });
      if (!res.success) {
        toast.error(res.error || "Erro ao registrar pagamento.");
      } else {
        toast.success("Pagamento registrado com sucesso!");
      }
    });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Unidade</TableHead>
          <TableHead>Competência</TableHead>
          <TableHead>Vencimento</TableHead>
          <TableHead>Valor Original</TableHead>
          <TableHead>Valor Atual</TableHead>
          <TableHead>Status</TableHead>
          {isSindico && <TableHead className="text-right">Ação</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {cobrancas.map((c) => {
          const isAtrasado = c.status === "ATRASADO";
          const isPago = c.status === "PAGO";
          return (
            <TableRow key={c.id}>
              <TableCell className="font-semibold text-foreground">
                {c.unidade.identificador}
                {c.unidade.bloco ? ` (${c.unidade.bloco.nome})` : ""}
              </TableCell>
              <TableCell>{formatData(c.competencia)}</TableCell>
              <TableCell>{formatData(c.vencimento)}</TableCell>
              <TableCell className="text-muted-foreground">
                {formatMoeda(c.valorOriginal)}
              </TableCell>
              <TableCell className="font-bold">
                {formatMoeda(c.valorAtual)}
                {isAtrasado && (
                  <span className="block text-[10px] text-destructive font-normal">
                    Incide multa (2%) e juros (1% a.m.)
                  </span>
                )}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    isPago ? "success" : isAtrasado ? "destructive" : "outline"
                  }
                >
                  {c.status}
                </Badge>
              </TableCell>
              {isSindico && (
                <TableCell className="text-right">
                  {!isPago && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarcarPago(c.id)}
                      disabled={isPending}
                      className="h-8 gap-1.5 text-xs border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Marcar pago
                    </Button>
                  )}
                  {isPago && c.pagoEm && (
                    <span className="text-xs text-muted-foreground">
                      Pago em {formatData(c.pagoEm)}
                    </span>
                  )}
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
