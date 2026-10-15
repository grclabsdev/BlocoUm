import { Building, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { listarReservas } from "@/server/actions/reservas";
import { NovaAreaDialog } from "./nova-area-dialog";
import { NovaReservaDialog } from "./nova-reserva-dialog";
import { ReservasTable } from "./reservas-table";

export default async function ReservasPage({
  params,
}: {
  params: Promise<{ condominioId: string }>;
}) {
  const resolvedParams = await params;
  const condominioId = resolvedParams.condominioId;

  const res = await listarReservas(condominioId);

  if (!res.success || !res.data) {
    return <ErrorState message={res.error || "Erro ao carregar reservas."} />;
  }

  const { areas, reservas, unidades, papel, usuarioUnidadeId, userId } = res.data;
  const isSindico = ["SINDICO", "SUBSINDICO"].includes(papel);

  return (
    <div className="space-y-6">
      <PageHeader
        heading="Áreas Comuns & Reservas"
        subheading="Agendamento de espaços compartilhados com checagem de agenda e antecedência."
      >
        <div className="flex items-center gap-2 flex-wrap">
          {isSindico && <NovaAreaDialog condominioId={condominioId} />}

          {areas.length > 0 && (
            <NovaReservaDialog
              condominioId={condominioId}
              areas={areas}
              unidades={unidades}
              usuarioUnidadeId={usuarioUnidadeId ?? undefined}
              isSindico={isSindico}
            />
          )}
        </div>
      </PageHeader>

      {/* Cards das Áreas Comuns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {areas.map((area: any) => {
          const reservasAtivas = reservas.filter(
            (r: any) => r.areaComumId === area.id && r.status === "CONFIRMADA"
          ).length;

          return (
            <Card key={area.id} className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold">{area.nome}</CardTitle>
                  <Building className="h-4 w-4 text-primary" />
                </div>
                <CardDescription className="flex items-center gap-1 text-xs">
                  <Clock className="h-3.5 w-3.5" />
                  Antecedência mínima: {area.antecedenciaMinHrs} horas
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <Badge variant="outline" className="text-xs">
                  {reservasAtivas} reserva(s) confirmada(s)
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabela de Reservas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Agenda de Reservas</CardTitle>
          <CardDescription>
            Histórico e próximos agendamentos de áreas comuns do condomínio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReservasTable
            reservas={reservas}
            isSindico={isSindico}
            userId={userId}
            usuarioUnidadeId={usuarioUnidadeId ?? undefined}
            condominioId={condominioId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
