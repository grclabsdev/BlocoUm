"use client";

import { useTransition } from "react";
import { Megaphone, CheckCircle2, Building, Calendar, Eye } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDataHora } from "@/lib/formatters";
import { confirmarLeituraComunicado } from "@/server/actions/comunicados";

export function ComunicadosList({
  comunicados,
  podeCriar,
  condominioId,
  onNovoClick,
}: {
  comunicados: any[];
  podeCriar: boolean;
  condominioId: string;
  onNovoClick?: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleConfirmarLeitura(comunicadoId: string) {
    startTransition(async () => {
      const res = await confirmarLeituraComunicado(condominioId, comunicadoId);
      if (!res.success) {
        toast.error(res.error || "Erro ao confirmar leitura.");
      } else {
        toast.success("Leitura confirmada!");
      }
    });
  }

  if (comunicados.length === 0) {
    return (
      <EmptyState
        icon={Megaphone}
        title="Nenhum comunicado publicado"
        description="Publique o primeiro aviso para os moradores ficarem informados sobre as novidades do condomínio."
        actionLabel={podeCriar ? "Novo comunicado" : undefined}
        onAction={onNovoClick}
      />
    );
  }

  return (
    <div className="space-y-4">
      {comunicados.map((c) => (
        <Card key={c.id} className="overflow-hidden transition hover:shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant={c.blocoId ? "outline" : "default"}
                    className="text-xs gap-1"
                  >
                    <Building className="h-3 w-3" />
                    {c.blocoNome}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDataHora(c.publicadoEm)}
                  </span>
                </div>
                <CardTitle className="text-lg font-bold pt-1 text-foreground">
                  {c.titulo}
                </CardTitle>
              </div>

              {podeCriar && (
                <div className="flex items-center gap-2 bg-muted/60 px-3 py-1.5 rounded-lg border text-xs text-muted-foreground">
                  <Eye className="h-3.5 w-3.5 text-primary" />
                  <span>
                    <strong className="text-foreground">{c.pctLeituras}%</strong> leram (
                    {c.totalLeituras})
                  </span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
              {c.corpo}
            </p>
          </CardContent>
          <CardFooter className="bg-muted/20 border-t py-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {c.lidoPorMim
                ? "✓ Você confirmou a leitura deste comunicado."
                : "Você ainda não confirmou a leitura."}
            </span>

            {!c.lidoPorMim && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleConfirmarLeitura(c.id)}
                disabled={isPending}
                className="gap-1.5 text-xs text-primary border-primary/30 hover:bg-primary/10"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Confirmar Leitura
              </Button>
            )}
            {c.lidoPorMim && (
              <Badge variant="success" className="text-xs gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Leitura Confirmada
              </Badge>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
