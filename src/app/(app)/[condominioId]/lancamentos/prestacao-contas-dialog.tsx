"use client";

import { useState, useTransition } from "react";
import { FileText } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoeda } from "@/lib/formatters";
import { obterPrestacaoContas } from "@/server/actions/financeiro";

export function PrestacaoContasDialog({ condominioId }: { condominioId: string }) {
  const [aberto, setAberto] = useState(false);
  const [isPending, startTransition] = useTransition();

  const hoje = new Date();
  const [inicio, setInicio] = useState(
    new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1).toISOString().split("T")[0]
  );
  const [fim, setFim] = useState(hoje.toISOString().split("T")[0]);
  const [resultado, setResultado] = useState<any>(null);

  function carregarPrestacao() {
    startTransition(async () => {
      const res = await obterPrestacaoContas(condominioId, inicio, fim);
      if (!res.success) {
        toast.error(res.error || "Erro ao carregar prestação.");
      } else {
        setResultado(res.data);
      }
    });
  }

  return (
    <Dialog
      open={aberto}
      onOpenChange={(v) => {
        setAberto(v);
        if (v && !resultado) carregarPrestacao();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <FileText className="h-4 w-4" />
          Prestação de Contas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Prestação de Contas do Período</DialogTitle>
          <DialogDescription>
            Resumo contábil por categoria para apresentação e assembleia.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex gap-3 items-end">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Data Inicial</Label>
              <Input
                type="date"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Data Final</Label>
              <Input
                type="date"
                value={fim}
                onChange={(e) => setFim(e.target.value)}
              />
            </div>
            <Button
              type="button"
              onClick={carregarPrestacao}
              disabled={isPending}
            >
              {isPending ? "Filtrando..." : "Filtrar"}
            </Button>
          </div>

          {resultado && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-emerald-500/10 p-3 border border-emerald-500/20">
                  <p className="text-xs text-muted-foreground">Total Receitas</p>
                  <p className="text-lg font-bold text-emerald-600">
                    {formatMoeda(resultado.totalReceitas)}
                  </p>
                </div>
                <div className="rounded-lg bg-destructive/10 p-3 border border-destructive/20">
                  <p className="text-xs text-muted-foreground">Total Despesas</p>
                  <p className="text-lg font-bold text-destructive">
                    {formatMoeda(resultado.totalDespesas)}
                  </p>
                </div>
                <div className="rounded-lg bg-muted p-3 border">
                  <p className="text-xs text-muted-foreground">Saldo do Período</p>
                  <p className="text-lg font-bold text-foreground">
                    {formatMoeda(resultado.saldoFinal)}
                  </p>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resultado.categorias.map((cat: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{cat.nome}</TableCell>
                        <TableCell>
                          <Badge
                            variant={cat.tipo === "RECEITA" ? "success" : "destructive"}
                            className="text-xs"
                          >
                            {cat.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatMoeda(cat.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
