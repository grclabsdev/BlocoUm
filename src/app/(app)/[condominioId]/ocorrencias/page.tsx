import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { listarOcorrencias } from "@/server/actions/ocorrencias";
import { NovaOcorrenciaDialog } from "./nova-ocorrencia-dialog";
import { OcorrenciasList } from "./ocorrencias-list";

export default async function OcorrenciasPage({
  params,
}: {
  params: Promise<{ condominioId: string }>;
}) {
  const resolvedParams = await params;
  const condominioId = resolvedParams.condominioId;

  const res = await listarOcorrencias(condominioId);

  if (!res.success || !res.data) {
    return <ErrorState message={res.error || "Erro ao carregar ocorrências."} />;
  }

  const { ocorrencias, papel } = res.data;

  return (
    <div className="space-y-6">
      <PageHeader
        heading="Ocorrências & Chamados"
        subheading="Abertura de chamados, fluxo de atendimento e acompanhamento de manutenções."
      >
        <NovaOcorrenciaDialog condominioId={condominioId} />
      </PageHeader>

      <OcorrenciasList
        ocorrencias={ocorrencias}
        papel={papel}
        condominioId={condominioId}
      />
    </div>
  );
}
