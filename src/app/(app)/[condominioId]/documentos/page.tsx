import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { listarDocumentos } from "@/server/actions/documentos";
import { NovoDocumentoDialog } from "./novo-documento-dialog";
import { DocumentosTabs } from "./documentos-tabs";

export default async function DocumentosPage({
  params,
}: {
  params: Promise<{ condominioId: string }>;
}) {
  const resolvedParams = await params;
  const condominioId = resolvedParams.condominioId;

  const res = await listarDocumentos(condominioId);

  if (!res.success || !res.data) {
    return <ErrorState message={res.error || "Erro ao carregar documentos."} />;
  }

  const { documentos, podeGerenciar } = res.data;

  return (
    <div className="space-y-6">
      <PageHeader
        heading="Repositório de Documentos"
        subheading="Convenção, regimento interno, atas de assembleia e pareceres do conselho."
      >
        {podeGerenciar && <NovoDocumentoDialog condominioId={condominioId} />}
      </PageHeader>

      <DocumentosTabs
        documentos={documentos}
        podeGerenciar={podeGerenciar}
        condominioId={condominioId}
      />
    </div>
  );
}
