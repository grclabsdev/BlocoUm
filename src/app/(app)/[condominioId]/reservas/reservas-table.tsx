"use client";

import { useTransition } from "react";
import { XCircle, CalendarCheck2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDataHora } from "@/lib/formatters";
import { cancelarReserva } from "@/server/actions/reservas";

export function ReservasTable({
  reservas,
  isSindico,
  userId,
  usuarioUnidadeId,
  condominioId,
  onNovaReserva,
}: {
  reservas: any[];
  isSindico: boolean;
  userId: string;
  usuarioUnidadeId?: string;
  condominioId: string;
  onNovaReserva?: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleCancelar(reservaId: string) {
    if (!confirm("Tem certeza que deseja cancelar esta reserva?")) return;
    startTransition(async () => {
      const res = await cancelarReserva(condominioId, reservaId);
      if (!res.success) {
        toast.error(res.error || "Erro ao cancelar reserva.");
      } else {
        toast.success("Reserva cancelada com sucesso.");
      }
    });
  }

  if (reservas.length === 0) {
    return (
      <EmptyState
        icon={CalendarCheck2}
        title="Nenhuma reserva agendada"
        description="Selecione um espaço para fazer seu agendamento."
        actionLabel="Agendar primeira reserva"
        onAction={onNovaReserva}
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Espaço</TableHead>
          <TableHead>Unidade</TableHead>
          <TableHead>Início</TableHead>
          <TableHead>Término</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reservas.map((r: any) => {
          const isCancelada = r.status === "CANCELADA";
          const podeCancelar =
            !isCancelada &&
            (isSindico ||
              r.criadoPor === userId ||
              r.unidadeId === usuarioUnidadeId);

          return (
            <TableRow key={r.id}>
              <TableCell className="font-semibold text-foreground">
                {r.areaComum.nome}
              </TableCell>
              <TableCell>
                {r.unidade.identificador}
                {r.unidade.bloco ? ` (${r.unidade.bloco.nome})` : ""}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {formatDataHora(r.inicio)}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {formatDataHora(r.fim)}
              </TableCell>
              <TableCell>
                <Badge
                  variant={isCancelada ? "destructive" : "success"}
                  className="text-xs"
                >
                  {r.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {podeCancelar && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCancelar(r.id)}
                    disabled={isPending}
                    className="h-8 text-xs text-destructive hover:bg-destructive/10"
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1" />
                    Cancelar
                  </Button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
