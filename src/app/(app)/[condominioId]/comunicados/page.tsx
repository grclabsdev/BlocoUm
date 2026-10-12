import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { listarComunicados } from "@/server/actions/comunicados";
import { listarEstrutural } from "@/server/actions/estrutural";
import { NovoComunicadoDialog } from "./novo-comunicado-dialog";
import { ComunicadosList } from "./comunicados-list";

export default async function ComunicadosPage({
  params,
}: {
  params: Promise<{ condominioId: string }>;
}) {
  const resolvedParams = await params;
  const condominioId = resolvedParams.condominioId;

  const [resCom, resEst] = await Promise.all([
    listarComunicados(condominioId),
    listarEstrutural(condominioId),
  ]);

  if (!resCom.success || !resCom.data) {
    return <ErrorState message={resCom.error || "Erro ao carregar comunicados."} />;
  }

  const { comunicados, podeCriar } = resCom.data;
  const blocos = resEst.data?.blocos || [];

  return (
    <div className="space-y-6">
      <PageHeader
        heading="Mural de Comunicados"
        subheading="Avisos oficiais, notificações e comunicados do condomínio."
      >
        {podeCriar && (
          <NovoComunicadoDialog
            condominioId={condominioId}
            blocos={blocos}
          />
        )}
      </PageHeader>

      <ComunicadosList
        comunicados={comunicados}
        podeCriar={podeCriar}
        condominioId={condominioId}
      />
    </div>
  );
}
